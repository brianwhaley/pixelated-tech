# Unified Pixelated API

This stack creates the parallel `api.pixelated.tech` REST API in `us-east-1`.

Routes are intentionally direct and omit service stage names:

- `POST /sendmail` -> existing Sendmail Lambda
- `POST /forms` -> existing Forms S3 ingestion path
- `GET /dyndns53/nic/update` -> existing DynDNS Lambda with its legacy event mapping
- `ANY /proxy` -> existing Proxy Lambda
- `GET|POST /nerdjokes` -> existing NerdJokes PROD alias

STKR is not included. Its existing `us-east-2` API remains unchanged while that service is retired.

The stack manages the unified API access log group, execution log group, and API Gateway 5XX alarm. The alarm publishes to the configured `AlarmTopicArn`.

API Gateway has already created `API-Gateway-Execution-Logs_ja6wzf528i/prod`. Import that existing log group into the `pixelated-api` stack before the first update so CloudFormation adopts it instead of attempting to create a duplicate named resource. The access log group is already stack-managed.

## Deployment preparation

The template defaults to the existing east-one Lambda ARNs, Forms bucket, IAM role, and wildcard ACM certificate. Review the change set before deployment. DNS creation is disabled by default:

```bash
sam build --template-file aws/infrastructure/api/template.yaml
sam validate --template-file aws/infrastructure/api/template.yaml
```

Deploy with `CreateDnsRecord=false` first. The API Gateway custom domain and base-path mapping can be validated before changing Route 53. Set `CreateDnsRecord=true` and provide `HostedZoneId` only for the approved DNS cutover.

Existing service stacks and their custom domains are deliberately untouched, so consumers can migrate one endpoint at a time.

The dedicated DynDNS and Sendmail SAM configs set `RetireApi=true`. Deploy those stacks after the unified API is validated to remove their API Gateway resources and API-specific observability while preserving the service Lambdas and Lambda-level monitoring. `dyn.pixelated.tech` is intentionally preserved because the DynDNS Lambda updates it. The Sendmail custom-domain DNS record is outside that template and must be removed separately after the Sendmail stack cleanup.
