# Pixelated Forms

This stack owns the public form submission path:

```text
forms.pixelated.tech/default/forms
  -> API Gateway S3 integration
  -> pixelated-forms-bucket
  -> form-processing Lambda
  -> PixelatedFormSubmissionsTable
  -> Amazon SES
```

The stack uses the existing `PixelatedFormSubmissionsTable`; it does not create a replacement table.

## Build and Validate

```bash
sam validate --template-file aws/infrastructure/forms/template.yaml
sam build --template-file aws/infrastructure/forms/template.yaml
```

## Deployment

Review the change set before execution:

```bash
sam deploy \
  --template-file .aws-sam/build/template.yaml \
  --config-file aws/infrastructure/forms/samconfig.toml
```

The `forms.pixelated.tech` DNS record must point to the regional API Gateway domain emitted by the stack output `FormsApiRegionalDomainName`.

## Cutover

1. Deploy and validate the stack with a real test submission.
2. Confirm the object is written to `pixelated-forms-bucket`.
3. Confirm `form-processing` writes the submission to DynamoDB and sends the primary email through SES.
4. Confirm the optional thank-you email path.
5. Update consumers to use `https://forms.pixelated.tech/default/forms`.
6. The sendmail cutover and validation are complete. The legacy S3 route, `sendmail-s3` Lambda, and empty `pixelated-sendmail-east1-bucket` are retired separately during final cleanup.
