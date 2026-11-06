import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { DeleteObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { getSesMessageBody, parseEmailAddresses, sendEmail } from "./mail-transport.mjs";

const platformSender = "info@pixelated.tech";

export { getSesMessageBody, parseEmailAddresses };

export const getConfirmationMailOptions = (body) => {
	const recipientField = String(body?.confirmationRecipientField ?? "").trim();
	const recipient = recipientField ? String(body?.[recipientField] ?? "").trim() : "";
	const subject = String(body?.confirmationSubject ?? "").trim();
	const text = String(body?.confirmationBody ?? "");
	const domain = String(body?.domain ?? "").trim().toLowerCase();

	if (!recipient || !subject || !text.trim() || !domain || !domain.includes(".") || /[^a-z0-9.-]/.test(domain)) return null;

	return {
		from: `thankyou@${domain}`,
		to: recipient,
		cc: `thankyou@${domain}`,
		subject,
		text
	};
};

export const getPrimaryMailOptions = (body, html) => ({
	from: platformSender,
	to: String(body?.to ?? "").trim() || platformSender,
	bcc: "brian@pixelated.tech",
	subject: body?.subject ?? "Pixelated Form Submission",
	html,
	text: html
});

const bucketName = process.env.S3_BUCKET;

if (!bucketName) {
	throw new Error("S3_BUCKET must be configured");
}

const dynamodb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});

const readSubmission = async (objectKey) => {
	const response = await s3.send(new GetObjectCommand({
		Bucket: bucketName,
		Key: objectKey
	}));

	const contents = await response.Body.transformToString();
	const body = JSON.parse(contents);

	if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length === 0) {
		throw new Error("S3 submission body cannot be empty");
	}

	return body;
};

const processSubmission = async (record) => {
	const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
	const body = await readSubmission(objectKey);
	const domain = body?.domain ?? "pixelated.tech";
	const formName = body?.formName ?? "contact-form";

	body.domain = domain;
	body.formName = formName;
	body.submissionId = body.submissionId ?? (objectKey.split("/").pop()?.replace(/\.json$/, "") || randomUUID());
	body.timestamp = body.timestamp ?? new Date().toISOString();

	await dynamodb.send(new PutCommand({
		TableName: "PixelatedFormSubmissionsTable",
		Item: body
	}));

	let bodyText = "<h2>Form Details</h2>";
	for (const key in body) {
		const label = key.replace("_", " ");
		const formattedLabel = label
			.toLowerCase()
			.split(" ")
			.map((word) => word.charAt(0).toUpperCase() + word.substring(1))
			.join(" ");
		bodyText += `<p><strong>${formattedLabel} : </strong>${body[key]}</p>`;
	}

	const info = await sendEmail(getPrimaryMailOptions(body, bodyText));
	let confirmationMessageId;
	const confirmationMailOptions = getConfirmationMailOptions(body);
	if (confirmationMailOptions) {
		try {
			const confirmationInfo = await sendEmail(confirmationMailOptions);
			confirmationMessageId = confirmationInfo.messageId;
		} catch (confirmationError) {
			console.error("Confirmation email failed:", confirmationError);
		}
	}

	await s3.send(new DeleteObjectCommand({
		Bucket: bucketName,
		Key: objectKey
	}));

	return { messageId: info.messageId, confirmationMessageId };
};

export const handler = async (event) => {
	if (!event?.Records?.length) {
		throw new Error("S3 event must contain at least one record");
	}

	for (const record of event.Records) {
		await processSubmission(record);
	}
};
