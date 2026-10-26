# Brian Whaley site infrastructure

This stack is the site-owned lifecycle boundary for `brianwhaley.com`.

## Managed by CloudFormation

- Route 53 public hosted zone `Z25HMP58CYXTT0`
- Route 53 HTTPS health check `8907c3f0-265e-4942-8bbc-767b4bc03ea9`
- CloudWatch health-check alarm using the shared `pixelated-cloudwatch-alarms` SNS topic in `us-east-1`
- Amplify app `d1l3sfqu84bo71` in `us-east-1`
- Amplify production branch `main`
- Amplify custom domain association for `brianwhaley.com`

## Existing but not managed by CloudFormation

The following live DNS records remain externally managed because `AWS::Route53::RecordSet` is not supported for CloudFormation resource import, and simple records do not have a valid `SetIdentifier` import value:

- Apex A record alias to `d2s9ymnf5zv2cw.cloudfront.net`
- Apex MX record for Amazon SES
- Apex SPF and Google verification TXT records
- DMARC TXT record
- ACM certificate validation CNAME
- Three Amazon SES DKIM CNAME records
- `www` CNAME to the CloudFront distribution

The existing NS and SOA records are also excluded because Route 53 manages them as hosted-zone metadata.

The registrar nameserver delegation is externally managed. The live nameservers already match the hosted zone, but registrar changes remain a separate Route 53 Domains operation.

The existing Amplify secret environment variable is intentionally not copied into this repository or into a CloudFormation template.

## Explicit exclusions

Secrets, Amplify environment variables, and registrar contact information are not copied into the repository or managed by this stack.

This site has no SNS topic or subscription, API Gateway, Lambda function, S3 bucket, DynamoDB table, EventBridge rule, Secrets Manager secret, or SSM parameter managed by this stack. The health-check alarm is required for every deployed site stack and publishes to the shared `pixelated-cloudwatch-alarms` topic.

## Validation and adoption

1. Run `sam validate --template-file ../amplify-site/template.yaml`.
2. Validate CloudFormation import support and resource identifiers in `us-east-1`. The import manifest intentionally excludes the Route 53 record resources listed above.
3. Create an import change set for `brianwhaley-com-site` in `us-east-1` for review only.
4. Execute adoption only after the change set has been inspected and explicitly approved.

## Shared template

This stack uses `../amplify-site/template.yaml` as its canonical template and the generic `Site*` logical resource IDs. The local Brian-specific template has been retired.
