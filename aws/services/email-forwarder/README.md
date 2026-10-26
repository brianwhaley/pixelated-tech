# Email Forwarder

AWS Lambda service that receives an SES event, reads the raw message from S3, resolves forwarding destinations from DynamoDB, rewrites forwarding headers, and sends the message through SES.

## Deployed Function

- Function: `pixelated-ses-email-forwarder`
- Region: `us-east-1`
- Runtime: Node.js 24.x
- Handler: `index.handler`
- Timeout: 30 seconds
- Memory: 512 MB
- Architecture: `x86_64`

The canonical Lambda source is maintained in `src/index.mjs` and deployed through the SAM template under `aws/infrastructure/email-forwarding/`.

## AWS Dependencies

- S3 inbound object storage
- DynamoDB table `PixelatedEmailRouting`
- SES receipt rule `PixelatedEmailReceivingRule`
- SES sending identity `forwarding.pixelated.tech`

The shared SES identity, platform DNS records, receipt rule, and AWS resources are defined under `aws/infrastructure/email-forwarding/`. Tenant-domain identities and DNS records are intentionally managed by the tenant onboarding process.

## Legacy domain backfill

New routing items include a normalized `domain` attribute. Existing items can be backfilled from their `recipient` key with:

```text
npm run backfill:domain
```

The command defaults to a dry run. Apply the updates only after reviewing the output:

```text
npm run backfill:domain -- --apply
```

The backfill only sets `domain` when it is missing and does not change `recipient` or `targetEmail`.
