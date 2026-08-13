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

function normalizeEntryStatus(entry: any) {
	const status = String(entry?.status || '').trim();
	return status.length ? status : 'Not Emailed';
}

export async function sendMailAction(formData: FormData) {
	'use server';

	const mailerFile = String(formData.get('mailerFile') || '').trim();
	const category = String(formData.get('category') || '').trim();
	const filterStatus = String(formData.get('filterStatus') || '').trim();
	const from = String(formData.get('from') || '').trim();
	const subject = String(formData.get('subject') || '').trim();
	const bodyTemplate = String(formData.get('body') || '').trim();
	const statusQuery = filterStatus || 'All';

	const redirectWithError = (message: string) => {
		return redirect(
			`/mail-merge?status=error&message=${encodeURIComponent(message)}&mailerFile=${encodeURIComponent(mailerFile)}&category=${encodeURIComponent(category)}&filterStatus=${encodeURIComponent(statusQuery)}`
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

	const matchingEntries = entries.filter(entry => {
		const entryCategory = String(entry?.category || '').trim();
		const entryStatus = normalizeEntryStatus(entry);
		const statusMatches = !filterStatus || filterStatus === 'All' ? true : entryStatus === filterStatus;
		return entryCategory === category && statusMatches;
	});
	if (!matchingEntries.length) {
		return redirectWithError(`No entries found for category "${category}" and status "${statusQuery}".`);
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
			entry.status = 'Emailed';
			entry.lastModified = new Date().toISOString();
		} catch {
			failed += 1;
		}
	}

	if (sent > 0) {
		if (Array.isArray(jsonData)) {
			fs.writeFileSync(mailerFilePath, JSON.stringify(jsonData, null, 4) + '\n', 'utf8');
		} else {
			jsonData.venues = entries;
			fs.writeFileSync(mailerFilePath, JSON.stringify(jsonData, null, 4) + '\n', 'utf8');
		}
	}

	const query = new URLSearchParams({
		mailerFile,
		category,
		filterStatus: statusQuery,
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
		filterStatus?: string | string[];
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
	const selectedStatus = normalizeQueryParam(resolvedSearchParams.filterStatus);
	const resultStatus = normalizeQueryParam(resolvedSearchParams.status);
	const sent = normalizeQueryParam(resolvedSearchParams.sent) || '0';
	const failed = normalizeQueryParam(resolvedSearchParams.failed) || '0';
	const message = normalizeQueryParam(resolvedSearchParams.message);

	let categories: string[] = [];
	let statuses: string[] = [];
	let entries: any[] = [];
	let targetCounts: Record<string, number> = {};

	if (selectedFile) {
		const safeFileName = path.basename(selectedFile);
		const mailerFilePath = path.join(mailerDataDirectory, safeFileName);

		if (fs.existsSync(mailerFilePath)) {
			const rawJson = fs.readFileSync(mailerFilePath, 'utf8');
			const jsonData = JSON.parse(rawJson) as any;
			const fileEntries = Array.isArray(jsonData) ? jsonData : jsonData?.venues ?? [];

			if (Array.isArray(fileEntries)) {
				entries = fileEntries;
				categories = Array.from(
					new Set(
						fileEntries
							.map((entry: any) => entry?.category)
							.filter((value: any): value is string => typeof value === 'string' && value.trim().length > 0)
					)
				);

				statuses = Array.from(
					new Set(
						fileEntries
							.map((entry: any) => normalizeEntryStatus(entry))
							.filter((value: any): value is string => typeof value === 'string' && value.trim().length > 0)
					)
				);

				const counts: Record<string, number> = {};
				for (const entry of fileEntries) {
					const category = String(entry?.category || '').trim();
					if (!category) {
						continue;
					}
					const status = normalizeEntryStatus(entry);
					const allKey = `${category}||All`;
					const entryKey = `${category}||${status}`;
					counts[allKey] = (counts[allKey] || 0) + 1;
					counts[entryKey] = (counts[entryKey] || 0) + 1;
				}
				targetCounts = counts;
			}
		}
	}

	return (
		<section id="mail-merge" style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
			<h1>Mail Merge</h1>

			{resultStatus === 'sent' && (
				<div style={{ marginBottom: '20px', padding: '16px', background: '#e6ffed', border: '1px solid #b7f5ce' }}>
					<strong>Mail merge complete.</strong>
					<div>Sent: {sent}</div>
					<div>Failed: {failed}</div>
				</div>
			)}

			{resultStatus === 'error' && message && (
				<div style={{ marginBottom: '20px', padding: '16px', background: '#fff1f0', border: '1px solid #f5c6cb', color: '#a71d2a' }}>
					<strong>Error:</strong>
					<div>{message}</div>
				</div>
			)}

			<form method="get" style={{ marginBottom: '24px' }}>
				<label style={{ marginBottom: '12px' }}>
					Mailer JSON file
					<select name="mailerFile" defaultValue={selectedFile} style={{ padding: '10px', marginTop: '8px' }}>
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
					selectedStatus={selectedStatus}
					categories={categories}
					statuses={statuses}
					targetCounts={targetCounts}
					entries={entries}
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
