import fs from 'fs';
import path from 'path';
import { 
	SitesJsonData, 
	SiteConfig, 
	InvoiceData, 
	InvoiceItem,
	AdHocInvoiceConfig,
	PaymentInfo,
	BlogPostBilling,
	SocialReferrerBilling,
	FormCompletion,
	GeneratedInvoiceResult,
	BillingSummary,
	Subscriptions
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

function roundCurrency(amount: number): number {
	return Math.round(amount * 100) / 100;
}

export function getMonthlyBillingPrice(site: SiteConfig, subscriptions: Subscriptions): number {
	if (!site.monthlyBilling) {
		throw new Error(`Site ${site.name} is not a billable account.`);
	}

	const { priceOverride, price, tier } = site.monthlyBilling;
	if (priceOverride !== undefined && priceOverride !== null) return priceOverride;
	if (price !== undefined && price !== null) return price;

	const subscription = subscriptions[tier];
	return subscription?.price || 0;
}

export function isMonthlyBillingActive(site: SiteConfig, billingMonth: string): boolean {
	if (!site.monthlyBilling) return false;

	const { billingStartMonth, billingEndMonth } = site.monthlyBilling;
	return (!billingStartMonth || billingMonth >= billingStartMonth)
		&& (!billingEndMonth || billingMonth <= billingEndMonth);
}

export function getAdditionalInvoiceItems(site: SiteConfig, billingMonth: string): InvoiceItem[] {
	const rawAdditionalItems = site.monthlyBilling?.additionalInvoiceItems?.[billingMonth];
	const additionalInvoiceItems = rawAdditionalItems
		? (Array.isArray(rawAdditionalItems) ? rawAdditionalItems : [rawAdditionalItems])
		: [];

	return additionalInvoiceItems.map((item) => ({
		description: item.description,
		amount: item.amount
	}));
}

export function getBillingSummary(
	sites: SiteConfig[],
	selectedSiteNames: Set<string>,
	subscriptions: Subscriptions,
	billingMonth: string
): BillingSummary {
	const billableSites = sites.filter((site) => !!site.monthlyBilling);
	const allSitesRecurringTotal = billableSites.reduce(
		(total, site) => total + getMonthlyBillingPrice(site, subscriptions),
		0
	);
	const selectedSites = billableSites.filter((site) => selectedSiteNames.has(site.name));
	const selectedSitesRecurringTotal = selectedSites.reduce(
		(total, site) => total + getMonthlyBillingPrice(site, subscriptions),
		0
	);
	const getAdditionalTotal = (billingSites: SiteConfig[]) => billingSites.reduce(
		(total, site) => total + getAdditionalInvoiceItems(site, billingMonth)
			.reduce((itemTotal, item) => itemTotal + item.amount, 0),
		0
	);
	const allSitesAdditionalTotal = getAdditionalTotal(billableSites);
	const selectedSitesAdditionalTotal = getAdditionalTotal(selectedSites);

	return {
		billableSiteCount: billableSites.length,
		selectedSiteCount: selectedSites.length,
		allSitesRecurringTotal: roundCurrency(allSitesRecurringTotal),
		selectedSitesRecurringTotal: roundCurrency(selectedSitesRecurringTotal),
		allSitesAdditionalTotal: roundCurrency(allSitesAdditionalTotal),
		selectedSitesAdditionalTotal: roundCurrency(selectedSitesAdditionalTotal),
		allSitesTotal: roundCurrency(allSitesRecurringTotal + allSitesAdditionalTotal),
		selectedSitesTotal: roundCurrency(selectedSitesRecurringTotal + selectedSitesAdditionalTotal)
	};
}

/**
 * Compiles comprehensive metrics and totals into structured invoice data
 */
export function compileInvoiceData(
	site: SiteConfig,
	billingMonth: string, // YYYY-MM
	subscriptions: Subscriptions,
	paymentInfo: PaymentInfo,
	posts: BlogPostBilling[] = [],
	socialReferrers: SocialReferrerBilling[] = [],
	formCompletions: FormCompletion[] = [],
	enhancements: Record<string, string[]> = {}
): InvoiceData {
	if (!site.monthlyBilling) {
		throw new Error(`Site ${site.name} is not a billable account.`);
	}
	if (!isMonthlyBillingActive(site, billingMonth)) {
		throw new Error(`Site ${site.name} is not billable for ${billingMonth}.`);
	}

	const [year, month] = billingMonth.split('-');
	const invoiceDate = new Date().toISOString().split('T')[0];
	
	// Due Date: net 30
	const due = new Date();
	due.setDate(due.getDate() + 30);
	const dueDate = due.toISOString().split('T')[0];

	const invoiceNumber = `INV-${year}${month}-${site.name.toUpperCase()}`;
	const tierName = site.monthlyBilling.tier;
	const subTier = subscriptions[tierName] || { price: 0, services: [] };
	const basePrice = getMonthlyBillingPrice(site, subscriptions);

	const servicesList = Array.isArray(subTier.services) ? subTier.services : [];
	const additionalItems = getAdditionalInvoiceItems(site, billingMonth);

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

	const totalOwed = roundCurrency(items.reduce((acc, item) => acc + item.amount, 0));
	const ga4PropertyId = typeof site.ga4PropertyId === 'string' && site.ga4PropertyId.trim() && site.ga4PropertyId !== 'GA4_PROPERTY_ID_HERE'
		? site.ga4PropertyId.trim()
		: undefined;

	const enhancementsForMonth = Array.isArray(enhancements[billingMonth]) ? enhancements[billingMonth] : [];

	return {
		invoiceNumber,
		invoiceDate,
		dueDate,
		billingMonth,
		companyName: site.monthlyBilling.companyName,
		address: site.monthlyBilling.address,
		email: site.monthlyBilling.email,
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

export function compileAdHocInvoiceData(
	site: SiteConfig,
	invoice: AdHocInvoiceConfig,
	paymentInfo: PaymentInfo
): InvoiceData {
	if (!site.adHocBilling?.some((item) => item.invoiceNumber === invoice.invoiceNumber)) {
		throw new Error(`Ad hoc invoice ${invoice.invoiceNumber} is not configured for ${site.name}.`);
	}

	return {
		invoiceNumber: invoice.invoiceNumber,
		invoiceDate: invoice.invoiceDate,
		dueDate: invoice.dueDate,
		billingMonth: invoice.invoiceDate.slice(0, 7),
		companyName: site.monthlyBilling?.companyName || site.name,
		address: site.monthlyBilling?.address || '',
		email: site.monthlyBilling?.email || '',
		siteName: site.name,
		siteUrl: site.url,
		ga4PropertyId: undefined,
		showSiteHealth: false,
		showBillingCycle: false,
		tier: 'ad hoc',
		items: invoice.items,
		totalOwed: Math.round(invoice.items.reduce((total, item) => total + item.amount, 0) * 100) / 100,
		paymentInfo,
		posts: [],
		socialReferrers: [],
		note: invoice.note,
	};
}

/**
 * Helper to retrieve a billing note for a given billing month (YYYY-MM).
 * Strict behavior: `billingMonth` must be provided. If `site.monthlyBilling.notes` exists
 * return the matching note string or empty string when missing. Do not fallback.
 */
export function getBillingNote(site: SiteConfig, billingMonth: string): string | string[] | undefined {
	if (!billingMonth) {
		throw new Error('billingMonth is required to retrieve billing note');
	}

	const monthlyBilling = site?.monthlyBilling;
	if (!monthlyBilling) return undefined;

	const notes = monthlyBilling.notes;
	if (notes && typeof notes === 'object') {
		const monthNote = notes[billingMonth] as string | string[] | undefined;
		if (typeof monthNote === 'string' || Array.isArray(monthNote)) {
			return monthNote;
		}
	}

	return undefined;
}
