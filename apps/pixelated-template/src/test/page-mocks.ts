import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import config from '@/app/config/pixelated.config.json';

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

const mockComponent = (name: string, testId?: string) => ({ children, title, content, site, posts, markdowndata, faqsData, className, id, style }: any) => {
	const textContent = title ??
		content ??
		(site && Array.isArray(posts) ? `site:${site} count:${posts.length}` :
			markdowndata ??
			(faqsData ? `faqs:${Array.isArray(faqsData.mainEntity) ? faqsData.mainEntity.length : 0}` :
				undefined));

	const props: any = { 'data-testid': testId ?? `mock-${name.toLowerCase()}` };
	if (className) props.className = className;
	if (id) props.id = id;
	if (style) props.style = style;

	return React.createElement(
		'div',
		props,
		textContent ?? children ?? null,
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
		const data = readPublicData(filePath);
		return {
			data,
			loading: false,
			error: data === null ? `File not found: ${filePath}` : null,
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
	buildEventSchema: (event: any) => buildEventSchemaImpl(event),
	getGravatarProfile: async () => null,
	ToggleLoading: () => null,
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
	PageGridItem: mockComponent('PageGridItem'),
	PageFlexItem: mockComponent('PageFlexItem'),
	Callout: mockComponent('Callout', 'callout'),
	FAQAccordion: mockComponent('FAQAccordion', 'faq-accordion'),
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
