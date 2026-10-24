#!/usr/bin/env bash

set -euo pipefail

readonly ACCOUNT_ID="971579260814"
readonly SOURCE_REGION="us-east-2"
readonly TARGET_REGION="us-east-1"
readonly IAM_SERVICE_ROLE="arn:aws:iam::${ACCOUNT_ID}:role/amplify-role"
readonly REPOSITORY="https://github.com/brianwhaley/pixelated-tech"
readonly MAX_POLL_ATTEMPTS=60
readonly POLL_INTERVAL_SECONDS=10
readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly REPOSITORY_ROOT="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"
readonly SITES_CONFIG_FILE="${REPOSITORY_ROOT}/apps/pixelated-admin/src/app/data/sites.json"
readonly COMPONENTS_CONFIG_FILE="${REPOSITORY_ROOT}/packages/pixelated-components/src/config/pixelated.config.json"

SITE_NAME=""
APP_ROOT=""
DOMAIN_NAME=""
HOSTED_ZONE_ID=""
OLD_APP_ID=""
ENV_FILE=""

environment_input=""
access_token=""
aws_access_key_id=""
aws_secret_access_key=""
aws_session_token=""
custom_rules='[]'
environment_variables='{}'
old_domain_association=''
old_dns_records='[]'
old_record_sets='[]'
new_domain_association=''
new_dns_records='[]'
new_record_sets='[]'
target_app_id=''
current_step='startup'
resume_dns=0
site_config=''

usage() {
	cat <<'EOF'
Usage: migrate-amplify-site.sh SITE_NAME

Options:
	--resume-dns                 Resume an existing migration at the DNS cutover.
	--help                       Show this help text.
EOF
}

fail() {
	printf 'FAILURE [%s]: %s\n' "$current_step" "$1" >&2
	exit 1
}

report_unexpected_failure() {
	local error_code=$?
	printf 'FAILURE [%s]: command exited with status %s\n' "$current_step" "$error_code" >&2
	exit "$error_code"
}

cleanup() {
	if [[ -n "$environment_input" && -f "$environment_input" ]]; then
		rm -f -- "$environment_input"
	fi
}

trap cleanup EXIT
trap report_unexpected_failure ERR

run_step() {
	local label="$1"
	shift
	current_step="$label"
	printf 'START [%s]\n' "$label"
	"$@"
	printf 'SUCCESS [%s]\n' "$label"
}

require_command() {
	command -v "$1" >/dev/null 2>&1 || fail "Required command not found: $1"
}

load_site_configuration() {
	[[ -f "$SITES_CONFIG_FILE" ]] || fail "Sites config not found: $SITES_CONFIG_FILE"
	site_config="$(jq -e --arg site_name "$SITE_NAME" '.sites[] | select(.name == $site_name)' "$SITES_CONFIG_FILE")" || fail "Site not found in sites.json: $SITE_NAME"
	APP_ROOT="$(jq -r '.localPath // empty' <<< "$site_config")"
	DOMAIN_NAME="$(jq -r '.url // empty | sub("^https?://"; "") | sub("/$"; "") | sub("^www\\."; "")' <<< "$site_config")"
	HOSTED_ZONE_ID="$(jq -r '.rte53HostedZoneID // empty' <<< "$site_config")"
	OLD_APP_ID="$(jq -r '.amplifyAppId // empty' <<< "$site_config")"
	ENV_FILE="${APP_ROOT}/.env.local"
	[[ -n "$APP_ROOT" ]] || fail "Site has no localPath: $SITE_NAME"
	[[ -n "$DOMAIN_NAME" ]] || fail "Site has no url: $SITE_NAME"
	[[ -n "$HOSTED_ZONE_ID" ]] || fail "Site has no rte53HostedZoneID: $SITE_NAME"
	[[ -n "$OLD_APP_ID" ]] || fail "Site has no amplifyAppId: $SITE_NAME"
	printf 'Loaded site configuration for %s from %s\n' "$SITE_NAME" "$SITES_CONFIG_FILE"
}

read_environment_variables() {
	local line key value
	while IFS= read -r line || [[ -n "$line" ]]; do
		line="${line#"${line%%[![:space:]]*}"}"
		[[ -z "$line" || "${line:0:1}" == "#" ]] && continue
		if [[ "$line" == export\ * ]]; then
			line="${line#export }"
		fi
		[[ "$line" == *=* ]] || fail "Invalid environment entry in $ENV_FILE"
		key="${line%%=*}"
		value="${line#*=}"
		key="${key%"${key##*[![:space:]]}"}"
		[[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || fail "Invalid environment variable name: $key"
		if [[ "${value:0:1}" == '"' && "${value: -1}" == '"' ]]; then
			value="${value:1:${#value}-2}"
		elif [[ "${value:0:1}" == "'" && "${value: -1}" == "'" ]]; then
			value="${value:1:${#value}-2}"
		fi
		environment_variables="$(jq -c --arg key "$key" --arg value "$value" '. + {($key):$value}' <<< "$environment_variables")"
	done < "$ENV_FILE"
}

load_environment() {
	[[ -f "$ENV_FILE" ]] || fail "Environment file not found: $ENV_FILE"
	read_environment_variables
	printf 'Loaded %s environment variables from %s\n' "$(jq 'length' <<< "$environment_variables")" "$ENV_FILE"
}

load_components_credentials() {
	local components_config
	[[ -f "$COMPONENTS_CONFIG_FILE" ]] || fail "Components config not found: $COMPONENTS_CONFIG_FILE"
	components_config="$(jq -e '.' "$COMPONENTS_CONFIG_FILE")"
	access_token="$(jq -r '.integrations.github.token // empty' <<< "$components_config")"
	aws_access_key_id="$(jq -r '.integrations.aws.access_key_id // empty' <<< "$components_config")"
	aws_secret_access_key="$(jq -r '.integrations.aws.secret_access_key // empty' <<< "$components_config")"
	aws_session_token="$(jq -r '.integrations.aws.session_token // empty' <<< "$components_config")"
	[[ -n "$access_token" ]] || fail "integrations.github.token is missing from $COMPONENTS_CONFIG_FILE"
	[[ -n "$aws_access_key_id" && -n "$aws_secret_access_key" ]] || fail "AWS credentials are missing from $COMPONENTS_CONFIG_FILE"
	export AWS_ACCESS_KEY_ID="$aws_access_key_id"
	export AWS_SECRET_ACCESS_KEY="$aws_secret_access_key"
	if [[ -n "$aws_session_token" ]]; then
		export AWS_SESSION_TOKEN="$aws_session_token"
	fi
	printf 'Loaded AWS and GitHub credentials from the components config\n'
}

write_environment_input() {
	environment_input="$(mktemp "${TMPDIR:-/tmp}/amplify-migration-${SITE_NAME}.XXXXXX")"
	chmod 600 "$environment_input"
	jq -n \
		--arg name "$SITE_NAME" \
		--arg repository "$REPOSITORY" \
		--arg platform "WEB_COMPUTE" \
		--arg service_role "$IAM_SERVICE_ROLE" \
		--arg access_token "$access_token" \
		--argjson environment_variables "$environment_variables" \
		'{name:$name,repository:$repository,platform:$platform,iamServiceRoleArn:$service_role,accessToken:$access_token,environmentVariables:$environment_variables}' \
		> "$environment_input"
}

print_plan() {
	printf '%s\n' "Amplify migration plan"
	printf '%s\n' "  Site:          $SITE_NAME"
	printf '%s\n' "  Source app:    $OLD_APP_ID ($SOURCE_REGION)"
	printf '%s\n' "  Target region: $TARGET_REGION"
	printf '%s\n' "  Domain:        $DOMAIN_NAME"
	printf '%s\n' "  App root:      $APP_ROOT"
	printf '%s\n' "  Environment:   $ENV_FILE"
	printf '%s\n' "  Hosted zone:   $HOSTED_ZONE_ID"
}

verify_account() {
	local account_id
	account_id="$(aws sts get-caller-identity --query 'Account' --output text)"
	[[ "$account_id" == "$ACCOUNT_ID" ]] || fail "AWS account mismatch: expected $ACCOUNT_ID, got $account_id"
	printf 'Using AWS account %s\n' "$account_id"
}

create_target_app() {
	target_app_id="$(aws amplify list-apps \
		--region "$TARGET_REGION" \
		--query "apps[?name=='${SITE_NAME}'].appId | [0]" \
		--output text)"
	if [[ -n "$target_app_id" && "$target_app_id" != "None" ]]; then
		printf 'Reusing target Amplify app %s in %s\n' "$target_app_id" "$TARGET_REGION"
		return
	fi
	target_app_id="$(aws amplify create-app \
		--cli-input-json "file://$environment_input" \
		--region "$TARGET_REGION" \
		--query 'app.appId' \
		--output text)"
	[[ -n "$target_app_id" && "$target_app_id" != "None" ]] || fail "Amplify did not return a target app ID"
	printf 'Created target Amplify app %s in %s\n' "$target_app_id" "$TARGET_REGION"
}

load_source_configuration() {
	local source_app route53_records association_count
	source_app="$(aws amplify get-app \
		--app-id "$OLD_APP_ID" \
		--region "$SOURCE_REGION" \
		--output json)"
	custom_rules="$(jq -c '.app.customRules // []' <<< "$source_app")"
	association_count="$(aws amplify list-domain-associations \
		--app-id "$OLD_APP_ID" \
		--region "$SOURCE_REGION" \
		--query "length(domainAssociations[?domainName=='${DOMAIN_NAME}'])" \
		--output text)"
	if [[ "$association_count" == "0" ]]; then
		old_dns_records='[]'
		printf 'Old Amplify domain association is absent; no old Amplify DNS records were inferred\n'
	else
		old_domain_association="$(aws amplify get-domain-association \
			--app-id "$OLD_APP_ID" \
			--domain-name "$DOMAIN_NAME" \
			--region "$SOURCE_REGION" \
			--output json)"
		old_dns_records="$(parse_domain_records "$old_domain_association")"
	fi
	route53_records="$(aws route53 list-resource-record-sets \
		--hosted-zone-id "$HOSTED_ZONE_ID" \
		--output json)"
	old_record_sets="$(find_managed_record_sets "$route53_records" "$old_dns_records")"
	if [[ "$(jq 'length' <<< "$old_record_sets")" -gt 0 ]]; then
		printf 'Captured %s old Amplify DNS record set(s) for replacement\n' "$(jq 'length' <<< "$old_record_sets")"
	else
		printf 'No old Amplify DNS records remain to remove\n'
	fi
}

configure_target_app() {
	local app_id="$1" branch_count
	branch_count="$(aws amplify list-branches \
		--app-id "$app_id" \
		--region "$TARGET_REGION" \
		--query "length(branches[?branchName=='main'])" \
		--output text)"
	if [[ "$branch_count" == "0" ]]; then
		aws amplify create-branch \
			--app-id "$app_id" \
			--branch-name main \
			--stage PRODUCTION \
			--framework 'Next.js - SSR' \
			--no-enable-auto-build \
			--region "$TARGET_REGION" \
			--output json >/dev/null
	else
		printf 'Reusing target branch main\n'
	fi

	aws amplify update-app \
		--app-id "$app_id" \
		--environment-variables "$(jq -c '.environmentVariables' "$environment_input")" \
		--custom-rules "$custom_rules" \
		--region "$TARGET_REGION" \
		--output json >/dev/null
}

deploy_target_app() {
	local app_id="$1" job_id job_status
	job_id="$(aws amplify start-job \
		--app-id "$app_id" \
		--branch-name main \
		--job-type RELEASE \
		--region "$TARGET_REGION" \
		--query 'jobSummary.jobId' \
		--output text)"
	[[ -n "$job_id" && "$job_id" != "None" ]] || fail "Amplify did not return a target deployment job ID"
	for ((attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++)); do
		job_status="$(aws amplify get-job \
			--app-id "$app_id" \
			--branch-name main \
			--job-id "$job_id" \
			--region "$TARGET_REGION" \
			--query 'job.summary.status' \
			--output text)"
		case "$job_status" in
			SUCCEED)
				return
				;;
			FAILED|CANCELED|CANCELLING)
				fail "Target Amplify deployment failed with status $job_status"
				;;
		esac
		printf 'Waiting for target deployment (%s/%s): %s\n' "$attempt" "$MAX_POLL_ATTEMPTS" "$job_status"
		sleep "$POLL_INTERVAL_SECONDS"
	done
	fail "Timed out waiting for target Amplify deployment"
}

parse_domain_records() {
	jq -c '
		[
			.domainAssociation.subDomains[]?.dnsRecord,
			.domainAssociation.certificateVerificationDNSRecord
		]
		| map(select(type == "string" and length > 0))
		| map(capture("^(?<name>[^[:space:]]+)[[:space:]]+(?<type>[^[:space:]]+)[[:space:]]+(?<value>[^[:space:]]+)$"))
	' <<< "$1"
}

find_managed_record_sets() {
	jq -c --argjson managed "$2" '
		[
			.ResourceRecordSets[] as $record |
			$managed[] as $expected |
			select(
				(($record.Name | rtrimstr(".")) == ($expected.name | rtrimstr(".")))
				and (
					((($record.ResourceRecords // []) | length) == 1
						and (($record.ResourceRecords[0].Value // "") == $expected.value))
					or (($record.AliasTarget.DNSName // "") == $expected.value)
				)
			)
			| $record
		]
		| unique_by([.Name, .Type, (.SetIdentifier // "")])
	' <<< "$1"
}

apply_route53_changes() {
	local action="$1" record_sets="$2" change_batch
	if [[ "$(jq 'length' <<< "$record_sets")" -eq 0 ]]; then
		printf 'No Route 53 record sets to %s\n' "$action"
		return 0
	fi
	change_batch="$(jq -cn --arg action "$action" --argjson records "$record_sets" \
		'{Changes: [$records[] | {Action:$action,ResourceRecordSet:.}]}')"
	aws route53 change-resource-record-sets \
		--hosted-zone-id "$HOSTED_ZONE_ID" \
		--change-batch "$change_batch" \
		--output json >/dev/null
	printf '%s %s Route 53 record set(s)\n' "$action" "$(jq 'length' <<< "$record_sets")"
}

delete_old_domain_association() {
	local association_count associations_json
	aws amplify delete-domain-association \
		--app-id "$OLD_APP_ID" \
		--domain-name "$DOMAIN_NAME" \
		--region "$SOURCE_REGION" \
		--output json >/dev/null
	for ((attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++)); do
		associations_json="$(aws amplify list-domain-associations \
			--app-id "$OLD_APP_ID" \
			--region "$SOURCE_REGION" \
			--output json)"
		association_count="$(jq --arg domain "$DOMAIN_NAME" '[.domainAssociations[]? | select(.domainName == $domain)] | length' <<< "$associations_json")"
		if [[ "$association_count" == "0" ]]; then
			printf 'Old Amplify domain association is absent\n'
			return
		fi
		printf 'Waiting for old domain association deletion (%s/%s)\n' "$attempt" "$MAX_POLL_ATTEMPTS"
		sleep "$POLL_INTERVAL_SECONDS"
	done
	fail "Timed out waiting for old Amplify domain association deletion"
}

create_target_domain_association() {
	local association_count
	association_count="$(aws amplify list-domain-associations \
		--app-id "$target_app_id" \
		--region "$TARGET_REGION" \
		--query "length(domainAssociations[?domainName=='${DOMAIN_NAME}'])" \
		--output text)"
	if [[ "$association_count" != "0" ]]; then
		new_domain_association="$(aws amplify get-domain-association \
			--app-id "$target_app_id" \
			--domain-name "$DOMAIN_NAME" \
			--region "$TARGET_REGION" \
			--output json)"
		printf 'Reusing target domain association in %s\n' "$TARGET_REGION"
		return
	fi
	new_domain_association="$(aws amplify create-domain-association \
		--app-id "$target_app_id" \
		--domain-name "$DOMAIN_NAME" \
		--sub-domain-settings '[{"prefix":"","branchName":"main"},{"prefix":"www","branchName":"main"}]' \
		--region "$TARGET_REGION" \
		--output json)"
	printf 'Created target domain association in %s\n' "$TARGET_REGION"
}

prepare_target_dns_records() {
	new_dns_records="$(parse_domain_records "$new_domain_association")"
	new_record_sets="$(target_dns_records "$new_dns_records")"
	[[ "$(jq 'length' <<< "$new_record_sets")" -gt 0 ]] || fail "Target Amplify returned no DNS records"
	printf 'Prepared %s target DNS record set(s)\n' "$(jq 'length' <<< "$new_record_sets")"
}

target_dns_records() {
	local domain_records="$1"
	jq -c --arg domain "$DOMAIN_NAME" '
		map(
				. as $record
				| ($record.name | rtrimstr(".")) as $record_name
				| (if ($record_name == "" or $record_name == "@") then
					$domain
				elif ($record_name == $domain or ($record_name | endswith("." + $domain))) then
					$record_name
				else
					$record_name + "." + $domain
				end) as $normalized_name
				| ($normalized_name + ".") as $name
				| if ($record.type == "CNAME" and $normalized_name == $domain) then
				if (($record.value | endswith("cloudfront.net")) | not) then
					error("Amplify apex target is not a CloudFront hostname")
				else
					{
						Name: $name,
						Type: "A",
						AliasTarget: {
							HostedZoneId: "Z2FDTNDATAQYW2",
							DNSName: ($record.value | if endswith(".") then . else . + "." end),
							EvaluateTargetHealth: false
						}
					}
				end
			elif $record.type == "CNAME" then
				{Name: $name, Type: "CNAME", TTL: 60, ResourceRecords: [{Value: $record.value} ]}
			else
				error("Unsupported Amplify DNS record type: " + $record.type)
			end
		)
		| unique_by([.Name, .Type])
	' <<< "$domain_records"
}

poll_target_domain() {
	local status reason
	for ((attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++)); do
		new_domain_association="$(aws amplify get-domain-association \
			--app-id "$target_app_id" \
			--domain-name "$DOMAIN_NAME" \
			--region "$TARGET_REGION" \
			--output json)"
		status="$(jq -r '.domainAssociation.domainStatus' <<< "$new_domain_association")"
		case "$status" in
			AVAILABLE)
				printf 'Target Amplify domain is AVAILABLE\n'
				return
				;;
			FAILED|UPDATE_FAILED)
				reason="$(jq -r '.domainAssociation.statusReason' <<< "$new_domain_association")"
				fail "Target Amplify domain failed: $reason"
				;;
		esac
		printf 'Waiting for target domain (%s/%s): %s\n' "$attempt" "$MAX_POLL_ATTEMPTS" "$status"
		sleep "$POLL_INTERVAL_SECONDS"
	done
	fail "Timed out waiting for target Amplify domain"
}

print_completion() {
	printf '%s\n' "Migration completed"
	printf '  Target app:   %s (%s)\n' "$target_app_id" "$TARGET_REGION"
	printf '  Domain:       https://%s\n' "$DOMAIN_NAME"
	printf '%s\n' "The old Amplify app was retained and was not deleted."
}

update_site_configuration() {
	local target_cloudfront_url updated_config
	target_cloudfront_url="$(jq -r '[.[] | select((.value | rtrimstr(".")) | endswith("cloudfront.net")) | .value] | first // empty' <<< "$new_dns_records")"
	[[ -n "$target_cloudfront_url" ]] || fail "Target DNS records contain no CloudFront hostname for $DOMAIN_NAME"
	updated_config="$(mktemp "${TMPDIR:-/tmp}/sites-config-${SITE_NAME}.XXXXXX")"
	jq --arg site_name "$SITE_NAME" \
		--arg app_id "$target_app_id" \
		--arg cloudfront_url "$target_cloudfront_url" \
		'(.sites[] | select(.name == $site_name) | .amplifyAppId) = $app_id
		 | (.sites[] | select(.name == $site_name) | .cloudfronturl) = $cloudfront_url' \
		"$SITES_CONFIG_FILE" > "$updated_config"
	mv -- "$updated_config" "$SITES_CONFIG_FILE"
	printf 'Updated %s with target app %s and CloudFront hostname %s\n' "$SITE_NAME" "$target_app_id" "$target_cloudfront_url"
}

if [[ $# -eq 1 && ( "$1" == "--help" || "$1" == "-h" ) ]]; then
	usage
	exit 0
fi

[[ $# -ge 1 ]] || {
	usage >&2
	fail "A site name is required"
}
SITE_NAME="$1"
shift

while (($# > 0)); do
	case "$1" in
		--resume-dns)
			resume_dns=1
			;;
		--help|-h)
			usage
			exit 0
			;;
		*)
			usage >&2
			fail "Unknown argument: $1"
			;;
	esac
	shift
done

require_command awk
require_command jq
require_command aws
run_step "Load site configuration" load_site_configuration
print_plan
run_step "Load components credentials" load_components_credentials
run_step "Load environment variables" load_environment
run_step "Verify AWS account" verify_account
if ((resume_dns)); then
	run_step "Locate existing target Amplify app" create_target_app
	run_step "Capture remaining DNS state" load_source_configuration
	printf '%s\n' "Resuming at DNS cutover; existing app, branch, and deployment will not be recreated."
else
	run_step "Prepare secure Amplify input" write_environment_input
	run_step "Capture source app, domain, and DNS" load_source_configuration
	run_step "Create target Amplify app" create_target_app
	run_step "Configure target Amplify app" configure_target_app "$target_app_id"
	run_step "Deploy target Amplify app" deploy_target_app "$target_app_id"
	run_step "Delete old Amplify domain association" delete_old_domain_association
fi
run_step "Remove old Amplify DNS records" apply_route53_changes DELETE "$old_record_sets"
run_step "Create target domain association" create_target_domain_association
run_step "Prepare target DNS records" prepare_target_dns_records
run_step "Apply target DNS records" apply_route53_changes UPSERT "$new_record_sets"
run_step "Wait for target domain availability" poll_target_domain
run_step "Update site registry" update_site_configuration
print_completion
