import {
	CreateEmailIdentityCommand,
	DkimSigningKeyLength,
	GetEmailIdentityCommand,
	SendEmailCommand,
	SESv2Client,
} from '@aws-sdk/client-sesv2';
import fs from 'node:fs/promises';
import { getFullPixelatedConfig } from '../config/config';

const DEFAULT_SES_FROM = 'info@pixelated.tech';

function getSesClient(region: string) {
	const aws = getFullPixelatedConfig()?.integrations?.aws;
	return new SESv2Client({
		region,
		credentials: (aws?.access_key_id && aws?.secret_access_key) ? {
			accessKeyId: aws.access_key_id,
			secretAccessKey: aws.secret_access_key,
			sessionToken: aws.session_token,
		} : undefined,
	});
}

export async function getSesEmailIdentity(region: string, domain: string) {
	return getSesClient(region).send(new GetEmailIdentityCommand({ EmailIdentity: domain }));
}

export async function createSesEmailIdentity(region: string, domain: string) {
	return getSesClient(region).send(new CreateEmailIdentityCommand({
		EmailIdentity: domain,
		DkimSigningAttributes: { NextSigningKeyLength: DkimSigningKeyLength.RSA_2048_BIT },
	}));
}

export async function sendSesMail(mailOptions: any) {
	const aws = getFullPixelatedConfig()?.integrations?.aws;
	const region = aws?.region || 'us-east-1';
	const attachments = await Promise.all((mailOptions.attachments || []).map(async (attachment: any) => ({
		FileName: attachment.filename,
		RawContent: attachment.content ?? await fs.readFile(attachment.path),
		ContentType: attachment.contentType,
		ContentDisposition: 'ATTACHMENT' as const,
		ContentTransferEncoding: 'BASE64' as const,
	})));
	const command = new SendEmailCommand({
		FromEmailAddress: DEFAULT_SES_FROM,
		Destination: {
			ToAddresses: Array.isArray(mailOptions.to) ? mailOptions.to : [mailOptions.to],
			CcAddresses: mailOptions.cc ? (Array.isArray(mailOptions.cc) ? mailOptions.cc : [mailOptions.cc]) : undefined,
			BccAddresses: mailOptions.bcc ? (Array.isArray(mailOptions.bcc) ? mailOptions.bcc : [mailOptions.bcc]) : undefined,
		},
		ReplyToAddresses: mailOptions.replyTo || mailOptions.from
			? (Array.isArray(mailOptions.replyTo || mailOptions.from) ? (mailOptions.replyTo || mailOptions.from) : [mailOptions.replyTo || mailOptions.from])
			: undefined,
		Content: {
			Simple: {
				Subject: { Data: mailOptions.subject || '' },
				Body: {
					Text: mailOptions.text ? { Data: mailOptions.text } : undefined,
					Html: mailOptions.html ? { Data: mailOptions.html } : undefined,
				},
				Attachments: attachments.length ? attachments : undefined,
			},
		},
	});
	const info = await getSesClient(region).send(command);
	return { info, hasSesConfig: true };
}

export async function sendSesEmail(from: string, to: string, subject: string, body: string) {
	return sendSesMail({ from, to, subject, text: body, replyTo: from });
}
