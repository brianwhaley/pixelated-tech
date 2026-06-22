import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { encode } from 'html-entities';

export interface FileDataState {
	data: string | null;
	loading: boolean;
	error: string | null;
}

export interface PixelatedMockState {
	fileData: FileDataState;
	wordpressPosts: any[];
	wordpressCategories: string[] | null;
	spotifySeries: any;
	spotifyEpisodes: any[];
}

export const mockState: PixelatedMockState = {
	fileData: { data: 'markdown content', loading: false, error: null },
	wordpressPosts: [{ id: 1, title: 'Test Post' }],
	wordpressCategories: ['General'],
	spotifySeries: { name: 'Test Series' },
	spotifyEpisodes: [{ id: 1, pubDate: '2024-01-01' }],
};

export const resetMockState = () => {
	mockState.fileData = { data: 'markdown content', loading: false, error: null };
	mockState.wordpressPosts = [{ id: 1, title: 'Test Post' }];
	mockState.wordpressCategories = ['General'];
	mockState.spotifySeries = { name: 'Test Series' };
	mockState.spotifyEpisodes = [{ id: 1, pubDate: '2024-01-01' }];
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

export const setSharedTestConfig = (config: any) => {
	sharedConfig = config;
};

export const resetSharedTestConfig = () => {
	sharedConfig = undefined;
};

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

let contentfulEntriesResponse: any = { items: [], includes: { Asset: [] } };
let contentfulEntryResponse: any = null;
let contentfulImagesResponse: any[] = [];
let buildEventSchemaImpl = (event: any) => ({ title: event.fields.title });

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
	buildEventSchemaImpl = fn;
};
export const resetContentfulMocks = () => {
	contentfulEntriesResponse = { items: [], includes: { Asset: [] } };
	contentfulEntryResponse = null;
	contentfulImagesResponse = [];
	buildEventSchemaImpl = (event: any) => ({ title: event.fields.title });
};

const readPublicData = (filePath: string): string | null => {
	const normalized = filePath.startsWith('/') ? filePath.slice(1) : filePath;
	const resolvedPath = path.resolve(process.cwd(), 'public', normalized);
	if (!fs.existsSync(resolvedPath)) {
		return null;
	}
	return fs.readFileSync(resolvedPath, 'utf-8');
};

const toKebabCase = (value: string) => value
	.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
	.replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
	.toLowerCase();

const mockComponent = (name: string, testId?: string) => ({ children, title, content, site, posts, markdowndata, faqsData, className, id, style, onSubmitHandler, ...restProps }: any) => {
	const textContent = title ??
		content ??
		(site && Array.isArray(posts) ? `site:${site} count:${posts.length}` :
			Array.isArray(posts) ? `count:${posts.length}` :
				markdowndata ??
			(faqsData ? `faqs:${Array.isArray(faqsData.mainEntity) ? faqsData.mainEntity.length : 0}` :
				undefined));

	const componentProps: any = { 'data-testid': testId ?? toKebabCase(name) };
	if (className) componentProps.className = className;
	if (id) componentProps.id = id;
	if (style) componentProps.style = style;
	if (onSubmitHandler) componentProps.onSubmit = onSubmitHandler;

	return React.createElement(
		'div',
		{ ...componentProps, ...restProps },
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

const mockServiceDetail = ({ service, title, id }: any) => {
	return React.createElement(
		'div',
		{ 'data-testid': 'servicedetailpage', id },
		title ?? service?.name ?? 'Service Detail',
	);
};

const contentfulValueToSlug = ({ value }: any) =>
	encode(
		String(value ?? '')
			.trim()
			.toLowerCase()
			.replace(/\s+/g, '-'),
	);

export function createPageComponentMocks(baseConfig: any = undefined, overrides: Record<string, any> = {}) {
	const usePixelatedConfig = () => pixelatedConfigOverride === undefined ? baseConfig : pixelatedConfigOverride;

	const defaultMocks: Record<string, any> = {
		__esModule: true,
		usePixelatedConfig,
		useFileData: (filePath: string) => {
			if (fileDataState) {
				return fileDataState;
			}
			if (mockState.fileData !== undefined && mockState.fileData !== null) {
				return mockState.fileData;
			}
			const data = readPublicData(filePath);
			return {
				data,
				loading: false,
				error: data === null ? `File not found: ${filePath}` : null,
			};
		},
		getCachedWordPressItems: async () => mockState.wordpressPosts,
		getWordPressItems: async () => mockState.wordpressPosts,
		getWordPressCategories: async () => mockState.wordpressCategories,
		getSpotifySeries: async () => mockState.spotifySeries,
		getSpotifyEpisodes: async () => mockState.spotifyEpisodes,
		mapWordPressToBlogPosting: (post: any) => post,
		mapPodcastSeriesToSchema: (series: any) => series,
		mapPodcastEpisodeToSchema: (episode: any) => episode,
		getGoogleReviewsByPlaceId: async () => googleReviewsResponse,
		getContentfulEntriesByType: async () => contentfulEntriesResponse,
		getContentfulEntryByField: async () => contentfulEntryResponse,
		getContentfulImagesFromEntries: async () => contentfulImagesResponse,
		buildEventSchema: (event: any) => buildEventSchemaImpl(event),
		getGravatarProfile: async () => null,
		handleModalOpen: () => null,
		GetFlickrData: async () => [],
		GenerateFlickrCards: () => [],
		FlickrWrapper: async () => [],
		ToggleLoading: () => null,
		GoogleFonts: () => null,
		MicroInteractions: () => null,
		preloadAllCSS: () => null,
		preloadImages: () => null,
		Loading: ({ children, ...props }: any) => React.createElement('div', { 'data-testid': 'loading', ...props }, children ?? 'Loading'),
		SkeletonLoading: () => React.createElement('div', { 'data-testid': 'skeleton-loading' }, null),
		GlobalErrorUI: ({ error, reset }: any) => React.createElement('div', { 'data-testid': 'global-error-ui' }, [error?.message, typeof reset]),
		FourOhFour: mockComponent('FourOhFour', 'four-oh-four'),
		PageTitleHeader: mockComponent('PageTitleHeader', 'page-title-header'),
		PageSection: mockComponent('PageSection'),
		PageSectionHeader: mockComponent('PageSectionHeader'),
		BreadcrumbListSchema: () => null,
		WebsiteSchema: () => null,
		LocalBusinessSchema: () => null,
		ServicesSchema: () => null,
		ServicesList: mockServicesList,
		Services: mockServicesList,
		ServiceAreas: mockComponent('ServiceAreas', 'service-areas'),
		ServiceAreaDetail: mockComponent('ServiceAreaDetail', 'serviceareadetailpage'),
		ServiceCard: mockComponent('ServiceCard'),
		ServiceDetail: mockServiceDetail,
		contentfulValueToSlug,
		capitalizeWords: (value: string) => String(value ?? '')
			.trim()
			.replace(/[-_]+/g, ' ')
			.replace(/\s+/g, ' ')
			.split(' ')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(' '),
		Hero: mockComponent('Hero', 'hero'),
		SmartImage: mockComponent('SmartImage', 'smart-image'),
		MenuAccordion: mockComponent('MenuAccordion'),
		MenuAccordionButton: mockComponent('MenuAccordionButton', 'menu-accordion-button'),
		MenuSimple: mockComponent('MenuSimple', 'menu-simple'),
		GoogleAnalytics: mockComponent('GoogleAnalytics', 'google-analytics'),
		GoogleSearch: mockComponent('GoogleSearch', 'google-search'),
		PixelatedFooter: mockComponent('PixelatedFooter', 'pixelated-footer'),
		PageGridItem: mockComponent('PageGridItem'),
		PageFlexItem: mockComponent('PageFlexItem'),
		Callout: mockComponent('Callout', 'callout'),
		FAQ: mockComponent('FAQ', 'faq'),
		FAQAccordion: mockComponent('FAQAccordion', 'faq-accordion'),
		SchemaFAQ: mockComponent('SchemaFAQ', 'schema-faq'),
		Markdown: mockComponent('Markdown', 'markdown'),
		BlogPostList: mockComponent('BlogPostList', 'blog-post-list'),
		StyleGuideUI: mockComponent('StyleGuideUI', 'styleguide-ui'),
		Calendly: mockComponent('Calendly', 'calendly'),
		FormEngine: ({ onSubmitHandler, formData, ...props }: any) => React.createElement('form', {
			...props,
			id: props.id ?? formData?.properties?.id,
			name: props.name ?? formData?.properties?.name,
			'data-testid': 'form-engine',
			onSubmit: onSubmitHandler,
		}, [
			React.createElement('div', { key: 'form-data' }, JSON.stringify(formData)),
			React.createElement('button', { key: 'submit', type: 'submit' }, 'Submit'),
		]),
		Modal: ({ modalContent, modalID, ...props }: any) => React.createElement('div', {
			id: `myModal${modalID ?? ''}`,
			className: 'modal',
			role: 'presentation',
			'aria-label': 'Modal overlay',
			...props,
		}, React.createElement('div', { className: 'modal-content', role: 'dialog', 'aria-modal': 'true' }, modalContent)),
		Table: ({ data, id, ...props }: any) => React.createElement('table', {
			id,
			'data-testid': 'table',
			...props,
		}, [
			React.createElement('thead', { key: 'thead' }, null),
			React.createElement('tbody', { key: 'tbody' }, JSON.stringify(data)),
		]),
		HubspotTrackingCode: () => React.createElement('div', null, null),
		FormButton: ({ onClick, text, id, ...props }: any) => React.createElement('button', { id, 'data-testid': 'formbutton', onClick, ...props }, text),
		BusinessFooter: mockComponent('BusinessFooter', 'business-footer'),
		ProjectsClient: ({ projects }: any) => React.createElement('div', { 'data-testid': 'projects-client' }, String(Array.isArray(projects) ? projects.length : 0)),
		Carousel: mockComponent('Carousel', 'carousel'),
		ReviewSchema: mockComponent('ReviewSchema'),
		GoogleReviewsCarousel: mockComponent('GoogleReviewsCarousel', 'google-reviews-carousel'),
		GravatarCard: mockComponent('GravatarCard', 'gravatar-card'),
		PodcastEpisodeList: mockComponent('PodcastEpisodeList', 'podcast-episode-list'),
		SchemaPodcastSeries: mockComponent('SchemaPodcastSeries', 'schema-podcast-series'),
		SchemaPodcastEpisode: mockComponent('SchemaPodcastEpisode', 'schema-podcast-episode'),
		Tiles: mockComponent('Tiles', 'tiles'),
		ContentfulReviewsCarousel: mockComponent('ContentfulReviewsCarousel', 'contentful-reviews-carousel'),
		ShoppingCart: mockComponent('ShoppingCart', 'shopping-cart'),
	};

	return new Proxy({
		...defaultMocks,
		...overrides,
	}, {
		get(target, key) {
			if (typeof key === 'string' && key in target) {
				return (target as any)[key];
			}
			if (typeof key === 'string') {
				return mockComponent(key);
			}
			return undefined;
		},
		has(target, key) {
			if (typeof key === 'string') {
				return true;
			}
			return Reflect.has(target, key);
		},
		ownKeys(target) {
			return Reflect.ownKeys(target);
		},
		getOwnPropertyDescriptor(target, key) {
			if (typeof key === 'string') {
				return {
					configurable: true,
					enumerable: true,
					value: this.get(target, key),
					writable: true,
				};
			}
			return Reflect.getOwnPropertyDescriptor(target, key);
		},
	});
}

export function createAppPageComponentMocks(config: any, overrides: Record<string, any> = {}) {
	return createPageComponentMocks(config, overrides);
}

export function createAppTestHelpers(config: any) {
	return {
		config,
		mockState,
		resetMockState,
		setFileDataState,
		resetFileDataState,
		setPixelatedConfigOverride,
		resetPixelatedConfigOverride,
		setGoogleReviewsResponse,
		resetGoogleReviewsResponse,
		setContentfulEntriesResponse,
		setContentfulEntryResponse,
		setContentfulImagesResponse,
		setBuildEventSchema,
		resetContentfulMocks,
		createPageComponentMocks: (overrides: Record<string, any> = {}) => createPageComponentMocks(config, overrides),
	};
}
