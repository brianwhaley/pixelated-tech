# Pixelated Platform Stack

This stack owns the account-level API Gateway CloudWatch logging role for `us-east-2`.

Deploy it before deploying API stacks that enable API Gateway execution or access logging:

```bash
sam deploy --config-file aws/infrastructure/pixelated-platform/samconfig.toml
```

The logging role is intentionally separate from the SAM deployment artifact stack. `pixelated-sam-cli-managed` owns the SAM deployment artifact bucket and is tooling infrastructure; API Gateway logging is application platform infrastructure and must not depend on SAM CLI regenerating or replacing its template.

Feature stacks retain ownership of their Lambda execution and direct AWS integration permissions. The account-level API Gateway role is only for API Gateway service logging.
