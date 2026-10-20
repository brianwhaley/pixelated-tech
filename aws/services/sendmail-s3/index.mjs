import nodemailer from "nodemailer";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { DeleteObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";

const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;
const bucketName = process.env.S3_BUCKET;

if (!smtpUser || !smtpPassword) {
	throw new Error("SMTP_USER and SMTP_PASSWORD must be configured");
}

if (!bucketName) {
	throw new Error("S3_BUCKET must be configured");
}

const transporter = nodemailer.createTransport({
	host: "smtp.gmail.com",
	port: 465,
	secure: true,
	auth: {
		user: smtpUser,
		pass: smtpPassword
	}
});

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

	const mailOptions = {
		from: body.from ?? smtpUser,
		to: body.to ?? smtpUser,
		subject: body.subject ?? "Pixelated SendMail",
		html: bodyText
	};

	const info = await transporter.sendMail(mailOptions);

	await s3.send(new DeleteObjectCommand({
		Bucket: bucketName,
		Key: objectKey
	}));

	console.log("Processed Sendmail S3 object", {
		key: objectKey,
		messageId: info.messageId
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
