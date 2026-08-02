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

const mockComponent = (name: string, testId?: string) => ({ children, title, content, site, posts, markdowndata, faqsData, className, id, style }: any) => {
	const textContent = title ??
		content ??
		(site && Array.isArray(posts) ? `site:${site} count:${posts.length}` :
			markdowndata ??
			(faqsData ? `faqs:${Array.isArray(faqsData.mainEntity) ? faqsData.mainEntity.length : 0}` :
				undefined));

	const props: any = { 'data-testid': testId ?? name.toLowerCase()
		.replace(/([a-z])([A-Z])/g, '$1-$2')
		.toLowerCase()
		.replace('pagesection', 'page-section')
		.replace('pagetitleheader', 'page-title-header')
		.replace('pagesectionheader', 'page-section-header')
		.replace('page-sectionheader', 'page-section-header')
		.replace('page-titleheader', 'page-title-header')
		.replace('pagegriditem', 'page-grid-item')
		.replace('pageflexitem', 'page-flex-item')
	};
	if (className) props.className = className;
	if (id) props.id = id;
	if (style) props.style = style;

	return React.createElement(
		'div',
		props,
		textContent ?? children ?? null,
	);
};

const mockServicesList = ({ services, siteInfo, title, intro, id }: any) => {
	const items = Array.isArray(services) && services.length ? services : siteInfo?.services ?? config.siteInfo?.services ?? [];
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
	const items = Array.isArray(serviceAreas) && serviceAreas.length ? serviceAreas : siteInfo?.serviceAreas ?? config.siteInfo?.serviceAreas ?? [];
	return React.createElement(
		'div',
		{ 'data-testid': 'service-areas', id },
		title ? React.createElement('h2', null, title) : null,
		intro ? React.createElement('p', null, intro) : null,
		items.map((area: any, index: number) => React.createElement(
			'div',
			{ key: area?.name ?? index, 'data-testid': 'service-area' },
			area?.name ?? `service-area-${index}`,
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
	getSpotifySeries: async () => mockState.spotifySeries,
	getSpotifyEpisodes: async () => mockState.spotifyEpisodes,
	mapWordPressToBlogPosting: (post: any) => post,
	mapPodcastSeriesToSchema: (series: any) => series,
	mapPodcastEpisodeToSchema: (episode: any) => episode,
	getGoogleReviewsByPlaceId: async () => googleReviewsResponse,
	getContentfulEntriesByType: async () => contentfulEntriesResponse,
	getContentfulEntryByField: async () => contentfulEntryResponse,
	getContentfulImagesFromEntries: async () => contentfulImagesResponse,
	buildEventSchema: (event: any) => ({ title: event.fields.title }),
	getGravatarProfile: async () => null,
	ToggleLoading: () => null, GoogleFonts: () => null,
	MicroInteractions: () => null,
	preloadAllCSS: () => null,
	preloadImages: () => null,
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
	Hero: mockComponent('Hero'),
	SmartImage: mockComponent('SmartImage', 'smart-image'),
	MenuAccordion: mockComponent('MenuAccordion'),
	MenuAccordionButton: mockComponent('MenuAccordionButton', 'menu-accordion-button'),
	MenuSimple: mockComponent('MenuSimple', 'menu-simple'),
	GoogleAnalytics: mockComponent('GoogleAnalytics', 'google-analytics'),
	PixelatedFooter: mockComponent('PixelatedFooter', 'pixelated-footer'),
	PageBg: mockComponent('PageBg', 'page-bg'),
	PageGridItem: mockComponent('PageGridItem'),
	PageFlexItem: mockComponent('PageFlexItem'),
	Callout: mockComponent('Callout', 'callout'),
	ServicesList: mockServicesList,
	Services: mockServicesList,
	ServiceAreasList: mockServiceAreasList,
	ServiceAreas: mockServiceAreasList,
	ServiceCard: mockComponent('ServiceCard'),
	ServiceDetail: ({ service, title, id }: any) => React.createElement(
		'div',
		{ 'data-testid': 'servicedetailpage', id },
		title ?? service?.name ?? 'Service Detail',
	),
	ServiceAreaDetail: ({ serviceArea, id }: any) => React.createElement(
		'div',
		{ 'data-testid': 'serviceareadetailpage', id },
		serviceArea?.name ?? 'Service Area Detail',
	),
	contentfulValueToSlug: ({ value }: any) =>
		encode(
			String(value ?? '')
				.trim()
				.toLowerCase()
				.replace(/\s+/g, '-'),
		),
	buildServiceUrl: (service: any, prefix?: string) => {
		const slug = encode(
			String(service?.name ?? '')
				.trim()
				.toLowerCase()
				.replace(/\s+/g, '-'),
		);
		return prefix ? `${prefix}/${slug}` : `/services/${slug}`;
	},
	FAQ: mockComponent('FAQ', 'faq'),
	SchemaFAQ: mockComponent('SchemaFAQ', 'schema-faq'),
	Markdown: mockComponent('Markdown', 'markdown'),
	BlogPostList: mockComponent('BlogPostList', 'blog-post-list'),
	SchemaBlogPosting: mockComponent('SchemaBlogPosting', 'schema-blog-posting'),
	StyleGuideUI: mockComponent('StyleGuideUI', 'styleguide-ui'),
	Calendly: mockComponent('Calendly', 'calendly'),
	FormEngine: mockComponent('FormEngine', 'form-engine'),
	Carousel: mockComponent('Carousel', 'carousel'),
	ReviewSchema: mockComponent('ReviewSchema'),
	GravatarCard: mockComponent('GravatarCard', 'gravatar-card'),
	PodcastEpisodeList: mockComponent('PodcastEpisodeList', 'podcast-episode-list'),
	SchemaPodcastSeries: mockComponent('SchemaPodcastSeries', 'schema-podcast-series'),
	SchemaPodcastEpisode: mockComponent('SchemaPodcastEpisode', 'schema-podcast-episode'),
	Tiles: mockComponent('Tiles', 'tiles'),
};

export const createPageComponentMocks = (overrides: Record<string, any> = {}) => {
	return {
		...defaultMocks,
		...overrides,
	};
};
