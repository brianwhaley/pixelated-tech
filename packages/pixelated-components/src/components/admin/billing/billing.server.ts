"use server";

import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import nodemailer from 'nodemailer';
import { headers } from 'next/headers';
import { getFullPixelatedConfig } from '../../config/config';
import { getLiveBillingStats } from '../../integrations/wordpress.jetpack.server';
import {
	listPixelatedFormSubmissionReportRows,
	DEFAULT_PIXELATED_FORM_SUBMISSIONS_TABLE
} from '../../integrations/aws.dynamo.integration';
import { loadBillingData } from './billing.functions';

export async function loadBillingConfigData(month?: string, siteName?: string) {
	const sitesPath = path.join(process.cwd(), 'src/app/data/sites.json');
	const billingData = loadBillingData(sitesPath);

	let formCompletions: Array<{ submitAt: string; formName: string; email: string }> = [];
	if (month) {
		const site = siteName ? billingData.sites.find((s) => s.name === siteName) : undefined;
		const source = site?.url || site?.blogRss;
		let domain: string | undefined;
		if (source) {
			try {
				domain = new URL(source).hostname.replace(/^www\./, '');
			} catch {
				domain = source.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
			}
		}

		const rows = await listPixelatedFormSubmissionReportRows({
			tableName: DEFAULT_PIXELATED_FORM_SUBMISSIONS_TABLE,
			domain,
		});
		formCompletions = rows
			.filter((row) => {
				const created = new Date(row.created_at || '');
				return created.getTime() > 0 && `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}` === month;
			})
			.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
			.map((row) => ({
				submitAt: row.created_at,
				formName: row.formName || '',
				email: row.shipping_to?.email || row.registration_data?.email || '',
			}));
	}

	return {
		...billingData,
		formCompletions,
	};
}

export async function generateInvoicePdfsForSites(targetSites: string[], billingMonth: string, previewOnly: boolean = false): Promise<any[]> {
	const publicInvoicesDir = path.join(process.cwd(), 'public', 'invoices');
	if (!previewOnly && !fs.existsSync(publicInvoicesDir)) {
		fs.mkdirSync(publicInvoicesDir, { recursive: true });
	}

	const sitesPath = path.join(process.cwd(), 'src/app/data/sites.json');
	const billingData = loadBillingData(sitesPath);

	const config = getFullPixelatedConfig() as any;
	const wpToken = config?.integrations?.wordpress?.apiToken;

	const results: any[] = [];
	let browser;

	try {
		if (!previewOnly) {
			browser = await puppeteer.launch({
				headless: true,
				args: ['--no-sandbox', '--disable-setuid-sandbox'],
			});
		}

		for (const siteName of targetSites) {
			const site = billingData.sites.find((s) => s.name === siteName);
			if (!site || !site.billing) {
				results.push({
					siteName,
					success: false,
					email: '',
					pdfPath: '',
					message: `Site ${siteName} not found or has no billing setup.`,
				});
				continue;
			}

			try {
				const wpSiteId = site.blogRss
					? site.blogRss.replace('https://', '').replace('http://', '').split('/')[0]
					: undefined;

				const { posts, socialReferrers } = await getLiveBillingStats(
					wpSiteId,
					billingMonth,
					wpToken
				);

				const siteBillingData = await loadBillingConfigData(billingMonth, siteName);
				const compiledInvoice = (await import('./billing.functions')).compileInvoiceData(
					site,
					billingMonth,
					billingData.subscriptions,
					billingData.paymentInfo,
					posts,
					socialReferrers,
					siteBillingData.formCompletions || [],
					billingData.enhancements || {}
				);

				if (previewOnly) {
					results.push({
						siteName,
						email: site.billing.email,
						pdfPath: '',
						invoiceData: compiledInvoice,
						success: true,
					});
					continue;
				}

				const page = await browser!.newPage();
				const headersList = await headers();
				const origin = headersList.get('x-origin') || headersList.get('origin') || undefined;
				const host = headersList.get('host');
				const protocol = headersList.get('x-forwarded-proto') || undefined;
				const baseUrl = origin ?? (host ? `${protocol ?? 'https'}://${host}` : undefined);

				const internalToken = config?.integrations?.puppeteer?.internalToken;
				if (!internalToken) {
					throw new Error('Missing internal Puppeteer token in pixelated.config.json');
				}

				if (!baseUrl) throw new Error('Unable to determine base URL for puppeteer invoice generation');

				const localUrl = `${baseUrl}/billing/invoice/${siteName}/${billingMonth}?token=${encodeURIComponent(internalToken)}`;
				await page.goto(localUrl, { waitUntil: 'networkidle0' });
			
				const pdfFileName = `${compiledInvoice.invoiceNumber}.pdf`;
				await page.pdf({
					path: path.join(publicInvoicesDir, pdfFileName),
					format: 'letter',
					printBackground: true,
					margin: { top: '0.4in', right: '0.4in', bottom: '0.4in', left: '0.4in' }
				});
				await page.close();

				results.push({
					siteName,
					pdfPath: `/invoices/${pdfFileName}`,
					email: site.billing.email,
					success: true,
				});
			} catch (innerError) {
				console.error(`Failed generating invoice for site: ${siteName}:`, innerError);
				results.push({
					siteName,
					email: site.billing.email,
					pdfPath: '',
					success: false,
					message: (innerError as Error).message,
				});
			}
		}
	} finally {
		if (browser) {
			await browser.close();
		}
	}

	return results;
}

export async function dispatchInvoiceEmails(invoices: { siteName: string; pdfPath: string; email: string }[]): Promise<string[]> {
	const config = getFullPixelatedConfig() as any;
	const smtpConfig = config?.integrations?.smtp;

	let fromEmail = '"Pixelated Technologies" <billing@pixelated.tech>';
	try {
		const sitesPath = path.join(process.cwd(), 'src/app/data/sites.json');
		if (fs.existsSync(sitesPath)) {
			const sitesData = JSON.parse(fs.readFileSync(sitesPath, 'utf8'));
			if (sitesData?.paymentInfo?.fromEmail) {
				fromEmail = sitesData.paymentInfo.fromEmail;
			}
		}
	} catch (e) {
		console.error('Error reading fromEmail from sites.json:', e);
	}
	
	const hasSmtpConfig = !!(smtpConfig && (smtpConfig as any).smtpHost && (smtpConfig as any).smtpUser && (smtpConfig as any).smtpPass);
	
	let transporter;
	if (hasSmtpConfig) {
		transporter = nodemailer.createTransport({
			host: (smtpConfig as any).smtpHost,
			port: (smtpConfig as any).smtpPort || 465,
			secure: (smtpConfig as any).smtpSecure !== false,
			auth: {
				user: (smtpConfig as any).smtpUser,
				pass: (smtpConfig as any).smtpPass,
			},
		});
	} else {
		transporter = nodemailer.createTransport({
			streamTransport: true,
			newline: 'unix',
			buffer: true
		});
	}

	const logs: string[] = [];

	for (const inv of invoices) {
		try {
			const timestamp = new Date().toLocaleTimeString();
			const targetEmail = inv.email;

			logs.push(`[${timestamp}] 📬 Preparing invoice email for ${inv.siteName}...`);
			logs.push(`[${timestamp}] 📄 Attaching generated PDF file from public path: ${inv.pdfPath}`);
			logs.push(`[${timestamp}] 🚀 Sending invoice out to registered billing address: ${targetEmail}`);

			const pdfFullPath = path.join(process.cwd(), 'public', inv.pdfPath);
			if (!fs.existsSync(pdfFullPath)) {
				throw new Error(`Invoice PDF file not found on disk at: ${pdfFullPath}`);
			}

			const mailOptions = {
				from: fromEmail,
				to: targetEmail,
				subject: `Invoice for ${inv.siteName} - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`,
				text: `Hi,\n\nPlease find attached your monthly subscription service invoice for ${inv.siteName}.\n\nThank you for your business!\n\nBest regards,\nPixelated Technologies\n\n\n`,
				attachments: [
					{
						filename: path.basename(pdfFullPath),
						path: pdfFullPath,
						contentType: 'application/pdf'
					}
				]
			};

			const info = await transporter.sendMail(mailOptions);
			if (!hasSmtpConfig) {
				logs.push(`[${timestamp}] ℹ️ Running in Local Stream Mode (Nodemailer Compiled successfully).`);
				logs.push(`[${timestamp}] ✅ Email dispatched successfully to ${targetEmail}! Message size: ${(info as any).message.length} bytes.`);
			} else {
				logs.push(`[${timestamp}] ✅ Email dispatched successfully over SMTP to ${targetEmail}! ID: ${info.messageId}`);
			}
			logs.push('--------------------------------------------------');
		} catch (err) {
			const timestamp = new Date().toLocaleTimeString();
			logs.push(`[${timestamp}] [ERROR] Failed to email invoice for ${inv.siteName}: ${(err as Error).message}`);
			logs.push('--------------------------------------------------');
		}
	}

	return logs;
}
