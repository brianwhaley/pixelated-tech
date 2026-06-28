export interface SubscriptionTier {
	price: number;
	services: string[];
}

export interface Subscriptions {
	[tier: string]: SubscriptionTier;
}

export interface PaymentInfo {
	method: string;
	details: string;
	terms: string;
	fromEmail?: string;
}

export interface SiteBillingConfig {
	tier: string;
	priceOverride?: number;
	price?: number; // Support direct "price" key in json
	email: string;
	companyName: string;
	address: string;
	note?: string; // Optional legacy single-note
	// `notes` keyed by billing cycle (YYYY-MM) for historical notes per month
	notes?: Record<string, string>;
}

export interface SiteConfig {
	name: string;
	url: string;
	blogRss?: string;
	billing?: SiteBillingConfig;
	[key: string]: any;
}

export interface SitesJsonData {
	subscriptions: Subscriptions;
	paymentInfo: PaymentInfo;
	sites: SiteConfig[];
}

export interface BlogPostBilling {
	title: string;
	url: string;
	date: string;
	views: number;
	socialLinks: string[];
}

export interface SocialReferrerBilling {
	source: string;
	clicks: number;
}

export interface InvoiceItem {
	description: string;
	amount: number;
}

export interface InvoiceData {
	invoiceNumber: string;
	invoiceDate: string;
	dueDate: string;
	billingMonth: string; // YYYY-MM
	companyName: string;
	address: string;
	email: string;
	siteName: string;
	siteUrl: string;
	tier: string;
	items: InvoiceItem[];
	totalOwed: number;
	paymentInfo: PaymentInfo;
	posts: BlogPostBilling[];
	socialReferrers: SocialReferrerBilling[];
	note?: string; // Optional custom note field passed down from site config
}

export interface GeneratedInvoiceResult {
	siteName: string;
	pdfPath: string; // File URL path for viewing/download
	email: string;
	success: boolean;
	message?: string;
	invoiceData?: InvoiceData;
}
