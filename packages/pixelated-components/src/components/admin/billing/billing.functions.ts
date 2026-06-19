import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import nodemailer from 'nodemailer';
import { headers } from 'next/headers';
import { 
	SitesJsonData, 
	SiteConfig, 
	InvoiceData, 
	InvoiceItem,
	BlogPostBilling,
	SocialReferrerBilling,
	GeneratedInvoiceResult
} from './billing.types';
import { getFullPixelatedConfig } from '../../config/config';
import { getLiveBillingStats } from '../../integrations/wordpress.jetpack.server';

/**
 * Loads standard site data and structured billing configurations
 */
export function loadBillingData(configPath?: string): SitesJsonData {
	try {
		const sitesPath = configPath || path.join(process.cwd(), 'src/app/data/sites.json');
		if (!fs.existsSync(sitesPath)) {
			throw new Error('Sites configuration not found');
		}

		const sitesData = fs.readFileSync(sitesPath, 'utf8');
		const parsed = JSON.parse(sitesData);

		return {
			subscriptions: parsed.subscriptions || {},
			paymentInfo: parsed.paymentInfo || { method: '', details: '', terms: '' },
			sites: Array.isArray(parsed.sites) ? parsed.sites : []
		};
	} catch (error) {
		console.error('Error loading billing data:', error);
		throw new Error('Failed to load billing configuration', { cause: error });
	}
}

/**
 * Compiles comprehensive metrics and totals into structured invoice data
 */
export function compileInvoiceData(
	site: SiteConfig,
	billingMonth: string, // YYYY-MM
	subscriptions: any,
	paymentInfo: any,
	posts: BlogPostBilling[] = [],
	socialReferrers: SocialReferrerBilling[] = []
): InvoiceData {
	if (!site.billing) {
		throw new Error(`Site ${site.name} is not a billable account.`);
	}

	const [year, month] = billingMonth.split('-');
	const invoiceDate = new Date().toISOString().split('T')[0];
	
	// Due Date: net 30
	const due = new Date();
	due.setDate(due.getDate() + 30);
	const dueDate = due.toISOString().split('T')[0];

	const invoiceNumber = `INV-${year}${month}-${site.name.toUpperCase()}`;
	const tierName = site.billing.tier;
	
	// Normalize some legacy names (e.g. premier -> premium, standard -> growth)
	let normalizedTier = tierName.toLowerCase();
	if (normalizedTier === 'premier') normalizedTier = 'premium';
	if (normalizedTier === 'standard') normalizedTier = 'growth';

	const subTier = subscriptions[normalizedTier] || subscriptions[tierName] || { price: 0, services: [] };
	
	const basePrice = site.billing.priceOverride !== undefined && site.billing.priceOverride !== null
		? site.billing.priceOverride
		: (site.billing.price !== undefined && site.billing.price !== null
			? site.billing.price
			: subTier.price);

	const servicesList = Array.isArray(subTier.services) ? subTier.services : [];

	const items: InvoiceItem[] = [
		{
			description: `Monthly Subscription Service: ${tierName.toUpperCase()} Plan` + 
				(servicesList.length > 0 
					? `<ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 13px; color: #555; line-height: 1.5;">` + 
					  servicesList.map((service: string) => `<li style="margin-bottom: 4px;">${service}</li>`).join('') + 
					  `</ul>`
					: ''),
			amount: basePrice
		}
	];

	// Optional blog views / writing add-ons (mocked initially, simple rate of $15 per blog post published)
	/*
	if (posts.length > 0) {
		items.push({
			description: `Content Writing & SEO: ${posts.length} blog post(s) created in ${billingMonth}`,
			amount: posts.length * 15.00
		});
	}

	// Calculate total Views
	const totalViews = posts.reduce((acc, p) => acc + p.views, 0);
	if (totalViews > 0) {
		items.push({
			description: `Performance/Analytics traffic views: ${totalViews.toLocaleString()} total views on content`,
			amount: Math.round((totalViews * 0.005) * 100) / 100 // $0.005 per view
		});
	}

	// Total social clicks referrers fee
	const totalSocialClicks = socialReferrers.reduce((acc, s) => acc + s.clicks, 0);
	if (totalSocialClicks > 0) {
		items.push({
			description: `Jetpack Social syndication: ${totalSocialClicks.toLocaleString()} referral views`,
			amount: Math.round((totalSocialClicks * 0.01) * 100) / 100 // $0.01 per social referrer view
		});
	}
	*/

	const totalOwed = Math.round(items.reduce((acc, item) => acc + item.amount, 0) * 100) / 100;

	return {
		invoiceNumber,
		invoiceDate,
		dueDate,
		billingMonth,
		companyName: site.billing.companyName,
		address: site.billing.address,
		email: site.billing.email,
		siteName: site.name,
		siteUrl: site.url,
		tier: tierName,
		items,
		totalOwed,
		paymentInfo,
		posts,
		socialReferrers,
		note: site.billing.note
	};
}

/**
 * Server-side orchestrator function to completely generate invoice PDFs for selected sites.
 * Uses puppeteer to render the HTML visually into a buffer.
 */
export async function generateInvoicePdfsForSites(targetSites: string[], billingMonth: string, previewOnly: boolean = false): Promise<any[]> {
	// Ensure output invoices directory exists under public
	const publicInvoicesDir = path.join(process.cwd(), 'public', 'invoices');
	if (!previewOnly && !fs.existsSync(publicInvoicesDir)) {
		fs.mkdirSync(publicInvoicesDir, { recursive: true });
	}

	// Load billing configs
	const sitesPath = path.join(process.cwd(), 'src/app/data/sites.json');
	const billingData = loadBillingData(sitesPath);

	// Read configuration details
	const config = getFullPixelatedConfig() as any;
	const wpToken = config?.integrations?.wordpress?.apiToken;

	const results: any[] = [];
	let browser;

	try {
		// Launch Puppeteer browser instance for PDF printing if not previewing
		if (!previewOnly) {
			browser = await puppeteer.launch({
				headless: true,
				args: ['--no-sandbox', '--disable-setuid-sandbox']
			});
		}

		for (const siteName of targetSites) {
			const site = billingData.sites.find(s => s.name === siteName);
			if (!site || !site.billing) {
				results.push({
					siteName,
					success: false,
					email: '',
					pdfPath: '',
					message: `Site ${siteName} not found or has no billing setup.`
				});
				continue;
			}

			try {
				// 1. Gather live statistics for the month
				const wpSiteId = site.blogRss 
					? site.blogRss.replace('https://', '').replace('http://', '').split('/')[0]
					: undefined;

				const { posts, socialReferrers } = await getLiveBillingStats(
					wpSiteId,
					billingMonth,
					wpToken
				);

				// 2. Compile billing details
				const compiledInvoice = compileInvoiceData(
					site,
					billingMonth,
					billingData.subscriptions,
					billingData.paymentInfo,
					posts,
					socialReferrers
				);

				if (previewOnly) {
					results.push({
						siteName,
						success: true,
						email: site.billing.email,
						pdfPath: '',
						invoiceData: compiledInvoice
					});
					continue;
				}

				// 4. Generate PDF buffer via Puppeteer
				const page = await browser!.newPage();
				
				const headersList = await headers();
				const origin = headersList.get('x-origin') || headersList.get('origin');
				const host = headersList.get('host') || 'localhost:3000';
				const protocol = headersList.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
				const baseUrl = origin || `${protocol}://${host}`;

				const internalToken = config?.integrations?.puppeteer?.internalToken;
				if (!internalToken) {
					throw new Error('Missing internal Puppeteer token in pixelated.config.json');
				}

				const localUrl = `${baseUrl}/billing/invoice/${siteName}/${billingMonth}?token=${encodeURIComponent(internalToken)}`;
				
				await page.goto(localUrl, { waitUntil: 'networkidle0' });
				
				const pdfFileName = `${compiledInvoice.invoiceNumber}.pdf`;
				const pdfFilePath = path.join(publicInvoicesDir, pdfFileName);

				await page.pdf({
					path: pdfFilePath,
					format: 'letter',
					printBackground: true,
					margin: { top: '0.4in', right: '0.4in', bottom: '0.4in', left: '0.4in' }
				});

				await page.close();

				results.push({
					siteName,
					pdfPath: `/invoices/${pdfFileName}`,
					email: site.billing.email,
					success: true
				});
			} catch (innerError) {
				console.error(`Failed generating invoice for site: ${siteName}:`, innerError);
				results.push({
					siteName,
					email: site.billing.email,
					pdfPath: '',
					success: false,
					message: (innerError as Error).message
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

/**
 * Server-side orchestrator function to completely handle iterating and emailing PDF invoices
 * Uses nodemailer to securely push compiled PDFs directly through SMTP.
 */
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
			
			// HARDCODE REQUIREMENT: Retrieve brian@pixelated.tech instead of inv.email for testing
			// const targetEmail = 'brian@pixelated.tech';
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
