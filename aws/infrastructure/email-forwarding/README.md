# Email Forwarding Infrastructure

This SAM template describes the Pixelated email-forwarding resources deployed in `us-east-1`. The original `us-east-2` forwarding stack has been decommissioned:

- `pixelated-ses-email-forwarder` Lambda
- East-one Lambda execution role `pixelated-ses-email-forwarder-role-us-east-1`
- `pixelated-email-inbound-storage-container` S3 bucket
- `PixelatedEmailRouting` DynamoDB table
- `PixelatedEmailReceivingRuleset` SES receipt rule set
- `PixelatedEmailReceivingRule` SES receipt rule and its CloudFormation-managed Lambda invoke permission
- Lambda CloudWatch log group
- SES identity `forwarding.pixelated.tech`
- Three SES DKIM CNAME records for `forwarding.pixelated.tech`
- Platform DMARC record at `_dmarc.forwarding.pixelated.tech`
- Platform inbound MX record at `forwarding.pixelated.tech`

The SES identity, DKIM records, DMARC record, and platform MX record are shared infrastructure. They are not tenant onboarding resources: every tenant uses the platform identity for outbound relay, and the platform receives mail through the shared SES rule set.

Tenant-specific SES identities, tenant-domain DKIM records, tenant-domain MX/SPF records, and DynamoDB routing items remain outside this stack and should be provisioned during tenant onboarding.

The Route 53 MX record for `forwarding.pixelated.tech` now targets `10 inbound-smtp.us-east-1.amazonaws.com`. The east-one SES identity is verified and its three DKIM records are published.

The platform DKIM, DMARC, and MX records are declared in this stack with `ManagePlatformDnsRecords=true`. Because those records already exist, adopt them through a reviewed CloudFormation import change set using `resources-to-import-dns-us-east-1.json` before running a normal stack update.

CloudFormation can create and manage the SES receipt rule set, but AWS does not support importing `AWS::SES::ReceiptRule`. The east-one receipt rule remains account-managed, while its Lambda invoke permission is managed by `EmailForwarderSesPermission` in this stack. SES activation is a separate account-level operation; `PixelatedEmailReceivingRuleset` is active in `us-east-1`.

The execution role is intentionally defined with the permissions currently attached in AWS. All four are AWS-managed policies; no customer-managed IAM policy is attached:

- `AmazonSESFullAccess`
- `AWSLambdaBasicExecutionRole`
- `AmazonDynamoDBFullAccess`
- `AmazonS3FullAccess`

CloudFormation drift detection may report the Lambda's reserved `lambda:createdBy=SAM` tag as absent from the imported function. SAM reserves that tag key, so it cannot be declared in this template; the remaining tag drift is expected and non-functional.

The named resources were adopted into the CloudFormation stack before the normal update. The `DeletionPolicy` and `UpdateReplacePolicy` settings protect the existing function, role, bucket, table, and log group from stack deletion or replacement.

## Local validation

The AWS CLI can validate the CloudFormation syntax, and SAM CLI transforms and packages the local `CodeUri` deployment artifact.

```text
sam validate --template-file aws/infrastructure/email-forwarding/template.yaml
```

After SAM CLI is installed, the normal packaging flow will be:

```text
sam build --template-file aws/infrastructure/email-forwarding/template.yaml
sam deploy --config-file aws/infrastructure/email-forwarding/samconfig-us-east-1.toml \
  --template-file aws/infrastructure/email-forwarding/template.yaml
```

The first production operation was a CloudFormation resource import/adoption procedure, not a fresh stack deployment. The existing SES receipt rule remains account-managed because CloudFormation cannot import `AWS::SES::ReceiptRule`.
