import nodemailer from "nodemailer";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;
const sesClient = new SESClient({ region: "us-east-1" });
let gmailTransporter;

export const parseEmailAddresses = (value) => String(value ?? "")
	.split(",")
	.map((address) => address.trim())
	.filter(Boolean);

export const getSesMessageBody = (message) => {
	const body = {
		Text: { Data: message.text, Charset: "UTF-8" }
	};
	if (message.html) body.Html = { Data: message.html, Charset: "UTF-8" };
	return body;
};

const getGmailTransporter = () => {
	if (!smtpUser || !smtpPassword) {
		throw new Error("SMTP_USER and SMTP_PASSWORD must be configured for Gmail delivery");
	}

	gmailTransporter ??= nodemailer.createTransport({
		host: "smtp.gmail.com",
		port: 465,
		secure: true,
		auth: {
			user: smtpUser,
			pass: smtpPassword
		}
	});

	return gmailTransporter;
};

export async function sendGmailEmail(message) {
	const info = await getGmailTransporter().sendMail({
		from: message.from,
		to: message.to,
		...(message.cc ? { cc: message.cc } : {}),
		...(message.bcc ? { bcc: message.bcc } : {}),
		subject: message.subject,
		html: message.html,
		text: message.text
	});

	return { messageId: info.messageId };
}

export async function sendSesEmail(message) {
	const toAddresses = parseEmailAddresses(message.to);
	const ccAddresses = parseEmailAddresses(message.cc);
	const bccAddresses = parseEmailAddresses(message.bcc);

	const result = await sesClient.send(new SendEmailCommand({
		Source: message.from,
		Destination: {
			ToAddresses: toAddresses,
			...(ccAddresses.length ? { CcAddresses: ccAddresses } : {}),
			...(bccAddresses.length ? { BccAddresses: bccAddresses } : {})
		},
		Message: {
			Subject: { Data: message.subject, Charset: "UTF-8" },
			Body: getSesMessageBody(message)
		}
	}));

	return { messageId: result.MessageId };
}

export const sendEmail = sendSesEmail;
