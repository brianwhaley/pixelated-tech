# Multi-Tenant Email Forwarding Architecture on AWS

A multi-tenant email forwarding architecture on AWS relies on **Amazon Route 53** as the authoritative DNS entry point, **Amazon SES** for inbound reception and outbound dispatch, **Amazon S3** for payload buffering, **AWS Lambda (Node.js)** for header transformation, and **Amazon DynamoDB** for tenant routing rules.

---

## Architectural Workflow

* **DNS Resolution (Amazon Route 53):** External mail transfer agents query Route 53 for the tenant domain's MX records. Route 53 returns the SES regional inbound endpoint (`inbound-smtp.<region>.amazonaws.com`), and validates domain authenticity and sending security through DKIM (CNAME) and SPF (TXT) resource record sets provisioned in the tenant's hosted zone.
* **Edge Reception & Verification (Amazon SES Inbound):** SES receives the SMTP handshake. It checks whether the destination domain matches an active, verified SES identity corresponding to the Route 53 zone. If verified, the active SES Receipt Rule triggers two actions: it streams the raw, unmodified MIME email message into Amazon S3, and fires an asynchronous event invocation to AWS Lambda.
* **Storage Buffering (Amazon S3):** Acts as a durable, temporary storage buffer for incoming emails. Storing the raw `.eml` payload directly in S3 avoids Lambda's synchronous execution size caps (SES payload limits are truncated at 150 KB if piped directly to Lambda).
* **Routing Resolution & Header Rewriting (AWS Lambda via Node.js):** The Lambda function extracts the recipient address from the SES event payload and queries DynamoDB. Upon locating the destination mapping, Lambda pulls the raw `.eml` object from S3. To prevent upstream SPF and DKIM failures at destination providers like Gmail or Outlook, Lambda strips original DKIM signatures, sets `Reply-To` to the original sender, and rewrites the `From` and `Return-Path` headers to use a platform-owned, verified sending identity.
* **Mapping Store (Amazon DynamoDB):** An on-demand table storing recipient keys (supporting exact email addresses like `contact@tenant.com` or domain catch-alls like `@tenant.com`) mapped to destination targets (e.g., personal or business inboxes).
* **Outbound Dispatch (Amazon SES Outbound):** Lambda calls the SES `SendRawEmail` API to dispatch the rewritten message to the final destination address.

---

## Step 1: Create the DynamoDB Routing Table

1. Open the **DynamoDB Console** and choose **Create table**.
2. Set **Table name** to `PixelatedEmailRouting`.
3. Set **Partition key (PK)** to `recipient` with type **String**.
4. Set table capacity to **On-demand** and choose **Create table**.

---

## Step 2: Create the S3 Inbound Storage Bucket

1. Open the **S3 Console** and click **Create bucket**.
2. Enter a unique bucket name (e.g., `pixelated-email-inbound-storage-bucket`).
3. Keep default settings (**Block all public access** enabled) and create the bucket.
4. Open the created bucket, navigate to **Permissions**, locate **Bucket policy**, and click **Edit**.
5. Insert the following policy to permit SES to store inbound messages (replace `YOUR_ACCOUNT_ID` and `YOUR_BUCKET_NAME`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowSESPuts",
      "Effect": "Allow",
      "Principal": {
        "Service": "ses.amazonaws.com"
      },
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::pixelated-email-inbound-storage-bucket/*",
      "Condition": {
        "StringEquals": {
          "aws:SourceAccount": "971579260814"
        },
        "ArnLike": {
          "aws:SourceArn": "arn:aws:ses:us-east-2:971579260814:receipt-rule-set/*"
        }
      }
    }
  ]
}
```

---

## Step 3: Create the Node.js Header-Rewriting Lambda

1. Open the **Lambda Console** and select **Create function**.
2. Name the function `pixelated-ses-email-forwarder` and select runtime **Node.js 24.x**.
3. Under **Configuration > General configuration**, edit and set **Timeout** to `30 seconds` and **Memory** to `256 MB`.
4. Under **Configuration > Permissions**, select the IAM execution role and ensure it has policies granting:
   * `ses:SendRawEmail`
   * `s3:GetObject` on `arn:aws:s3:::pixelated-email-inbound-storage-bucket/*`
   * `dynamodb:GetItem` on the `PixelatedEmailRouting` table ARN

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "logs:CreateLogGroup",
      "Resource": "arn:aws:logs:us-east-2:971579260814:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": [
        "arn:aws:logs:us-east-2:971579260814:log-group:/aws/lambda/pixelated-ses-email-forwarder:*"
      ]
    },
    {
      "Sid": "PixelatedS3ReadAccess",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::pixelated-email-inbound-storage-bucket/*"
    },
    {
      "Sid": "PixelatedDynamoDBReadAccess",
      "Effect": "Allow",
      "Action": "dynamodb:GetItem",
      "Resource": "arn:aws:dynamodb:us-east-2:971579260814:table/PixelatedEmailRouting"
    },
    {
      "Sid": "PixelatedSESOutboundAccess",
      "Effect": "Allow",
      "Action": "ses:SendRawEmail",
      "Resource": "*"
    }
  ]
}
```
5. Under **Configuration > Environment variables**, add:
   * `S3_BUCKET`: `pixelated-email-inbound-storage-bucket`
   * `FORWARDING_DOMAIN`: `forwarding.pixelated.tech` (a verified root or subdomain you manage)
6. In `index.mjs`, replace everything and paste the following code:

```javascript
import { S3Client, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { SESClient, SendRawEmailCommand } from "@aws-sdk/client-ses";

// Configuration Constants
const AWS_REGION = "us-east-2";
const TABLE_NAME = "PixelatedEmailRouting";
const S3_BUCKET = "pixelated-email-inbound-storage-bucket";
const FORWARDING_DOMAIN = "forwarding.pixelated.tech";

// Initialize AWS SDK Clients
const s3 = new S3Client({ region: AWS_REGION });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: AWS_REGION }));
const ses = new SESClient({ region: AWS_REGION });

export const handler = async (event) => {
  // FIX: Array index access required for SES payloads
  const record = event.Records?.[0];
  if (!record || !record.ses) {
    console.error("Invalid or empty SES event structure received.");
    return;
  }

  const messageId = record.ses.mail.messageId;
  const recipients = record.ses.receipt.recipients || [];

  // Fetch the raw email payload once per message execution to save performance
  let rawEmail = "";
  try {
    const s3Response = await s3.send(
      new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: messageId
      })
    );
    rawEmail = await s3Response.Body.transformToString();
  } catch (s3Error) {
    console.error(`S3 Fetch Failed for MessageID ${messageId}:`, s3Error);
    return; // Exit early if the raw email cannot be retrieved
  }

  // Iterate over each targeted platform recipient
  let sentSuccessfully = false;
  for (const originalRecipient of recipients) {
    try {
      const normalizedRecipient = originalRecipient.toLowerCase();
      const domainCatchAll = "@" + normalizedRecipient.split("@")[1];

      // 1. Resolve forward target from DynamoDB
      let destination = null;
      let ddbResult = await ddb.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: { recipient: normalizedRecipient }
        })
      );

      if (ddbResult.Item) {
        destination = ddbResult.Item.targetEmail;
      } else {
        const wildcardResult = await ddb.send(
          new GetCommand({
            TableName: TABLE_NAME,
            Key: { recipient: domainCatchAll }
          })
        );
        if (wildcardResult.Item) destination = wildcardResult.Item.targetEmail;
      }

      if (!destination) {
        console.warn(`No forward mapping found for: ${normalizedRecipient}`);
        continue;
      }

      // 2. Work on a copy of the raw email to prevent global string pollution across loop cycles
      let workingEmail = rawEmail;

      // 3. Clean and rewrite headers for SPF/DKIM compliance
      workingEmail = workingEmail.replace(/^Return-Path:.*?\r?\n/gmi, "");
      workingEmail = workingEmail.replace(/^DKIM-Signature:.*?\r?\n(\s+.*?\r?\n)*/gmi, "");

      // Safe Extraction of From Header with fallback strings
      const fromHeaderMatch = workingEmail.match(/^From:(.*?)\r?\n/im);
      const originalFrom = fromHeaderMatch ? fromHeaderMatch[1].trim() : "Unknown Sender";

      // Append Reply-To if missing to protect customer conversational replies
      if (!workingEmail.match(/^Reply-To:/im)) {
        workingEmail = `Reply-To: ${originalFrom}\r\n` + workingEmail;
      }

      const cleanSenderName = originalFrom
        .replace(/<.*?>/, "")
        .replace(/"/g, "")
        .trim() || "Platform Relay";
        
      const rewrittenFrom = `From: "${cleanSenderName}" <relay@${FORWARDING_DOMAIN}>\r\n`;
      workingEmail = workingEmail.replace(/^From:.*?\r?\n/im, rewrittenFrom);

      // 4. Dispatch forwarded email via SES
      await ses.send(
        new SendRawEmailCommand({
          Source: `relay@${FORWARDING_DOMAIN}`,
          Destinations: [destination],
          RawMessage: { Data: Buffer.from(workingEmail, "utf-8") }
        })
      );

      console.log(`Successfully forwarded message ${messageId} to ${destination}`);
      sentSuccessfully = true;
    } catch (recipientError) {
      // Non-restrictive handling: If one client's routing crashes, don't break other recipients
      console.error(`Error processing recipient ${originalRecipient}:`, recipientError);
    }
  }
  if (sentSuccessfully) {
    try {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: S3_BUCKET,
          Key: messageId
        })
      );
      console.log(`Deleted raw email ${messageId} from S3 bucket.`);
    } catch (deleteError) {
      console.error(`Failed to delete S3 object ${messageId}:`, deleteError);
    }
  }
};
```
7. Click **Deploy**.

---

## Step 4: Configure the Global SES Inbound Catch-All Rule

### 1. Configure the Global SES Inbound Catch-All Rule

1. Open the **Amazon SES Console** and navigate to **Email receiving** under **Configuration**. 
2. Select your active **Rule set** (or create one and set it as active). 
3. Click **Create rule**: 
    * **Rule name:** `PixelatedEmailReceivingRule` Status is Enabled, TLS is unchecked (not required) and Spam and Virus Scanning is Enabled
    * **Recipient conditions:** Leave empty so the rule evaluates all verified domains on the account. 
4. Add two actions in order: 
    * **Action 1 (S3):** Select the bucket created in Step 2 (`pixelated-email-inbound-storage-bucket`). 
    * **Action 2 (Lambda):** Select `pixelated-ses-email-forwarder` with **Invocation type** set to `Event`. 
5. Save the rule.  Be sure to Add Permissions if prompted

### 2. Authorize forwarding.pixelated.tech in SES

1. Open the Amazon SES Console and go to Identities in the left sidebar.
2. Click on forwarding.pixelated.tech.
3. Under the Authentication tab, look for the DKIM section. You will see 3 CNAME records generated by AWS.
4. Check **Publish DNS records to Route 53**
5. Custom MAIL FROM Domain: 🚫 Skip It
6. DMARC Policy:  Publish It
7. Email Certificates (S/MIME): 🚫 Skip It
8. Create The Inbound MX Record for forwarding.pixelated.tech in Route 53 (Crucial for receiving email):Record name: Enter forwarding (so it applies to forwarding.pixelated.tech).Record type: MX Value: 10 ://amazonaws.com
9. A Critical Verification Pro-TipBecause you are verifying a subdomain (forwarding.pixelated.tech) inside the root hosted zone (pixelated.tech), ensure you append the word forwarding to the prefix of every record name you create in Route 53. If you leave the record name blank, the records will mistakenly apply to your root domain (pixelated.tech) instead of your platform forwarding domain, keeping the status stuck in pending.Once Route 53 saves these changes, AWS SES will automatically detect the records over the next few minutes, and the status badge will update to a green Verified.While DNS propagates, would you like to:Seed the first DynamoDB routing test row so you are ready to send an email the second it verifies?Review how to handle production sandbox mode limits if this is a brand new AWS account?


---


## Step 5: Onboard and Test the First Client Domain

To test the system, connect a client domain hosted in Route 53 (e.g., `clienta.com`) to the forwarding pipeline.


1. Open the **Amazon SES Console** and navigate to **Identities**.
2. Click **Create identity**, choose **Domain**, and enter `clienta.com`.
3. Under **DKIM**, choose **Easy DKIM** with **RSA 2048-bit**.
4. Check **Publish DNS records to Route 53** (this automatically publishes the 3 DKIM CNAME records to the hosted zone in your account) and click **Create identity**.


### 1. Authorize Domain Identity in SES
1. Open the **Amazon SES Console** and navigate to **Identities**.
2. Click **Create identity**, choose **Domain**, and enter `clienta.com`.
3. Under **DKIM**, choose **Easy DKIM** with **RSA 2048-bit**.
4. Check **Publish DNS records to Route 53** (this automatically publishes the 3 DKIM CNAME records to the hosted zone in your account) and click **Create identity**.

### 2. Configure Inbound Routing in Route 53
Open the **Route 53 Console** and select the Hosted Zone for `clienta.com`:
* **Create Inbound MX Record:**
  * **Record name:** Leave empty (root `@`).
  * **Record type:** `MX`
  * **Value:** `10 inbound-smtp.us-east-2.amazonaws.com` .
* **Create SPF TXT Record:**
  * **Record name:** Leave empty (root `@`).
  * **Record type:** `TXT`
  * **Value:** `"v=spf1 include:amazonses.com ~all"`

### 3. Insert Tenant Route into DynamoDB
1. Open the **DynamoDB Console** and navigate to the `PixelatedEmailRouting` table.
2. Click **Create item**:
   * **recipient:** `info@clienta.com` (or `@clienta.com` to match all addresses on the domain)
   * Add a new attribute of type **String** named `targetEmail` with value set to your test destination inbox (e.g., `yourname@gmail.com`).


### 4. Execute the End-to-End Test
1. From an external address, send an email to `info@clienta.com`.
2. Inspect the **CloudWatch Logs** under the `/aws/lambda/ses-email-forwarder` log group to verify execution.
3. Open `yourname@gmail.com` to confirm receipt:
   * The message sender will display as `"Original Sender" <relay@forwarding.yourplatform.com>`.
   * Hitting **Reply** will populate the recipient field with the original sender address via the `Reply-To` header.


## Step 6: Future Enhancements
1. Adding automated spam/virus filtering at the SES rule level is recommended before scaling past a few dozen tenants.
2. script to automate Step 5. 
