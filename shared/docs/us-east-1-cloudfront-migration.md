# us-east-1 CloudFront Migration

- **Account:** `971579260814`
- **Objective:** Move regional infrastructure to `us-east-1` and ensure CloudFront uses certificates and supporting resources in the required region.
- **Source region:** `us-east-2`
- **Last reviewed:** `2026-10-23`

Use the current location as the progress indicator. `us-east-2` means the item remains in the source region, `us-east-1` means it has moved, and `global` means the resource is not regional.

## Items in CloudFormation

| Stack | Template/config | Resources covered | Current location | Notes |
|---|---|---|---|---|
| `amava-janitorial-site` | [`amava-janitorial`](../../aws/sites/amava-janitorial/samconfig.toml) / [`amplify-site`](../../aws/sites/amplify-site/template.yaml) | Amplify app, branch, domain association, hosted zone, health check | `us-east-1` / global Route 53 resources | Completed 2026-10-23 with new Amplify app `d2iyovuwvycoj0` and CloudFront distribution `d3mqodtoga2cn2.cloudfront.net`; legacy app `d1rbu53fslcy38` was deleted. SAM config follow-up remains. |
| `brianwhaley-com-site` | [`brianwhaley.com`](../../aws/sites/brianwhaley.com/samconfig.toml) / [`amplify-site`](../../aws/sites/amplify-site/template.yaml) | Amplify app, branch, domain association, hosted zone, health check | `us-east-1` / global Route 53 resources | Completed 2026-10-23 with new Amplify app `d1l3sfqu84bo71` and CloudFront distribution `d2l26twm3sk2sn.cloudfront.net`; legacy app `d2ysf7fqwwsmjl` was deleted. SAM config follow-up remains. |
| `informationfocus-site` | [`informationfocus`](../../aws/sites/informationfocus/samconfig.toml) / [`amplify-site`](../../aws/sites/amplify-site/template.yaml) | Amplify app, branch, domain association, hosted zone, health check | `us-east-1` / global Route 53 resources | Completed 2026-10-23 with new Amplify app `d3b88mjowtjcve` and CloudFront distribution `di9akwfy9gar4.cloudfront.net`; legacy app `d1p5oldpldjwqc` was deleted. |
| `jz-home-improvement-site` | [`jz-home-improvement`](../../aws/sites/jz-home-improvement/samconfig.toml) / [`amplify-site`](../../aws/sites/amplify-site/template.yaml) | Amplify app, branch, domain association, hosted zone, health check | `us-east-1` / global Route 53 resources | Completed 2026-10-23 with new Amplify app `d4ugyf7rptyy` and CloudFront distribution `d1uvjvuiv5mtqh.cloudfront.net`; legacy app `d3ffn9mtbcdkb8` was deleted. |
| `manningmetalworks-site` | [`manningmetalworks`](../../aws/sites/manningmetalworks/samconfig.toml) / [`amplify-site`](../../aws/sites/amplify-site/template.yaml) | Amplify app, branch, domain association, hosted zone, health check | `us-east-1` / global Route 53 resources | Completed 2026-10-23 with new Amplify app `d18f6u8y7ml0iy` and CloudFront distribution `d1752rjv8phprt.cloudfront.net`; legacy app `d3jndv57oz5non` was deleted. |
| `mgt-pro-services-site` | [`mgt-pro-services`](../../aws/sites/mgt-pro-services/samconfig.toml) / [`amplify-site`](../../aws/sites/amplify-site/template.yaml) | Amplify app, branch, domain association, hosted zone, health check | `us-east-2` / global Route 53 resources | Migration blocked until `apps/mgt-pro-services` is committed to Git; failed target app `d79mvc40tnk0v` was removed. |
| `pixelated-site` | [`pixelated`](../../aws/sites/pixelated/samconfig.toml) / [`amplify-site`](../../aws/sites/amplify-site/template.yaml) | Amplify app, branch, domain association, hosted zone, health check | `us-east-1` / global Route 53 resources | Completed 2026-10-23 with new Amplify app `d17myuvb07hqxo` and CloudFront distribution `d1pljhhskora5e.cloudfront.net`; legacy app `d1bwvapspanbnf` was retained pending cleanup. |
| `pixelated-admin-site` | [`pixelated-admin`](../../aws/sites/pixelated-admin/samconfig.toml) / [`amplify-site`](../../aws/sites/amplify-site/template.yaml) | Amplify app, branch, domain association, health check | `us-east-2` / global Route 53 resources | |
| `pixelated-components-site` | [`pixelated-components`](../../aws/sites/pixelated-components/samconfig.toml) / [`amplify-site`](../../aws/sites/amplify-site/template.yaml) | Amplify app, branch, domain association, health check | `us-east-2` / global Route 53 resources | |
| `pixelvivid-site` | [`pixelvivid`](../../aws/sites/pixelvivid/samconfig.toml) / [`amplify-site`](../../aws/sites/amplify-site/template.yaml) | Amplify app, branch, domain association, hosted zone, health check | `us-east-1` / global Route 53 resources | Completed 2026-10-24 with target app `d2sslwgwcwfmut` and CloudFront distribution `d31ki5whjt2j8i.cloudfront.net`; legacy app `d2yn1gtc7ig0hi` pending deletion. |
| `simple-day-concierge-site` | [`simple-day-concierge`](../../aws/sites/simple-day-concierge/samconfig.toml) / [`amplify-site`](../../aws/sites/amplify-site/template.yaml) | Amplify app, branch, domain association, hosted zone, health check | `us-east-1` / global Route 53 resources | Completed 2026-10-24 with target app `dcz8ugp3v037z` and CloudFront distribution `d2ni21rf096avu.cloudfront.net`; legacy app `d28i2addohi05n` pending deletion. |
| `threemuses-site` | [`threemuses`](../../aws/sites/threemuses/samconfig.toml) / [`amplify-site`](../../aws/sites/amplify-site/template.yaml) | Amplify app, branch, domain association, hosted zone, health check | `us-east-1` / global Route 53 resources | Completed 2026-10-24 with target app `d1n9z3u3n9j9tp` and CloudFront distribution `d1c8gypekp64nk.cloudfront.net`; legacy app `d17pj30yytnnjd` pending deletion. |
| `pixelated-dyndns53` | [`dyndns53`](../../aws/infrastructure/dyndns53/samconfig.toml) / [`template.yaml`](../../aws/infrastructure/dyndns53/template.yaml) | Lambda, CloudWatch alarms and log groups, API Gateway, and related resources | `us-east-2` | |
| `pixelated-email-forwarding` | [`email-forwarding`](../../aws/infrastructure/email-forwarding/samconfig.toml) / [`template.yaml`](../../aws/infrastructure/email-forwarding/template.yaml) | SES identity and email-forwarding resources, Lambda, S3, DynamoDB, DNS, and CloudWatch resources | `us-east-2` / global Route 53 resources | |
| `pixelated-facial-recognition` | [`facial-recognition`](../../aws/infrastructure/facial-recognition/samconfig.toml) / [`template.yaml`](../../aws/infrastructure/facial-recognition/template.yaml) | Lambda, IAM role, S3 buckets, permission, log group, metric filter, alarm, and query | `us-east-2` | Its deployment bucket must remain regional with the stack. |
| `pixelated-nerdjokes` | [`nerdjokes`](../../aws/infrastructure/nerdjokes/samconfig.toml) / [`template.yaml`](../../aws/infrastructure/nerdjokes/template.yaml) | Lambda functions, aliases, schedules, API Gateway, certificates, and CloudWatch resources | `us-east-2` | |
| `pixelated-platform` | [`pixelated-platform`](../../aws/infrastructure/pixelated-platform/samconfig.toml) / [`template.yaml`](../../aws/infrastructure/pixelated-platform/template.yaml) | Account-level platform IAM resources | `us-east-2` / global IAM resources | Fixed-name IAM roles are account-global and must not be duplicated regionally. |
| `pixelated-sam-cli-iac` | [`pixelated-sam-cli-iac`](../../aws/infrastructure/pixelated-sam-cli-iac/samconfig.toml) / [`template.yaml`](../../aws/infrastructure/pixelated-sam-cli-iac/template.yaml) | SAM artifact bucket and bucket policy | `us-east-1` | Bucket: `pixelated-sam-source-container`. |
| `pixelated-sam-cli-managed` | [`pixelated-sam-cli-managed`](../../aws/infrastructure/pixelated-sam-cli-managed/samconfig.toml) / [`template.yaml`](../../aws/infrastructure/pixelated-sam-cli-managed/template.yaml) | SAM-managed artifact infrastructure | `us-east-2` | |
| `pixelated-proxy` | [`proxy`](../../aws/infrastructure/proxy/samconfig.toml) / [`template.yaml`](../../aws/infrastructure/proxy/template.yaml) | Lambda, API Gateway, certificates, and CloudWatch resources | `us-east-2` | |
| `pixelated-sendmail` | [`sendmail`](../../aws/infrastructure/sendmail/samconfig.toml) / [`template.yaml`](../../aws/infrastructure/sendmail/template.yaml) | Lambda, API Gateway, certificates, and CloudWatch resources | `us-east-2` | |
| `pixelated-stkr` | [`stkr`](../../aws/infrastructure/stkr/samconfig.toml) / [`template.yaml`](../../aws/infrastructure/stkr/template.yaml) | Lambda, API Gateway, certificates, and CloudWatch resources | `us-east-2` | |

## Items Not in CloudFormation

| Stack or site context | Resource or configuration | Current location | Notes |
|---|---|---|---|
| Each site stack | Amplify environment variables | `us-east-2` | Verify per site. |
| Each site stack | Amplify redirects and rewrites | `us-east-2` | Not represented by the shared site template. |
| Each site stack | Site Route 53 records beyond apex behavior | `global` | Not represented by the shared site template. Email DNS records are represented by `pixelated-email-forwarding`. |
| CloudFront | ACM certificates as explicit CloudFormation resources | `verify` | Certificates used by CloudFront must be in `us-east-1`. |
| All site stacks | Amplify IAM service role `amplify-role` | `global` | Referenced by site templates but not created by them. |
| Shared account | Security resources and security configuration | `verify` | No EC2 security groups, WAF, Shield, KMS, Secrets Manager, GuardDuty, or similar resources are declared in repository templates. |
| `pixelated-dyndns53` | Lambda environment variables | `us-east-2` | Verify the deployed function against its template. |
| `pixelated-email-forwarding` | Lambda environment variables | `us-east-2` | Verify the deployed function against its template. |
| `pixelated-facial-recognition` | Lambda environment variables | `us-east-2` | Verify the deployed function against its template. |
| `pixelated-nerdjokes` | Lambda environment variables | `us-east-2` | Verify each function against its template. |
| `pixelated-proxy` | Lambda environment variables | `us-east-2` | Verify the deployed function against its template. |
| `pixelated-sendmail` | Lambda environment variables | `us-east-2` | Verify the deployed function against its template. |
| `pixelated-stkr` | Lambda environment variables | `us-east-2` | Verify the deployed function against its template. |
