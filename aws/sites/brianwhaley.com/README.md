# Brian Whaley site infrastructure

This stack is the site-owned lifecycle boundary for `brianwhaley.com`.

## Managed by CloudFormation

- Route 53 public hosted zone `Z25HMP58CYXTT0`
- Route 53 HTTPS health check `8907c3f0-265e-4942-8bbc-767b4bc03ea9`
- Amplify app `d2ysf7fqwwsmjl` in `us-east-2`
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

This site currently has no confirmed site-owned SNS topic or subscription, API Gateway, Lambda function, S3 bucket, DynamoDB table, EventBridge rule, Secrets Manager secret, or SSM parameter. These resources are intentionally absent from the template. If live discovery finds one associated with Brian Whaley, it must be reported and reviewed before being added.

## Validation and adoption

1. Run `sam validate --template-file template.yaml`.
2. Validate CloudFormation import support and resource identifiers. The import manifest intentionally excludes the Route 53 record resources listed above.
3. Create an import change set for review only.
4. Execute adoption only after the change set has been inspected and explicitly approved.
