import fs from 'fs';
import path from 'path';
import { 
	SitesJsonData, 
	SiteConfig, 
	InvoiceData, 
	InvoiceItem,
	BlogPostBilling,
	SocialReferrerBilling,
	FormCompletion,
	GeneratedInvoiceResult
} from './billing.types';
import { getOriginFromHeaders } from '../../foundation/sitemap';

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
			sites: Array.isArray(parsed.sites) ? parsed.sites : [],
			enhancements: parsed.enhancements || {}
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
	socialReferrers: SocialReferrerBilling[] = [],
	formCompletions: FormCompletion[] = [],
	enhancements: Record<string, string[]> = {}
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

	const rawAdditionalItems = site.billing.additionalInvoiceItems?.[billingMonth];
	const additionalInvoiceItems = rawAdditionalItems
		? (Array.isArray(rawAdditionalItems) ? rawAdditionalItems : [rawAdditionalItems])
		: [];

	const additionalItems: InvoiceItem[] = additionalInvoiceItems.map((item) => ({
		description: item.description,
		amount: item.amount
	}));

	const subscriptionItem: InvoiceItem = {
		description: `Monthly Subscription Service: ${tierName.toUpperCase()} Plan` + 
			(servicesList.length > 0 
				? `<ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 13px; color: #555; line-height: 1.5;">` + 
				  servicesList.map((service: string) => `<li style="margin-bottom: 4px;">${service}</li>`).join('') + 
				  `</ul>`
				: ''),
		amount: basePrice
	};

	const items: InvoiceItem[] = [
		...additionalItems,
		subscriptionItem
	];

	const totalOwed = Math.round(items.reduce((acc, item) => acc + item.amount, 0) * 100) / 100;
	const ga4PropertyId = typeof site.ga4PropertyId === 'string' && site.ga4PropertyId.trim() && site.ga4PropertyId !== 'GA4_PROPERTY_ID_HERE'
		? site.ga4PropertyId.trim()
		: undefined;

	const enhancementsForMonth = Array.isArray(enhancements[billingMonth]) ? enhancements[billingMonth] : [];

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
		ga4PropertyId,
		tier: tierName,
		items,
		totalOwed,
		paymentInfo,
		posts,
		socialReferrers,
		formCompletions,
		enhancements: enhancementsForMonth,
		note: getBillingNote(site, billingMonth)
	};
}

/**
 * Helper to retrieve a billing note for a given billing month (YYYY-MM).
 * Strict behavior: `billingMonth` must be provided. If `site.billing.notes` exists
 * return the matching note string or empty string when missing. Do not fallback.
 */
export function getBillingNote(site: SiteConfig, billingMonth: string): string | string[] | undefined {
	if (!billingMonth) {
		throw new Error('billingMonth is required to retrieve billing note');
	}

	const billing = site?.billing;
	if (!billing) return undefined;

	const notes = billing.notes;
	if (notes && typeof notes === 'object') {
		const monthNote = notes[billingMonth] as string | string[] | undefined;
		if (typeof monthNote === 'string' || Array.isArray(monthNote)) {
			return monthNote;
		}
	}

	return undefined;
}
