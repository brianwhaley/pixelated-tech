# Email Forwarding Infrastructure

This SAM template describes the currently deployed Pixelated email-forwarding resources in `us-east-2`:

- `pixelated-ses-email-forwarder` Lambda
- Existing Lambda execution role `pixelated-ses-email-forwarder-role-xj3xcfkz`
- `pixelated-email-inbound-storage-bucket` S3 bucket
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

The existing Route 53 MX record for `forwarding.pixelated.tech` was observed as `10 ://amazonaws.com`, which was malformed. It now has the intended value: `10 inbound-smtp.us-east-2.amazonaws.com`.

CloudFormation can import and manage the SES receipt rule set, but AWS does not support importing `AWS::SES::ReceiptRule`. The receipt rule remains account-managed, while its Lambda invoke permission is now managed by `EmailForwarderSesPermission` in this stack. SES activation is a separate account-level operation; `PixelatedEmailReceivingRuleset` remains the active rule set.

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
aws cloudformation validate-template \
  --template-body file://aws/infrastructure/email-forwarding/template.yaml \
  --region us-east-2
```

After SAM CLI is installed, the normal packaging flow will be:

```text
sam build --template-file aws/infrastructure/email-forwarding/template.yaml
sam deploy --config-file aws/infrastructure/email-forwarding/samconfig.toml
```

The first production operation was a CloudFormation resource import/adoption procedure, not a fresh stack deployment. The import template omitted Route 53 records and outputs because CloudFormation import could not safely adopt or modify those items in that operation; they were restored in the subsequent normal update. The existing SES receipt rule remains account-managed because CloudFormation cannot import `AWS::SES::ReceiptRule`.
