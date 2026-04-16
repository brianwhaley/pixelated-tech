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

export const createPageComponentMocks = (overrides: Record<string, any> = {}) => ({
	__esModule: true,
	PageTitleHeader: ({ title }: any) => React.createElement('h1', { 'data-testid': 'page-title-header' }, title),
	PageSection: ({ children, id }: any) => React.createElement('section', { 'data-testid': 'page-section', id }, children),
	PageSectionHeader: ({ title }: any) => React.createElement('h2', { 'data-testid': 'page-section-header' }, title),
	PageGridItem: ({ children }: any) => React.createElement('div', { 'data-testid': 'page-grid-item' }, children),
	PageFlexItem: ({ children }: any) => React.createElement('div', { 'data-testid': 'page-flex-item' }, children),
	Callout: ({ content }: any) => React.createElement('div', { 'data-testid': 'callout' }, content),
	FAQAccordion: ({ faqsData }: any) => React.createElement('div', { 'data-testid': 'faq-accordion' }, `faq:${faqsData?.length}`),
	SchemaFAQ: () => React.createElement('div', { 'data-testid': 'schema-faq' }, null),
	Markdown: ({ markdowndata }: any) => React.createElement('div', { 'data-testid': 'markdown' }, markdowndata),
	useFileData: () => mockState.fileData,
	BlogPostList: ({ site, posts }: any) => React.createElement('div', { 'data-testid': 'blog-post-list' }, `site:${site} count:${posts?.length}`),
	SchemaBlogPosting: () => React.createElement('div', { 'data-testid': 'schema-blog-posting' }, null),
	mapWordPressToBlogPosting: (post: any) => post,
	getCachedWordPressItems: async () => mockState.wordpressPosts,
	ToggleLoading: () => null,
	getSpotifySeries: async () => mockState.spotifySeries,
	getSpotifyEpisodes: async () => mockState.spotifyEpisodes,
	PodcastEpisodeList: ({ episodes }: any) => React.createElement('div', { 'data-testid': 'podcast-episode-list' }, `episodes:${episodes?.length}`),
	SchemaPodcastSeries: () => React.createElement('div', { 'data-testid': 'schema-podcast-series' }, null),
	SchemaPodcastEpisode: () => React.createElement('div', { 'data-testid': 'schema-podcast-episode' }, null),
	mapPodcastSeriesToSchema: (series: any) => series,
	mapPodcastEpisodeToSchema: (episode: any) => episode,
	MicroInteractions: () => null,
	FormEngine: () => React.createElement('div', { 'data-testid': 'form-engine' }, null),
	Calendly: () => React.createElement('div', { 'data-testid': 'calendly' }, null),
	StyleGuideUI: ({ routes }: any) => React.createElement('div', { 'data-testid': 'styleguide-ui' }, `routes:${routes?.length}`),
	Tiles: ({ cards }: any) => React.createElement('div', { 'data-testid': 'tiles' }, `cards:${cards?.length}`),
	MenuAccordion: ({ children }: any) => React.createElement('div', { 'data-testid': 'menu-accordion' }, children),
	MenuAccordionButton: () => React.createElement('button', { 'data-testid': 'menu-accordion-button' }, 'Menu'),
	MenuSimple: ({ children }: any) => React.createElement('div', { 'data-testid': 'menu-simple' }, children),
	SmartImage: ({ src, alt }: any) => React.createElement('img', { 'data-testid': 'smart-image', src: src || '/images/placeholder.png', alt: alt || '' }),
	GoogleAnalytics: () => React.createElement('div', { 'data-testid': 'google-analytics' }, null),
	PixelatedFooter: () => React.createElement('div', { 'data-testid': 'pixelated-footer' }, null),
	WebsiteSchema: () => null,
	LocalBusinessSchema: () => null,
	ServicesSchema: () => null,
	BreadcrumbListSchema: () => null,
	VisualDesignStyles: () => null,
	FourOhFour: ({ images }: any) => React.createElement('div', { 'data-testid': 'four-oh-four' }, `images:${images?.length}`),
	SkeletonLoading: () => React.createElement('div', { 'data-testid': 'skeleton-loading' }, null),
	preloadAllCSS: () => null,
	preloadImages: () => null,
	GlobalErrorUI: ({ error, reset }: any) => React.createElement('div', { 'data-testid': 'global-error-ui' }, [error?.message, typeof reset]),
	...overrides,
});
