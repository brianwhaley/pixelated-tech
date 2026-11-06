import { S3Client, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { SESClient, SendRawEmailCommand, SendEmailCommand } from "@aws-sdk/client-ses";

// Configuration Constants
const AWS_REGION = "us-east-1";
const TABLE_NAME = "PixelatedEmailRouting";
const S3_BUCKET = "pixelated-email-inbound-storage-container";
const FORWARDING_DOMAIN = "forwarding.pixelated.tech";
// 10 MB (10,485,760 bytes), maximum size for SES email messages
const MAX_SES_SIZE = 10 * 1024 * 1024;

// Initialize AWS SDK Clients
const s3 = new S3Client({ region: AWS_REGION });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: AWS_REGION }));
const ses = new SESClient({ region: AWS_REGION });

function extractCleanDisplayName(rawFrom) {
	if (!rawFrom) return "Platform Relay";
	const clean = rawFrom
		.replace(/<.*?>/g, "")
		.replace(/[\r\n"'\\]/g, "")
		.trim();
	return clean || "Platform Relay";
}

function describeError(error) {
	const errorName = error?.name || error?.code || "UnknownError";
	const errorMessage = error?.message || String(error);
	const statusCode = error?.$metadata?.httpStatusCode;
	const isMalformedInput = /parameter list|mime|filename|boundary|header/i.test(errorMessage);
	const isPermanent = /InvalidParameterValue|InvalidRecipient|MessageRejected/i.test(errorName);
	const isTransient = statusCode >= 500 || /Throttl|Timeout|ServiceUnavailable|InternalFailure/i.test(errorName);

	let classification = "dependency_or_unknown";
	if (isMalformedInput) classification = "permanent_malformed_input";
	else if (isPermanent) classification = "permanent_ses_rejection";
	else if (isTransient) classification = "transient";

	return { errorName, errorMessage, statusCode, classification };
}

export function isDeliveryStatusMessage(rawEmail, recipients) {
	const hasRelayRecipient = recipients.some((recipient) => recipient.toLowerCase() === `relay@${FORWARDING_DOMAIN}`);
	const isDeliveryStatusReport = /^Content-Type:\s*multipart\/report\b/im.test(rawEmail)
		&& /report-type\s*=\s*["']?delivery-status/i.test(rawEmail);
	const hasDeliveryStatusPart = /^Content-Type:\s*message\/delivery-status\b/im.test(rawEmail);

	return hasRelayRecipient && (isDeliveryStatusReport || hasDeliveryStatusPart);
}

export function summarizeDeliveryStatus(rawEmail) {
	const finalRecipientMatch = rawEmail.match(/^Final-Recipient:\s*[^;]+;\s*(.+)$/im);
	const actionMatch = rawEmail.match(/^Action:\s*(.+)$/im);
	const diagnosticCodeMatch = rawEmail.match(/^Diagnostic-Code:\s*.*?\b([245]\d{2})\b/im);
	const action = actionMatch?.[1].trim().toLowerCase();

	return {
		finalRecipient: finalRecipientMatch?.[1].trim(),
		deliveryStatus: action === "failed" ? "rejected" : action === "delayed" ? "deferred" : action || "reported",
		smtpStatus: diagnosticCodeMatch?.[1]
	};
}

export const handler = async (event) => {
	// FIX: Array index access required for SES payloads
	const record = event?.Records?.[0];
	if (!record || !record.ses) {
		console.error("Invalid SES event", { classification: "invalid_event" });
		return;
	}

	const messageId = record.ses.mail?.messageId;
	const recipients = record.ses.receipt?.recipients || [];
	if (!messageId) {
		console.error("SES event missing message ID", { classification: "invalid_event" });
		return;
	}
	if (!recipients.length) {
		console.warn("SES event has no recipients", { messageId, classification: "empty_recipient_list" });
		return;
	}

	// Fetch the raw email payload once per message execution to save performance
	let rawEmail = "";
	let s3Response;
	try {
		s3Response = await s3.send(
			new GetObjectCommand({
				Bucket: S3_BUCKET,
				Key: messageId
			})
		);
	} catch (s3Error) {
		console.error("S3 fetch failed", { messageId, ...describeError(s3Error) });
		return; // Exit early if the raw email cannot be retrieved
	}
	if (!s3Response.Body || typeof s3Response.Body.transformToString !== "function") {
		console.error("S3 object body missing", { messageId, classification: "invalid_s3_object" });
		return;
	}

	// 10 MB Size Guard
	if (s3Response.ContentLength > MAX_SES_SIZE) {
		const sizeMB = (s3Response.ContentLength / (1024 * 1024)).toFixed(2);
		console.warn(`[SIZE EXCEEDED] Message ${messageId} is ${sizeMB} MB, exceeding the 10 MB SES limit.`);
		const rawFrom = record.ses.mail.commonHeaders?.from?.[0] || record.ses.mail.source || "Unknown Sender";
		const subject = record.ses.mail.commonHeaders?.subject || "(No Subject)";
		// Notify each intended internal destination recipient
		for (const originalRecipient of recipients) {
			try {
				const normalizedRecipient = originalRecipient.toLowerCase();
				const domainCatchAll = "@" + normalizedRecipient.split("@")[1];
				// Resolve destination from DynamoDB
				let destination = null;
				const ddbResult = await ddb.send(
					new GetCommand({ TableName: TABLE_NAME, Key: { recipient: normalizedRecipient } })
				);
				if (ddbResult.Item) {
					destination = ddbResult.Item.targetEmail;
				} else {
					const wildcardResult = await ddb.send(
						new GetCommand({ TableName: TABLE_NAME, Key: { recipient: domainCatchAll } })
					);
					if (wildcardResult.Item) destination = wildcardResult.Item.targetEmail;
				}
				if (destination) {
					await ses.send(
						new SendEmailCommand({
							Source: `relay@${FORWARDING_DOMAIN}`,
							Destination: { ToAddresses: [destination] },
							Message: {
								Subject: { Data: `[Undelivered Mail Alert] Large email from ${extractCleanDisplayName(rawFrom)}` },
								Body: {
									Text: {
										Data: `An incoming email addressed to ${originalRecipient} could not be delivered because it exceeded the 10 MB size limit.\r\n\r\n` +
                          `Details:\r\n` +
                          `- From: ${rawFrom}\r\n` +
                          `- Subject: ${subject}\r\n` +
                          `- Size: ${sizeMB} MB (Limit: 10 MB)\r\n\r\n` +
                          `Please ask the sender to share large files via cloud storage (Google Drive, Dropbox, etc.).`
									}
								}
							}
						})
					);
					console.log(`Sent size alert notification to recipient ${destination}`);
				} else {
					console.warn("No forward mapping for oversized message", {
						messageId,
						originalRecipient: normalizedRecipient,
						classification: "unmapped_recipient"
					});
				}
			} catch (notifyError) {
				console.error("Size alert delivery failed", {
					messageId,
					originalRecipient,
					...describeError(notifyError)
				});
			}
		}
		// Auto-purge oversized object from S3
		try {
			await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: messageId }));
			console.log(`Deleted oversized raw email ${messageId} from S3 bucket.`);
		} catch (deleteError) {
			console.error("Oversized email cleanup failed", { messageId, ...describeError(deleteError) });
		}
		return;
	}

	// Read body into memory ONLY if size check passes
	rawEmail = await s3Response.Body.transformToString();

	if (isDeliveryStatusMessage(rawEmail, recipients)) {
		console.warn("Delivery status received", {
			messageId,
			...summarizeDeliveryStatus(rawEmail),
			classification: "delivery_status"
		});
		try {
			await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: messageId }));
			console.log(`Deleted delivery status report ${messageId} from S3 bucket.`);
		} catch (deleteError) {
			console.error("Delivery status cleanup failed", { messageId, ...describeError(deleteError) });
		}
		return;
	}

	// Iterate over each targeted platform recipient
	let sentSuccessfully = false;
	for (const originalRecipient of recipients) {
		let destination = null;
		try {
			const normalizedRecipient = originalRecipient.toLowerCase();
			const domainCatchAll = "@" + normalizedRecipient.split("@")[1];

			// 1. Resolve forward target from DynamoDB
			const ddbResult = await ddb.send(
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
				console.warn("No forward mapping", {
					messageId,
					originalRecipient: normalizedRecipient,
					classification: "unmapped_recipient"
				});
				continue;
			}

			// 2. Work on a copy of the raw email to prevent global string pollution across loop cycles
			let workingEmail = rawEmail;

			// 3. Clean headers that break SES verification (Return-Path, DKIM-Signature, AND Sender)
			workingEmail = workingEmail
				.replace(/^Return-Path:.*?\r?\n/gmi, "")
				.replace(/^Sender:.*?\r?\n/gmi, "")
				.replace(/^DKIM-Signature:[^\r\n]*(?:\r?\n[ \t][^\r\n]*)*\r?\n/gmi, "");

			// Extract raw From header safely (handles header folding)
			const fromHeaderMatch = workingEmail.match(/^From:([\s\S]*?)\r?\n(?![ \t])/im);
			const rawFromHeader = fromHeaderMatch ? fromHeaderMatch[1].replace(/\r?\n\s+/g, " ").trim() : "Unknown Sender";

			const emailMatch = rawFromHeader.match(/<([^>]+)>/) || rawFromHeader.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
			const cleanSenderEmail = emailMatch ? emailMatch[1].trim() : rawFromHeader.trim();
			const cleanSenderName = extractCleanDisplayName(rawFromHeader);

			// Build safe address strings with quotes around display names
			const safeReplyTo = cleanSenderEmail
				? `"${cleanSenderName}" <${cleanSenderEmail}>`
				: `"Platform Relay" <relay@${FORWARDING_DOMAIN}>`;
			const safeFrom = `"${cleanSenderName}" <relay@${FORWARDING_DOMAIN}>`;

			// Rewrite From header cleanly
			workingEmail = workingEmail.replace(/^From:[\s\S]*?\r?\n(?![ \t])/im, `From: ${safeFrom}\r\n`);

			// Safely replace or append Reply-To
			if (/^Reply-To:/im.test(workingEmail)) {
				workingEmail = workingEmail.replace(/^Reply-To:[\s\S]*?\r?\n(?![ \t])/im, `Reply-To: ${safeReplyTo}\r\n`);
			} else {
				workingEmail = `Reply-To: ${safeReplyTo}\r\n` + workingEmail;
			}

			const malformedMimeParameterPattern = /^(Content-(?:Type|Disposition):[^\r\n]*(?:\r?\n[ \t][^\r\n]*)*)(\r?\n)/gim;
			const malformedMimeParameters = [...workingEmail.matchAll(malformedMimeParameterPattern)];
			let mimeRepairApplied = false;

			if (malformedMimeParameters.some(([, header]) => /\b(filename|name)=([^;"'\r\n]*\s[^;"'\r\n]*)/i.test(header))) {
				workingEmail = workingEmail.replace(
					malformedMimeParameterPattern,
					(_, header, lineEnding) => {
						const repairedHeader = header.replace(
							/\b(filename|name)=([^;"'\r\n]*\s[^;"'\r\n]*)/gi,
							(match, parameter, value) => {
								mimeRepairApplied = true;
								return `${parameter}="${value.trim()}"`;
							}
						);

						return repairedHeader + lineEnding;
					}
				);
			}

			if (mimeRepairApplied) {
				console.warn("Repaired malformed MIME parameters before forwarding", {
					messageId,
					originalRecipient,
					destination
				});
			}
      
			// 4. Dispatch forwarded email via SES
			await ses.send(
				new SendRawEmailCommand({
					Source: `relay@${FORWARDING_DOMAIN}`,
					Destinations: [destination],
					RawMessage: { Data: Buffer.from(workingEmail, "utf-8") }
				})
			);

			console.log("Successfully forwarded message", { messageId, destination, mimeRepairApplied });
			sentSuccessfully = true;
		} catch (recipientError) {
			// Non-restrictive handling: If one client's routing crashes, don't break other recipients
			console.error("Email forwarding failed", {
				messageId,
				originalRecipient,
				destination,
				...describeError(recipientError)
			});
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
			console.error("S3 cleanup failed", { messageId, ...describeError(deleteError) });
		}
	}
};