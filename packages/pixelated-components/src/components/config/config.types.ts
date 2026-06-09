// Types for Pixelated integration configuration

export type DisplayMode = 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';

export interface OpeningHoursEntry {
	day: string;
	open?: string;
	close?: string;
	closed?: boolean;
	hours?: string;
}

export interface Route {
	name?: string | null;
	path: string;
	title?: string | null;
	description?: string | null;
	keywords?: string[] | null;
	hidden?: boolean;
	routes?: Route[] | null;
	[key: string]: any;
}

export type RouteType = Route;

export interface VisualDesignVariable {
	value: string;
	type: string;
	group: string;
	label: string;
}

export interface VisualDesign {
	'primary-color': VisualDesignVariable;
	'secondary-color': VisualDesignVariable;
	'accent1-color': VisualDesignVariable;
	'accent2-color': VisualDesignVariable;
	'bg-color': VisualDesignVariable;
	'text-color': VisualDesignVariable;
	'header-font': VisualDesignVariable;
	'body-font': VisualDesignVariable;
	'font-size1-min': VisualDesignVariable;
	'font-size1-max': VisualDesignVariable;
	'font-size2-min': VisualDesignVariable;
	'font-size2-max': VisualDesignVariable;
	'font-size3-min': VisualDesignVariable;
	'font-size3-max': VisualDesignVariable;
	'font-size4-min': VisualDesignVariable;
	'font-size4-max': VisualDesignVariable;
	'font-size5-min': VisualDesignVariable;
	'font-size5-max': VisualDesignVariable;
	'font-size6-min': VisualDesignVariable;
	'font-size6-max': VisualDesignVariable;
	'font-min-screen': VisualDesignVariable;
	'font-max-screen': VisualDesignVariable;
	[key: string]: VisualDesignVariable;
}

export type VisualDesignType = VisualDesign;

export interface SiteInfo {
	name: string;
	description: string;
	url: string;
	servicesPathPrefix?: string | null;
	email?: string | null;
	image?: string | null;
	image_height?: string | number | null;
	image_width?: string | number | null;
	favicon?: string | null;
	telephone?: string | null;
	address?: {
		streetAddress?: string | null;
		addressLocality?: string | null;
		addressRegion?: string | null;
		postalCode?: string | null;
		addressCountry?: string | null;
	} | null;
	addressAdditionalInfo?: string | null;
	openingHours?: string | string[] | OpeningHoursEntry[] | null;
	openingHoursAdditionalInfo?: string | null;
	priceRange?: string | null;
	sameAs?: string[] | null;
	brand?: {
		"@type"?: string;
		name?: string | null;
		[key: string]: any;
	} | null;
	audience?: string | null;
	offers?: any | null;
	availability?: string | null;
	availableChannel?: {
		"@type"?: string;
		serviceUrl?: string;
		availableLanguage?: string[];
		servicePhone?: string | null;
		[key: string]: any;
	} | null;
	termsOfService?: string | null;
	keywords?: string | null;
	publisherType?: string | null;
	copyrightYear?: number | null;
	potentialAction?: {
		"@type"?: string;
		target?: string;
		"query-input"?: string;
		queryInput?: string;
	} | null;
	// PWA Manifest properties
	author?: string | null;
	theme_color?: string | null;
	background_color?: string | null;
	default_locale?: string | null;
	display?: DisplayMode | null;
	favicon_sizes?: string | null;
	favicon_type?: string | null;
	services?: Array<{
		name: string;
		description: string | string[];
		short_description?: string | null;
		provider?: string | null;
		category?: string | null;
		serviceType?: string | null;
		serviceOutput?: string | null;
		offers?: any | null;
		audience?: string | null;
		image?: string | null;
		termsOfService?: string | null;
		[key: string]: any;
	}> | null;
	serviceAreas?: Array<{
		name: string;
		description: string | string[];
		short_description?: string | null;
		keywords?: string[] | null;
		highlights?: string[] | null;
		relatedServices?: string[] | null;
		image?: string | null;
		[key: string]: any;
	}> | null;
}

export type SiteInfoType = SiteInfo;

export interface SiteConfigType {
	siteInfo: SiteInfoType;
	routes: RouteType[];
	visualdesign: VisualDesignType;
}

export interface AWSConfig {
	/** Programmatic credentials for AWS (if not using instance/IAM role). Prefer using instance roles */
	access_key_id?: string;
	secret_access_key?: string;
	session_token?: string;
	region?: string;
}

export interface CalendlyConfig {
	url: string;
}

export interface CloudinaryConfig {
	product_env: string;
	baseUrl?: string; // optional custom CDN base, e.g. https://res.cloudinary.com
	secure?: boolean;
	transforms?: string; // e.g. "f_auto,q_auto"
	api_key?: string;
	api_secret?: string;
}

export interface ContentfulConfig {
	proxyURL?: string;
	base_url?: string;
	space_id: string;
	environment?: string;
	delivery_access_token?: string;
	management_access_token?: string;
	preview_access_token?: string;
	sitemapContentType?: string;
	sitemapField?: string;
	sitemapRoutePrefix?: string;
	sitemapRouteTemplate?: string;
}

export interface EbayConfig {
	proxyURL?: string,
	appId: string;
	appDevId?: string;
	appCertId: string;
	sbxAppId: string;
	sbxAppDevId?: string;
	sbxAppCertId: string;
	globalId: string;
	environment?: string;
	tokenScope?: string;
	baseTokenURL?: string,
	baseSearchURL?: string,
	baseAnalyticsURL?: string,
	qsSearchURL?: string,
	baseItemURL?: string,
	qsItemURL?: string,
	itemCategory?: string,
	cacheTTL?: number;
}

export interface FlickrConfig {
	baseURL: string; // e.g. 'https://api.flickr.com/services/rest/?'
	proxyURL?: string; // Optional proxy URL for Flickr API
	urlProps: {
		method?: string; // 'flickr.photos.search',
		api_key: string;
		user_id: string;
		tags?: string; // e.g. 'pixelatedviewsgallery' or photoset_id
		photoset_id?: string; // e.g. '72177720326903710', for photo albums, or use tags for search
		extras: string; // 'date_taken,description,owner_name',
		sort: string; //'date-taken-desc',
		per_page: number; // 500,
		format: string; // 'json',
		photoSize: string; // 'Medium',
		callback?: string; // function name for JSONP
		nojsoncallback?: string; // 'true' if no callback function, else omit or set to 'false'
	}
}

export interface GitHubConfig {
	/** Personal Access Token or App token used to call GitHub REST API (use a fine-grained token with readonly repo access) */
	token?: string;
	/** Optional custom API base URL (enterprise installations). Defaults to https://api.github.com */
	apiBaseUrl?: string;
	/** Optional default organization/owner to use when a repo name is specified without owner */
	defaultOwner?: string;
}

export interface GlobalConfig {
	proxyUrl?: string; // e.g. 'https://proxy.pixelated.tech/prod/proxy?url='
	pagesDir?: string; // override pages directory used by page builder
}

export interface GoogleConfig {
	client_id: string;
	client_secret: string;
	api_key: string;
	refresh_token: string;
}

export interface GoogleAnalyticsConfig {
	id: string; // e.g. G-XXXXXXX
	adId?: string; // e.g. AW-XXXXXXXXX
}

export interface GoogleGeminiConfig {
	api_key: string;
}

export interface GoogleMapsConfig {
	apiKey: string;
}

export interface GooglePlacesConfig {
	apiKey?: string;
	language?: string;
	countryRestrictions?: string[];
	debounceDelay?: number;
	cacheTTL?: number;
	placeId: string; 
}

export interface GooglePSIConfig {
	api_key: string;
}

export interface GoogleSearchConfig {
	id: string;
}

export interface GoogleSearchConsoleConfig {
	id: string;
}

export interface HubspotConfig {
	region?: string; // HubSpot region, e.g. 'na1', 'eu1', 'ap1'
	portalId?: string; // HubSpot portal/account id
	formId?: string; // default contact form id to embed
	trackingCode?: string; // optional tracking code snippet or id
	endpoint?: string; // optional API endpoint for server use
}

export interface InstagramConfig {
	accessToken?: string;
	userId?: string;
}

export interface NextAuthConfig {
	secret: string;
	/** Optional explicit URLs for different environments. Use `local_url`, `dev_url`, and/or `prod_url`. */
	local_url?: string; // local developer machine
	dev_url?: string;   // preview/staging environments
	prod_url?: string;  // production
}

export interface PaypalConfig {
	sandboxPayPalApiKey: string;
	sandboxPayPalSecret: string;
	sandboxPayPalApiBaseUrl?: string;
	sandboxPayPalEmails?: string[];
	payPalApiKey: string;
	payPalSecret: string;
	prodPayPalApiBaseUrl?: string;
}

export interface PuppeteerConfig {
	executable_path?: string;
	cache_dir?: string;
}

export interface ShoppingCartConfig {
	/** Payment provider override; choose 'paypal' or 'square' */
	provider?: 'paypal' | 'square';
	/** Email address for order notifications */
	orderTo: string;
	/** Sender email address for transactional emails */
	orderFrom: string;
	/** Subject line for order confirmation emails */
	orderSubject: string;
	/** Name of the form used to collect order details, for inclusion in email */
	orderFormName: string; 
	/** Domain for the order form, for inclusion in email */
	orderDomain: string; 
	/** Store/company name displayed in communications */
	storeName: string;
	/** Currency code (e.g., 'USD', 'EUR') */
	currency?: string;
	/** Tax rate as a decimal (e.g., 0.07 for 7%) */
	taxRate?: number;
	/** Handling fee calculation mode */
	handlingFeeType?: 'fixed' | 'percentage';
	/** Handling fee amount or percentage rate, expressed as a decimal */
	handlingFeeAmount?: number;
	/** Currency code used for handling fee configuration */
	handlingFeeCurrency?: string;
}

export interface SquareConfig {
	environment?: 'sandbox' | 'production';

	squareApplicationId: string;
	squareAccessToken: string;
	squareAppSecret: string;
	squareLocationId: string;
	squareScriptUrl?: string;
	squarePaymentsUrl?: string;
	squareItemCategoryId?: string;
	squareFeaturedCategoryId?: string;

	sandboxSquareApplicationId: string;
	sandboxSquareAccessToken: string;
	sandboxSquareAppSecret: string;
	sandboxSquareLocationId: string;
	sandboxSquareScriptUrl?: string;
	sandboxSquarePaymentsUrl?: string;
	sandboxSquareEmails?: string[];
}

export interface USPSConfig {
	/** USPS API consumer key */
	consumerKey?: string;
	/** USPS API consumer secret (OAuth2 client secret) */
	consumerSecret?: string;
	/** Optional production API base URL override */
	baseURL?: string;
	/** Optional sandbox/test environment API base URL override */
	sandboxBaseURL?: string;
	/** Optional environment override for USPS shipping integration */
	environment?: 'production' | 'sandbox';
	/** Optional proxy URL to avoid CORS restrictions */
	proxyUrl?: string;
}

export interface WordpressConfig {
	baseURL: string; // REST API base URL, e.g. 'https://public-api.wordpress.com/rest/v1/sites/'
	site: string; // WordPress site identifier (e.g., 'pixelatedviews.wordpress.com')
}

/**
 * Consolidated integrations configuration.
 * All third-party services and APIs should be grouped here.
 */
export interface IntegrationsConfig {
	global?: GlobalConfig;
	aws?: AWSConfig;
	calendly?: CalendlyConfig;
	cloudinary?: CloudinaryConfig;
	contentful?: ContentfulConfig;
	ebay?: EbayConfig;
	flickr?: FlickrConfig;
	github?: GitHubConfig;
	google?: GoogleConfig;
	googleAnalytics?: GoogleAnalyticsConfig;
	googleGemini?: GoogleGeminiConfig;
	googleMaps?: GoogleMapsConfig;
	googlePlaces?: GooglePlacesConfig;
	googlePSI?: GooglePSIConfig;
	googleSearch?: GoogleSearchConfig;
	googleSearchConsole?: GoogleSearchConsoleConfig;
	hubspot?: HubspotConfig;
	instagram?: InstagramConfig;
	paypal?: PaypalConfig;
	puppeteer?: PuppeteerConfig;
	shoppingcart?: ShoppingCartConfig;
	square?: SquareConfig;
	usps?: USPSConfig;
	wordpress?: WordpressConfig;
}

/**
 * Metadata defining which configuration keys are secrets and must be stripped
 * before being sent to the client (browser).
 */
export const SECRET_CONFIG_KEYS = {
	// Keys found at the root of the configuration object
	global: [
		'PIXELATED_CONFIG_KEY'
	],
	// Keys found within specific service configuration blocks
	services: {
		aws: [
			'access_key_id',
			'secret_access_key',
			'session_token'
		],
		cloudinary: [
			'api_key', 
			'api_secret'
		],
		contentful: [
			'management_access_token', 
			'preview_access_token'
		],
		ebay: [
			'sbxAppId'
		],
		github: [
			'token'
		],
		google: [
			'api_key',
			'client_id',
			'client_secret',
			'refresh_token'
		],
		googlePSI: [
			'api_key'
		],
		googleGemini: [
			'api_key'
		],
		instagram: [
			'accessToken'
		],
		paypal: [
			'sandboxPayPalSecret',
			'payPalSecret'
		],
		square: [
			'accessToken'
		],
		usps: [
			'consumerSecret'
		]
	}
};

export interface PixelatedConfig {
	// New Unified Structure
	siteInfo?: SiteInfo;
	routes?: Route[];
	visualdesign?: VisualDesign;
	integrations?: IntegrationsConfig;
	deployMarker?: string;
}
