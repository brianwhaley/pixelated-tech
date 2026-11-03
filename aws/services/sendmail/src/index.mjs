import nodemailer from "nodemailer";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "node:crypto";

const platformSender = "info@pixelated.tech";
const debug = false;
const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;
const sesClient = new SESClient({ region: "us-east-1" });
let transporter;

const dynamodb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

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

export async function sendSesEmail(message) {
	const result = await sesClient.send(new SendEmailCommand({
		Source: message.from,
		Destination: {
			ToAddresses: [message.to]
		},
		Message: {
			Subject: { Data: message.subject, Charset: "UTF-8" },
			Body: {
				Html: { Data: message.html, Charset: "UTF-8" },
				Text: { Data: message.text, Charset: "UTF-8" }
			}
		}
	}));

	return { messageId: result.MessageId };
}

const sendEmail = sendSesEmail;

export function getConfirmationMailOptions(body) {
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
}

export function getPrimaryMailOptions(body, html) {
	return {
		from: platformSender,
		to: String(body?.to ?? "").trim() || platformSender,
		subject: body?.subject ?? "Pixelated SendMail",
		html,
		text: html
	};
}

export const handler = async (event) => {
	try {
		const body = event.body
			? typeof event.body === "string"
				? JSON.parse(event.body)
				: event.body
			: {};

		if (Object.keys(body).length === 0) {
			return {
				statusCode: 400,
				body: JSON.stringify({ message: "Bad Request: Request body cannot be empty." }),
				headers: {
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "POST"
				}
			};
		}

		const domain = body?.domain ?? "pixelated.tech";
		const formName = body?.formName ?? "contact-form";

		try {
			body.domain = domain;
			body.formName = formName;
			body.submissionId = randomUUID();
			body.timestamp = new Date().toISOString();
			dynamodb.send(new PutCommand({
				TableName: "PixelatedFormSubmissionsTable",
				Item: body,
			})).catch((dbError) => {
				console.error("Async DynamoDB write failed:", dbError);
			});
		} catch (dbError) {
			console.error("Error starting asynchronous DynamoDB write:", dbError);
		}

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
		if (debug) console.log("Message sent:", info.messageId);

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

		return {
			statusCode: 200,
			body: JSON.stringify({ message: "success", messageId: info.messageId, confirmationMessageId }),
			headers: {
				"Content-Type": "application/json",
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "POST"
			}
		};
	} catch (error) {
		console.error("sendmail lambda error:", error);
		return {
			statusCode: 502,
			body: JSON.stringify({ message: "Internal server error", error: error.message }),
			headers: {
				"Content-Type": "application/json",
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "POST"
			}
		};
	}
};
