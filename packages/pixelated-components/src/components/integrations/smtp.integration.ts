import nodemailer from 'nodemailer';
import { getFullPixelatedConfig } from '../config/config';

export async function sendSmtpMail(mailOptions: any, options: { allowStreamFallback?: boolean } = {}) {
	const smtpConfig = (getFullPixelatedConfig() as any)?.integrations?.smtp;
	const hasSmtpConfig = !!(smtpConfig?.smtpHost && smtpConfig?.smtpUser && smtpConfig?.smtpPass);
	if (!hasSmtpConfig && !options.allowStreamFallback) throw new Error('SMTP configuration is missing.');
	const transporter = hasSmtpConfig
		? nodemailer.createTransport({
			host: smtpConfig.smtpHost,
			port: smtpConfig.smtpPort || 465,
			secure: smtpConfig.smtpSecure !== false,
			auth: {
				user: smtpConfig.smtpUser,
				pass: smtpConfig.smtpPass,
			},
		})
		: nodemailer.createTransport({
			streamTransport: true,
			newline: 'unix',
			buffer: true,
		});
	return { info: await transporter.sendMail(mailOptions), hasSmtpConfig };
}

export async function sendSmtpEmail(from: string, to: string, subject: string, body: string) {
	return sendSmtpMail({ from, to, subject, text: body });
}
