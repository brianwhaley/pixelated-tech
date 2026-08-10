import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { redirect } from 'next/navigation';
import { getFullPixelatedConfig } from '@pixelated-tech/components/server';
import { MailMergeClientForm } from './MailMergeClientForm';

export const mailerDataDirectory = path.join(process.cwd(), 'public', 'data', 'mailer');

export function normalizeQueryParam(value?: string | string[]) {
	if (Array.isArray(value)) {
		return value[0] ?? '';
	}

	return value ?? '';
}

export function getCategoriesForFile(fileName: string): string[] {
	const safeFileName = path.basename(fileName);
	const mailerFilePath = path.join(mailerDataDirectory, safeFileName);

	if (!fs.existsSync(mailerFilePath)) {
		return [];
	}

	const rawJson = fs.readFileSync(mailerFilePath, 'utf8');
	const jsonData = JSON.parse(rawJson) as any;
	const entries = Array.isArray(jsonData) ? jsonData : jsonData?.venues ?? [];

	if (!Array.isArray(entries)) {
		return [];
	}

	return Array.from(
		new Set(
			entries
				.map((entry: any) => entry?.category)
				.filter((value: any): value is string => typeof value === 'string' && value.trim().length > 0)
		)
	);
}

export async function sendMailAction(formData: FormData) {
	'use server';

	const mailerFile = String(formData.get('mailerFile') || '').trim();
	const category = String(formData.get('category') || '').trim();
	const from = String(formData.get('from') || '').trim();
	const subject = String(formData.get('subject') || '').trim();
	const bodyTemplate = String(formData.get('body') || '').trim();

	const redirectWithError = (message: string) => {
		return redirect(
			`/mail-merge?status=error&message=${encodeURIComponent(message)}&mailerFile=${encodeURIComponent(mailerFile)}&category=${encodeURIComponent(category)}`
		);
	};

	if (!mailerFile || !category || !from || !subject || !bodyTemplate) {
		return redirectWithError('All fields are required.');
	}

	const safeFileName = path.basename(mailerFile);
	const mailerFilePath = path.join(mailerDataDirectory, safeFileName);

	if (!fs.existsSync(mailerFilePath)) {
		return redirectWithError(`Mailer JSON file not found: ${mailerFile}`);
	}

	const rawJson = fs.readFileSync(mailerFilePath, 'utf8');
	const jsonData = JSON.parse(rawJson) as any;
	const entries = Array.isArray(jsonData) ? jsonData : jsonData?.venues ?? [];

	if (!Array.isArray(entries)) {
		return redirectWithError(`Expected JSON array or object with venues array in ${mailerFile}`);
	}

	const matchingEntries = entries.filter(entry => String(entry?.category || '').trim() === category);
	if (!matchingEntries.length) {
		return redirectWithError(`No entries found for category "${category}".`);
	}

	const config = getFullPixelatedConfig() as any;
	const smtpConfig = config?.integrations?.smtp;
	const hasSmtpConfig = !!(smtpConfig?.smtpHost && smtpConfig?.smtpUser && smtpConfig?.smtpPass);

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

	let sent = 0;
	let failed = 0;

	for (const entry of matchingEntries) {
		const rawEmail = entry?.contactEmail || entry?.email || '';
		const to = Array.isArray(rawEmail) ? rawEmail.filter(Boolean).join(', ') : String(rawEmail || '').trim();

		if (!to) {
			failed += 1;
			continue;
		}

		const renderedBody = bodyTemplate.replace(/\[([^\]]+)\]/g, (_, token) => {
			const value = entry[token];
			if (value == null) return '';
			if (Array.isArray(value)) return value.filter(Boolean).join(', ');
			if (typeof value === 'object') return JSON.stringify(value);
			return String(value);
		});
		const mailOptions = {
			from,
			to,
			subject,
			text: renderedBody,
		};

		try {
			await transporter.sendMail(mailOptions);
			sent += 1;
		} catch {
			failed += 1;
		}
	}

	const query = new URLSearchParams({
		mailerFile,
		category,
		status: 'sent',
		sent: String(sent),
		failed: String(failed),
	});

	return redirect(`/mail-merge?${query.toString()}`);
}

export default async function MailMergePage({
	searchParams,
}: {
	searchParams?: Promise<{
		mailerFile?: string | string[];
		category?: string | string[];
		status?: string | string[];
		sent?: string | string[];
		failed?: string | string[];
		message?: string | string[];
	}>;
}) {
	const resolvedSearchParams = searchParams ? await searchParams : {};
	const mailerFiles = fs.existsSync(mailerDataDirectory)
		? fs
			.readdirSync(mailerDataDirectory)
			.filter((file: string) => file.toLowerCase().endsWith('.json'))
		: [];
	const selectedFile = normalizeQueryParam(resolvedSearchParams.mailerFile);
	const selectedCategory = normalizeQueryParam(resolvedSearchParams.category);
	const status = normalizeQueryParam(resolvedSearchParams.status);
	const sent = normalizeQueryParam(resolvedSearchParams.sent) || '0';
	const failed = normalizeQueryParam(resolvedSearchParams.failed) || '0';
	const message = normalizeQueryParam(resolvedSearchParams.message);
	const categories = selectedFile ? getCategoriesForFile(selectedFile) : [];

	return (
		<section id="mail-merge" style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
			<h1>Mail Merge</h1>

			{status === 'sent' && (
				<div style={{ marginBottom: '20px', padding: '16px', background: '#e6ffed', border: '1px solid #b7f5ce' }}>
					<strong>Mail merge complete.</strong>
					<div>Sent: {sent}</div>
					<div>Failed: {failed}</div>
				</div>
			)}

			{status === 'error' && message && (
				<div style={{ marginBottom: '20px', padding: '16px', background: '#fff1f0', border: '1px solid #f5c6cb', color: '#a71d2a' }}>
					<strong>Error:</strong>
					<div>{message}</div>
				</div>
			)}

			<form method="get" style={{ marginBottom: '24px' }}>
				<label style={{ display: 'block', marginBottom: '12px' }}>
					Mailer JSON file
					<select name="mailerFile" defaultValue={selectedFile} style={{ width: '100%', padding: '10px', marginTop: '8px' }}>
						<option value="">Select a file</option>
						{mailerFiles.map(file => (
							<option key={file} value={file}>
								{file}
							</option>
						))}
					</select>
				</label>
				<button type="submit" style={{ padding: '12px 18px' }}>
					Load categories
				</button>
			</form>

			{selectedFile && (
				<MailMergeClientForm
					selectedFile={selectedFile}
					selectedCategory={selectedCategory}
					categories={categories}
					sendMailAction={sendMailAction}
				/>
			)}

			{selectedFile && categories.length === 0 && (
				<div style={{ marginTop: '16px', color: '#a71d2a', background: '#fff1f0', padding: '12px', borderRadius: '6px' }}>
					No categories found for {selectedFile}.
				</div>
			)}
		</section>
	);
}
