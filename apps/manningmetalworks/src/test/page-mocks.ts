import React from 'react';

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
};

const mockComponent = (name: string) => ({ children, title, site, posts, markdowndata, faqsData, className, id, style }: any) => {
	const textContent = title ??
		(site && Array.isArray(posts) ? `site:${site} count:${posts.length}` :
			markdowndata ??
		(faqsData ? `faqs:${Array.isArray(faqsData.mainEntity) ? faqsData.mainEntity.length : 0}` :
			undefined));

	const props: any = { 'data-testid': `mock-${name.toLowerCase()}` };
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
	usePixelatedConfig: () => ({
		googlePlaces: { placeId: '', apiKey: '' },
		googleMaps: { apiKey: '' },
		global: { proxyUrl: '' },
	}),
	useFileData: () => mockState.fileData,
	getCachedWordPressItems: async () => mockState.wordpressPosts,
	getSpotifySeries: async () => mockState.spotifySeries,
	getSpotifyEpisodes: async () => mockState.spotifyEpisodes,
	mapWordPressToBlogPosting: (post: any) => post,
	mapPodcastSeriesToSchema: (series: any) => series,
	mapPodcastEpisodeToSchema: (episode: any) => episode,
	ToggleLoading: () => null,
	MicroInteractions: () => null,
	preloadAllCSS: () => null,
	preloadImages: () => null,
	SkeletonLoading: () => React.createElement('div', { 'data-testid': 'skeleton-loading' }, null),
	GlobalErrorUI: ({ error }: any) => React.createElement('div', { 'data-testid': 'global-error-ui' }, error?.message ?? 'error'),
	FourOhFour: mockComponent('FourOhFour'),
	PageTitleHeader: mockComponent('PageTitleHeader'),
	PageSection: mockComponent('PageSection'),
	PageSectionHeader: mockComponent('PageSectionHeader'),
	BreadcrumbListSchema: () => null,
	WebsiteSchema: () => null,
	LocalBusinessSchema: () => null,
	ServicesSchema: () => null,
	Hero: mockComponent('Hero'),
	SmartImage: mockComponent('SmartImage'),
	MenuAccordion: mockComponent('MenuAccordion'),
	MenuAccordionButton: mockComponent('MenuAccordionButton'),
	MenuSimple: mockComponent('MenuSimple'),
	GoogleAnalytics: mockComponent('GoogleAnalytics'),
	PixelatedFooter: mockComponent('PixelatedFooter'),
	PageGridItem: mockComponent('PageGridItem'),
	PageFlexItem: mockComponent('PageFlexItem'),
	Callout: mockComponent('Callout'),
	FAQAccordion: mockComponent('FAQAccordion'),
	SchemaFAQ: mockComponent('SchemaFAQ'),
	Markdown: mockComponent('Markdown'),
	BlogPostList: mockComponent('BlogPostList'),
	SchemaBlogPosting: mockComponent('SchemaBlogPosting'),
	StyleGuideUI: mockComponent('StyleGuideUI'),
	FormEngine: mockComponent('FormEngine'),
	Carousel: mockComponent('Carousel'),
	ReviewSchema: mockComponent('ReviewSchema'),
};

export const createPageComponentMocks = (overrides: Record<string, any> = {}) => {
	return {
		...defaultMocks,
		...overrides,
	};
};
