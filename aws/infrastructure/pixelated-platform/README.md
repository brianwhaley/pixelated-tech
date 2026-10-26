# Pixelated Platform Stack

The main platform stack owns shared account-level infrastructure. The east-one regional template owns the
shared wildcard ACM certificate, API Gateway account configuration, and the
`pixelated-cloudwatch-alarms` SNS topic used by application alarms.

The existing east-two stack remains unchanged. For east-one, create the regional platform stack without the existing SNS topic first:

```bash
sam deploy \
	--config-file aws/infrastructure/pixelated-platform/samconfig-us-east-1-bootstrap.toml \
	--template-file aws/infrastructure/pixelated-platform/template-us-east-1.yaml
```

After the bootstrap stack exists, create and review an `IMPORT` change set using `resources-to-import-us-east-1.json`, with `ManageCloudWatchAlarmsTopic=true`, then execute it. The import adopts the existing topic and preserves its current email subscription. Use `samconfig-us-east-1.toml` for subsequent east-one updates.

The Nerd Jokes stack owns and imports `tech-jokes-role`. Nerd Jokes, Proxy, and Sendmail continue consuming
the shared east-one certificate ARN from their feature-stack configuration.

The Amplify and Budget roles remain in the global platform stack. They are
account-level resources and do not need to be recreated in `us-east-1`.

The logging role is intentionally separate from the SAM deployment artifact stack. `pixelated-sam-cli-managed` owns the SAM deployment artifact bucket and is tooling infrastructure; API Gateway logging is application platform infrastructure and must not depend on SAM CLI regenerating or replacing its template.

Feature stacks retain ownership of their Lambda execution and direct AWS integration permissions. The account-level API Gateway role is only for API Gateway service logging.
