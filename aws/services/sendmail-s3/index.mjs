import nodemailer from "nodemailer";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { DeleteObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";

const platformSender = "info@pixelated.tech";
const debug = false;
const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;
const bucketName = process.env.S3_BUCKET;

if (!bucketName) {
	throw new Error("S3_BUCKET must be configured");
}

const sesClient = new SESClient({ region: "us-east-1" });
let transporter;

const dynamodb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});

const getGmailTransporter = () => {
	if (!smtpUser || !smtpPassword) {
		throw new Error("SMTP_USER and SMTP_PASSWORD must be configured for Gmail delivery");
	}
	transporter ??= nodemailer.createTransport({
		host: "smtp.gmail.com",
		port: 465,
		secure: true,
		auth: {
			user: smtpUser,
			pass: smtpPassword
		}
	});
	return transporter;
};

export async function sendGmailEmail(message) {
	const info = await getGmailTransporter().sendMail({
		from: message.from,
		to: message.to,
		subject: message.subject,
		html: message.html,
		text: message.text
	});
	return { messageId: info.messageId };
}

export const getSesMessageBody = (message) => {
	const body = {
		Text: { Data: message.text, Charset: "UTF-8" }
	};
	if (message.html) body.Html = { Data: message.html, Charset: "UTF-8" };
	return body;
};

export async function sendSesEmail(message) {
	const result = await sesClient.send(new SendEmailCommand({
		Source: message.from,
		Destination: {
			ToAddresses: [message.to]
		},
		Message: {
			Subject: { Data: message.subject, Charset: "UTF-8" },
			Body: getSesMessageBody(message)
		}
	}));
	return { messageId: result.MessageId };
}

const sendEmail = sendSesEmail;

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
		subject,
		text
	};
};

export const getPrimaryMailOptions = (body, html) => ({
	from: platformSender,
	to: String(body?.to ?? "").trim() || platformSender,
	subject: body?.subject ?? "Pixelated SendMail",
	html,
	text: html
});

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

	if (debug) console.log("Processed Sendmail S3 object", {
		key: objectKey,
		messageId: info.messageId,
		confirmationMessageId
	});
};

export const handler = async (event) => {
	if (!event?.Records?.length) {
		throw new Error("S3 event must contain at least one record");
	}

	for (const record of event.Records) {
		await processSubmission(record);
	}
};
