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
		description: string;
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
