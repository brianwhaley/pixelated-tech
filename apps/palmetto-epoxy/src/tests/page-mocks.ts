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

const mockComponent = (name: string, testId?: string) => ({ children, title, site, posts, markdowndata, faqsData, className, id, style }: any) => {
	const textContent = title ??
		(Array.isArray(posts) ? (site ? `site:${site} count:${posts.length}` : `count:${posts.length}`) :
			markdowndata ??
			(faqsData ? `faqs:${Array.isArray(faqsData.mainEntity) ? faqsData.mainEntity.length : 0}` :
				undefined));

	const props: any = {};
	if (testId) props['data-testid'] = testId;
	if (className) props.className = className;
	if (id) props.id = id;
	if (style) props.style = style;

	return React.createElement(
		'div',
		props,
		textContent ?? children ?? null,
	);
};

const contentfulValueToSlug = ({ value }: any) =>
	encode(
		String(value ?? '')
			.trim()
			.toLowerCase()
			.replace(/\s+/g, '-'),
	);

const defaultMocks: Record<string, any> = {
	__esModule: true,
	usePixelatedConfig: () => pixelatedConfigOverride === undefined ? config : pixelatedConfigOverride,
	useFileData: (filePath: string) => {
		if (fileDataState) {
			return fileDataState;
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
	getSpotifySeries: async () => mockState.spotifySeries,
	getSpotifyEpisodes: async () => mockState.spotifyEpisodes,
	getContentfulEntriesByType: async () => contentfulEntriesResponse,
	getContentfulEntryByField: async ({ cards, searchField, searchVal }: any) => {
		if (cards?.items?.length) {
			return cards.items.find((card: any) => card.fields?.[searchField] === searchVal) ?? cards.items[0];
		}
		return null;
	},
	getContentfulImagesFromEntries: async ({ images, _assets }: any) => {
		if (contentfulImagesResponse && contentfulImagesResponse.length) {
			return contentfulImagesResponse;
		}
		return Array.isArray(images) ? images.map((image: any) => ({ image: image?.url ?? '', imageAlt: image?.alt ?? '' })) : [];
	},
	mapWordPressToBlogPosting: (post: any) => post,
	mapPodcastSeriesToSchema: (series: any) => series,
	mapPodcastEpisodeToSchema: (episode: any) => episode,
	getGoogleReviewsByPlaceId: async () => googleReviewsResponse,
	getContentfulEntriesByType: async () => contentfulEntriesResponse,
	getContentfulEntryByField: async () => contentfulEntryResponse,
	getContentfulImagesFromEntries: async () => contentfulImagesResponse,
	buildEventSchema: (event: any) => buildEventSchemaImpl(event),
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
	Loading: () => React.createElement('div', { id: 'loadingSpinner', 'data-testid': 'loading-spinner' }, 'Loading'),
	BreadcrumbListSchema: () => null,
	WebsiteSchema: () => null,
	LocalBusinessSchema: () => null,
	ServicesSchema: () => null,
	Hero: mockComponent('Hero'),
	SmartImage: (props: any) => React.createElement('span', { 'data-testid': 'smart-image', ...props }, props.children ?? null),
	MenuAccordion: mockComponent('MenuAccordion'),
	MenuAccordionButton: mockComponent('MenuAccordionButton'),
	MenuSimple: mockComponent('MenuSimple', 'menu-simple'),
	GoogleAnalytics: mockComponent('GoogleAnalytics', 'google-analytics'),
	PixelatedFooter: mockComponent('PixelatedFooter', 'pixelated-footer'),
	ContentfulReviewsCarousel: mockComponent('ContentfulReviewsCarousel', 'contentful-reviews-carousel'),
	Carousel: mockComponent('Carousel', 'carousel'),
	Tiles: mockComponent('Tiles', 'tiles'),
	PageGridItem: mockComponent('PageGridItem', 'page-grid-item'),
	PageFlexItem: mockComponent('PageFlexItem', 'page-flex-item'),
	Callout: mockComponent('Callout', 'callout'),
	contentfulValueToSlug,
	capitalizeWords: (value: string) => String(value ?? '')
		.trim()
		.replace(/[-_]+/g, ' ')
		.replace(/\s+/g, ' ')
		.split(' ')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' '),
	FAQAccordion: mockComponent('FAQ'),
	FAQ: mockComponent('FAQ'),
	SchemaFAQ: mockComponent('SchemaFAQ'),
	Markdown: mockComponent('Markdown', 'markdown'),
	BlogPostList: mockComponent('BlogPostList', 'blog-post-list'),
	SchemaBlogPosting: mockComponent('SchemaBlogPosting'),
	FormEngine: (_props: any) => React.createElement(
		'form',
		{ id: 'submitReviewForm', 'data-testid': 'form-engine' },
		React.createElement('input', { id: 'installdate', type: 'date' }),
		React.createElement('button', { type: 'submit' }, 'Submit'),
	),
	ReviewSchema: mockComponent('ReviewSchema'),
	ProjectsClient: mockComponent('ProjectsClient', 'projects-client'),
	GravatarCard: mockComponent('GravatarCard', 'gravatar-card'),
	Calendly: mockComponent('Calendly'),
};

export const createPageComponentMocks = (overrides: Record<string, any> = {}) => {
	return {
		...defaultMocks,
		...overrides,
	};
};
