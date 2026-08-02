import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { encode } from 'html-entities';
import config from '@/app/config/pixelated.config.json';

export { config };

export interface FileDataState {
	data: string | null;
	loading: boolean;
	error: string | null;
}

export interface PixelatedMockState {
	fileData: FileDataState;
	wordpressPosts: any[];
	spotifySeries: any;
	spotifyEpisodes: any[];
}

export const mockState: PixelatedMockState = {
	fileData: { data: 'markdown content', loading: false, error: null },
	wordpressPosts: [{ id: 1, title: 'Test Post' }],
	spotifySeries: { name: 'Test Series' },
	spotifyEpisodes: [{ id: 1, pubDate: '2024-01-01' }],
};

export const resetMockState = () => {
	mockState.fileData = { data: 'markdown content', loading: false, error: null };
	mockState.wordpressPosts = [{ id: 1, title: 'Test Post' }];
	mockState.spotifySeries = { name: 'Test Series' };
	mockState.spotifyEpisodes = [{ id: 1, pubDate: '2024-01-01' }];
	resetCartItems();
	resetFileDataState();
	resetPixelatedConfigOverride();
	resetGoogleReviewsResponse();
	resetContentfulMocks();
};

let fileDataState: FileDataState | null = null;
export const setFileDataState = (state: FileDataState | null) => {
	fileDataState = state;
};
export const resetFileDataState = () => {
	fileDataState = null;
};

let pixelatedConfigOverride: any = undefined;
export const setPixelatedConfigOverride = (override: any | null) => {
	pixelatedConfigOverride = override;
};
export const resetPixelatedConfigOverride = () => {
	pixelatedConfigOverride = undefined;
};

let googleReviewsResponse = {
	reviews: [
		{
			rating: 5,
			text: 'Excellent service',
			author_name: 'John Doe',
			profile_photo_url: 'https://example.com/photo.jpg',
		},
	],
};
export const setGoogleReviewsResponse = (response: any) => {
	googleReviewsResponse = response;
};
export const resetGoogleReviewsResponse = () => {
	googleReviewsResponse = {
		reviews: [
			{
				rating: 5,
				text: 'Excellent service',
				author_name: 'John Doe',
				profile_photo_url: 'https://example.com/photo.jpg',
			},
		],
	};
};

let cartItems: any[] = [];
export const setCartItems = (items: any[]) => {
	cartItems = items;
};
export const resetCartItems = () => {
	cartItems = [];
};

let contentfulEntriesResponse: any = { items: [], includes: { Asset: [] } };
let contentfulEntryResponse: any = null;
let contentfulImagesResponse: any[] = [];

export const setContentfulEntriesResponse = (response: any) => {
	contentfulEntriesResponse = response;
};
export const setContentfulEntryResponse = (response: any) => {
	contentfulEntryResponse = response;
};
export const setContentfulImagesResponse = (response: any[]) => {
	contentfulImagesResponse = response;
};
export const setBuildEventSchema = (fn: (event: any) => any) => {
	(defaultMocks as any).buildEventSchema = fn;
};
export const resetContentfulMocks = () => {
	contentfulEntriesResponse = { items: [], includes: { Asset: [] } };
	contentfulEntryResponse = null;
	contentfulImagesResponse = [];
	(defaultMocks as any).buildEventSchema = (event: any) => ({ title: event.fields.title });
};

const mockComponent = (name: string, testId?: string) => ({ children, title, site, posts, markdowndata, faqsData, className, id, style, ...rest }: any) => {
	const textContent = title ??
		(site && Array.isArray(posts) ? `site:${site} count:${posts.length}` :
			Array.isArray(posts) ? `count:${posts.length}` :
				markdowndata ??
				(faqsData ? `faqs:${Array.isArray(faqsData.mainEntity) ? faqsData.mainEntity.length : 0}` :
					undefined));

	const props: any = { 'data-testid': testId ?? `${name.toLowerCase()}` };
	if (className) props.className = className;
	if (id) props.id = id;
	if (style) props.style = style;
	Object.assign(props, rest);

	return React.createElement(
		'div',
		props,
		textContent ?? children ?? null,
	);
};

const mockServicesList = ({ services, siteInfo, title, intro, id }: any) => {
	const items = Array.isArray(services) && services.length ? services : siteInfo?.services ?? [];
	return React.createElement(
		'div',
		{ 'data-testid': 'services', id },
		title ? React.createElement('h2', null, title) : null,
		intro ? React.createElement('p', null, intro) : null,
		items.map((service: any, index: number) => React.createElement(
			'div',
			{ key: service?.name ?? index, 'data-testid': 'callout' },
			service?.name ?? `service-${index}`,
		)),
	);
};

const mockServiceAreasList = ({ serviceAreas, siteInfo, title, intro, id }: any) => {
	const items = Array.isArray(serviceAreas) && serviceAreas.length ? serviceAreas : siteInfo?.serviceAreas ?? [];
	return React.createElement(
		'div',
		{ 'data-testid': 'service-areas', id },
		title ? React.createElement('h2', null, title) : null,
		intro ? React.createElement('p', null, intro) : null,
		items.map((serviceArea: any, index: number) => React.createElement(
			'div',
			{ key: serviceArea?.name ?? index, 'data-testid': 'service-area' },
			serviceArea?.name ?? `service-area-${index}`,
		)),
	);
};

const defaultMocks: Record<string, any> = {
	__esModule: true,
	usePixelatedConfig: () => pixelatedConfigOverride === undefined ? config : pixelatedConfigOverride,
	useFileData: (filePath: string) => {
		if (fileDataState) {
			return fileDataState;
		}
		if (mockState.fileData !== undefined && mockState.fileData !== null) {
			return mockState.fileData;
		}
		const normalized = filePath.startsWith('/') ? filePath.slice(1) : filePath;
		const resolvedPath = path.resolve(process.cwd(), 'public', normalized);
		if (!fs.existsSync(resolvedPath)) {
			return {
				data: null,
				loading: false,
				error: `File not found: ${filePath}`,
			};
		}
		return {
			data: fs.readFileSync(resolvedPath, 'utf-8'),
			loading: false,
			error: null,
		};
	},
	getCachedWordPressItems: async () => mockState.wordpressPosts,
	getWordPressItems: async () => mockState.wordpressPosts,
	getSpotifySeries: async () => mockState.spotifySeries,
	getSpotifyEpisodes: async () => mockState.spotifyEpisodes,
	mapWordPressToBlogPosting: (post: any) => post,
	mapPodcastSeriesToSchema: (series: any) => series,
	mapPodcastEpisodeToSchema: (episode: any) => episode,
	getGoogleReviewsByPlaceId: async () => googleReviewsResponse,
	getContentfulEntriesByType: async () => contentfulEntriesResponse,
	getContentfulEntryByField: async () => contentfulEntryResponse,
	getContentfulImagesFromEntries: async () => contentfulImagesResponse,
	getContentfulAssetURLs: async () => [],
	buildEventSchema: (event: any) => ({ title: event?.fields?.title }),
	getGravatarProfile: async () => null,
	ToggleLoading: () => null, GoogleFonts: () => null,
	MicroInteractions: () => null,
	preloadAllCSS: () => null,
	preloadImages: () => null,
	SkeletonLoading: () => React.createElement('div', { 'data-testid': 'skeleton-loading' }, null),
	GlobalErrorUI: ({ error }: any) => React.createElement('div', { 'data-testid': 'global-error-ui' }, error?.message ?? 'error'),
	FourOhFour: mockComponent('FourOhFour'),
	PageTitleHeader: mockComponent('PageTitleHeader'),
	PageSection: mockComponent('PageSection'),
	PageSectionHeader: mockComponent('PageSectionHeader'),
	Loading: mockComponent('Loading'),
	BreadcrumbListSchema: () => null,
	WebsiteSchema: () => null,
	LocalBusinessSchema: () => null,
	ServicesSchema: () => null,
	Hero: mockComponent('Hero'),
	SmartImage: mockComponent('SmartImage', 'smart-image'),
	MenuAccordion: mockComponent('MenuAccordion'),
	MenuAccordionButton: mockComponent('MenuAccordionButton'),
	CartButton: mockComponent('CartButton'),
	MenuSimple: mockComponent('MenuSimple', 'menu-simple'),
	GoogleAnalytics: mockComponent('GoogleAnalytics', 'google-analytics'),
	PixelatedFooter: mockComponent('PixelatedFooter', 'pixelated-footer'),
	PageGridItem: mockComponent('PageGridItem'),
	PageFlexItem: mockComponent('PageFlexItem'),
	BusinessFooter: mockComponent('BusinessFooter'),
	Callout: mockComponent('Callout', 'callout'),
	ServicesList: mockServicesList,
	Services: mockServicesList,
	ServiceAreas: mockServiceAreasList,
	ServiceAreaDetail: ({ serviceArea, id }: any) => React.createElement(
		'div',
		{ 'data-testid': 'serviceareadetailpage', id },
		serviceArea?.name ?? 'Service Area Detail',
	),
	ServiceCard: mockComponent('ServiceCard'),
	ServiceDetail: ({ service, title, id }: any) => React.createElement(
		'div',
		{ 'data-testid': 'servicedetailpage', id },
		title ?? service?.name ?? 'Service Detail',
	),
	ShoppingCart: ({ onPaymentCapture, ...props }: any) => {
		if (typeof onPaymentCapture === 'function') {
			void Promise.resolve(onPaymentCapture({ sourceId: 'test-source', checkoutData: { amount: 1 } }));
		}
		return React.createElement('div', { ...props, 'data-testid': 'shopping-cart' }, 'ShoppingCart');
	},
	smartFetch: async () => ({ status: 'ok' }),
	SquareStoreItems: mockComponent('SquareStoreItems'),
	SquareStoreItemDetail: mockComponent('SquareStoreItemDetail'),
	Table: mockComponent('Table'),
	Tiles: mockComponent('Tiles', 'tiles'),
	SquareEventDetail: ({ eventData, ...props }: any) => {
		const isOpen = String(eventData?.fields?.status ?? '').toLowerCase() === 'open';
		return React.createElement(
			'div',
			{ ...props, 'data-testid': 'squareeventdetail', id: 'event-callout-section' },
			isOpen ? React.createElement('button', {
				id: 'add-to-cart-button',
				onClick: () => {
					const fn = (globalThis as any).mockRouterPush;
					if (typeof fn === 'function') fn('/cart');
				},
			}, 'Add to cart') : null,
		);
	},
	SquareEventCallout: ({ ...props }: any) => React.createElement(
		'div',
		{ ...props, 'data-testid': 'squareeventcallout' },
		React.createElement('div', { 'data-testid': 'schemaevent' }),
		React.createElement('div', { 'data-testid': 'callout' }),
	),
	addToShoppingCart: () => null,
	getCart: () => cartItems,
	getCartItemCount: (items: any[]) => Array.isArray(items) ? items.reduce((sum, item) => sum + (Number(item?.itemQuantity) || 0), 0) : 0,
	getCartSubTotal: (items: any[]) => Array.isArray(items) ? items.reduce((sum, item) => sum + ((Number(item?.itemCost) || 0) * (Number(item?.itemQuantity) || 1)), 0) : 0,
	formatAsHundredths: (value: number) => Number.isFinite(value) ? Math.round(value * 100) / 100 : 0,
	contentfulValueToSlug: ({ value }: any) =>
		encode(
			String(value ?? '')
				.trim()
				.toLowerCase()
				.replace(/\s+/g, '-'),
		),
	ContentfulAlert: mockComponent('ContentfulAlert'),
	ContentfulAlerts: mockComponent('ContentfulAlerts'),
	FAQAccordion: mockComponent('FAQ'),
	FAQ: mockComponent('FAQ'),
	SchemaFAQ: mockComponent('SchemaFAQ'),
	SchemaEvent: mockComponent('SchemaEvent'),
	Markdown: mockComponent('Markdown'),
	GoogleReviewsCarousel: mockComponent('GoogleReviewsCarousel'),
	BlogPostList: mockComponent('BlogPostList'),
	SchemaBlogPosting: mockComponent('SchemaBlogPosting'),
	StyleGuideUI: mockComponent('StyleGuideUI'),
	FormEngine: mockComponent('FormEngine'),
	FormButton: mockComponent('FormButton'),
	SquareCheckout: mockComponent('SquareCheckout'),
	SquareFeaturedItems: mockComponent('SquareFeaturedItems'),
	emailJSON: async () => ({}),
	Carousel: mockComponent('Carousel'),
	ReviewSchema: mockComponent('ReviewSchema'),
};

export const createPageComponentMocks = (overrides: Record<string, any> = {}) => {
	return {
		...defaultMocks,
		...overrides,
	};
};
