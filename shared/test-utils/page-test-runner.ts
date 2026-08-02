import React, { ComponentType } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup } from '@testing-library/react';
import { render } from './render';
import { createPageComponentMocks } from './page-mocks';

export interface PageSmokeTestCase {
	name: string;
	Component: ComponentType<any>;
	assertion?: () => Promise<void> | void;
}

export function runPageSmokeTests(pageTests: PageSmokeTestCase[]) {
	describe('Page smoke tests', () => {
		afterEach(() => cleanup());

		for (const { name, Component, assertion } of pageTests) {
			it(`renders ${name} page`, async () => {
				const Page = Component;
				render(React.createElement(Page));

				if (assertion) {
					await assertion();
				}
			});
		}
	});
}

export function createHomePageMocks(overrides: Record<string, any> = {}) {
	return createPageComponentMocks({
		FormButton: ({ onClick, text, ...props }: any) => React.createElement(
			'button',
			{ 'data-testid': 'formbutton', onClick, ...props },
			text,
		),
		BusinessFooter: () => React.createElement('div', { 'data-testid': 'businessfooter' }, null),
		...overrides,
	});
}

export function createProjectsPageMocks(overrides: Record<string, any> = {}) {
	return createPageComponentMocks({
		ProjectsClient: ({ projects }: any) => React.createElement(
			'div',
			{ 'data-testid': 'projectsclient' },
			Array.isArray(projects) ? projects.length : 0,
		),
		...overrides,
	});
}

export function createNextNavigationParamsFactory(params: Record<string, string | undefined>) {
	return {
		useParams: () => params,
	};
}

function queryByTestIdOrId(screen: any, identifier: string) {
	return screen.queryByTestId(identifier) ?? document.getElementById(identifier);
}

export interface CommonBlogPageCoverageOptions {
	Component: React.ComponentType<any>;
	render: any;
	screen: any;
	waitFor: any;
	mockState: {
		wordpressPosts: any[] | null;
	};
	resetMockState: () => void;
	blogPostListTestId?: string;
}

export function runCommonBlogPageCoverage({
	Component,
	render,
	screen,
	waitFor,
	mockState,
	resetMockState,
	blogPostListTestId = 'blog-post-list',
}: CommonBlogPageCoverageOptions) {
	describe('Common blog page coverage', () => {
		beforeEach(() => {
			resetMockState();
		});

		it('renders the blog page with posts', async () => {
			mockState.wordpressPosts = [{ id: 1, title: 'Hello' }];
			render(React.createElement(Component));

			await waitFor(() => {
				const blogList = screen.queryByTestId(blogPostListTestId);
				expect(blogList).toBeTruthy();
			});
		});

		it('renders the blog page when wordpress posts are unavailable', async () => {
			mockState.wordpressPosts = null as any;
			render(React.createElement(Component));

			await waitFor(() => {
				const blogList = screen.queryByTestId(blogPostListTestId);
				expect(blogList).toBeTruthy();
			});
		});
	});
}

export interface CommonPodcastPageCoverageOptions {
	Component: React.ComponentType<any>;
	render: any;
	screen: any;
	waitFor: any;
	mockState: {
		spotifySeries: any;
		spotifyEpisodes: any[] | null;
	};
	resetMockState: () => void;
	podcastListTestId?: string;
}

export function runCommonPodcastPageCoverage({
	Component,
	render,
	screen,
	waitFor,
	mockState,
	resetMockState,
	podcastListTestId = 'podcast-episode-list',
}: CommonPodcastPageCoverageOptions) {
	describe('Common podcast page coverage', () => {
		beforeEach(() => {
			resetMockState();
		});

		it('renders the podcast page with series and episodes', async () => {
			mockState.spotifySeries = { title: 'Test Series', link: 'https://example.com', summary: 'Test summary' };
			mockState.spotifyEpisodes = [
				{
					title: 'Episode One',
					pubDate: '2024-01-01',
					link: 'https://example.com/episode-one',
					guid: 'episode-one',
					creator: 'Host',
					summary: 'Summary text',
					explicit: false,
					duration: '00:30:00',
					image: 'https://example.com/cover.jpg',
					enclosure: { url: 'https://example.com/episode-one.mp3', type: 'audio/mpeg', length: '12345' },
					episode: '1',
					episodeType: 'full',
				},
			];
			render(React.createElement(Component));

			await waitFor(() => {
				const podcastList = screen.queryByTestId(podcastListTestId);
				expect(podcastList).toBeTruthy();
			});
		});

		it('renders the podcast page when podcast data is unavailable', async () => {
			mockState.spotifySeries = null;
			mockState.spotifyEpisodes = null;
			render(React.createElement(Component));

			await waitFor(() => {
				const podcastList = screen.queryByTestId(podcastListTestId);
				expect(podcastList).toBeTruthy();
			});
		});
	});
}

export interface CommonMarkdownPageCoverageOptions {
	pages: Array<{
		name: string;
		Component: React.ComponentType<any>;
		markdownTestId?: string;
		loadingText?: string;
		errorText?: string;
		emptyContentText?: string | RegExp;
	}>;
	render: any;
	screen: any;
	waitFor: any;
	setFileDataState: (args: { data: string | null; loading: boolean; error: string | null }) => void; // eslint-disable-line no-unused-vars
	resetFileDataState: () => void;
}

export function runCommonMarkdownPageCoverage({
	pages,
	render,
	screen,
	waitFor,
	setFileDataState,
	resetFileDataState,
}: CommonMarkdownPageCoverageOptions) {
	describe('Common markdown page coverage', () => {
		afterEach(() => cleanup());
		beforeEach(() => {
			resetFileDataState();
		});

		for (const page of pages) {
			const markdownTestId = page.markdownTestId ?? 'markdown';
			const loadingText = page.loadingText ?? 'Loading...';
			const errorText = page.errorText ?? 'Error: Failed to load';
			const emptyContentText = page.emptyContentText ?? '';

			it(`renders ${page.name} loading state`, async () => {
				setFileDataState({ data: null, loading: true, error: null });
				render(React.createElement(page.Component));
				await waitFor(() => expect(screen.getByText(loadingText)).toBeTruthy());
			});

			it(`renders ${page.name} error state`, async () => {
				setFileDataState({ data: null, loading: false, error: errorText.replace(/^Error:\s*/i, '') });
				render(React.createElement(page.Component));
				await waitFor(() => expect(screen.getByText(errorText)).toBeTruthy());
			});

			it(`renders ${page.name} success state`, async () => {
				setFileDataState({ data: 'page content', loading: false, error: null });
				render(React.createElement(page.Component));
				await waitFor(() => expect(queryByTestIdOrId(screen, markdownTestId)).toBeTruthy());
			});

			it(`renders ${page.name} empty markdown fallback`, async () => {
				setFileDataState({ data: null, loading: false, error: null });
				render(React.createElement(page.Component));
				await waitFor(() => expect(queryByTestIdOrId(screen, markdownTestId)).toBeTruthy());
				if (emptyContentText !== '') {
					expect(queryByTestIdOrId(screen, markdownTestId)).toHaveTextContent(emptyContentText);
				}
			});
		}
	});
}

export interface CommonServiceRouteCoverageOptions {
	routeParams: Record<string, string | undefined>;
	ServiceAreasPage: React.ComponentType<any>;
	ServiceAreaDetailPage: React.ComponentType<any>;
	ServiceDetailPage: React.ComponentType<any>;
	render: any;
	screen: any;
	waitFor: any;
	setPixelatedConfigOverride?: (_arg: any | null | undefined) => void; // eslint-disable-line no-unused-vars
	resetPixelatedConfigOverride?: () => void;
	serviceAreaNotFoundText: string;
	serviceNotFoundText: string;
	serviceAreaTestId?: string;
	serviceAreaDetailTestId?: string;
	serviceDetailTestId?: string;
	initialServiceAreaSlug?: string;
	initialServiceSlug?: string;
}

export function runCommonServiceRouteCoverage({
	routeParams,
	ServiceAreasPage,
	ServiceAreaDetailPage,
	ServiceDetailPage,
	render,
	screen,
	waitFor,
	setPixelatedConfigOverride,
	resetPixelatedConfigOverride,
	serviceAreaNotFoundText,
	serviceNotFoundText,
	serviceAreaTestId = 'service-areas',
	serviceAreaDetailTestId = 'serviceareadetailpage',
	serviceDetailTestId = 'servicedetailpage',
	initialServiceAreaSlug = 'morris-plains-nj',
	initialServiceSlug = 'precision-metal-fabrication',
}: CommonServiceRouteCoverageOptions) {
	describe('Common service route coverage', () => {
		beforeEach(() => {
			routeParams.serviceArea = initialServiceAreaSlug;
			routeParams.service = initialServiceSlug;
		});

		afterEach(() => {
			resetPixelatedConfigOverride?.();
		});

		it('renders the service areas index page', () => {
			render(React.createElement(ServiceAreasPage));
			expect(queryByTestIdOrId(screen, serviceAreaTestId)).toBeTruthy();
		});

		it('renders a service area detail route when the slug exists', async () => {
			render(React.createElement(ServiceAreaDetailPage));
			await waitFor(() => expect(queryByTestIdOrId(screen, serviceAreaDetailTestId)).toBeTruthy());
		});

		it('renders a service area detail route not found message when slug does not exist', async () => {
			routeParams.serviceArea = 'unknown-area';
			render(React.createElement(ServiceAreaDetailPage));
			await waitFor(() => expect(screen.getByText(serviceAreaNotFoundText)).toBeTruthy());
		});

		it('renders a service detail route when the slug exists', async () => {
			render(React.createElement(ServiceDetailPage));
			await waitFor(() => expect(queryByTestIdOrId(screen, serviceDetailTestId)).toBeTruthy());
		});

		it('renders a service detail route not found message when slug does not exist', async () => {
			routeParams.service = 'unknown-service';
			render(React.createElement(ServiceDetailPage));
			await waitFor(() => expect(screen.getByText(serviceNotFoundText)).toBeTruthy());
		});

		if (setPixelatedConfigOverride) {
			it('renders a service area detail route when an explicit slug field is present', async () => {
				setPixelatedConfigOverride({
					siteInfo: {
						serviceAreas: [{ name: 'Custom Area', slug: 'custom-area' }],
					},
				});
				routeParams.serviceArea = 'custom-area';
				render(React.createElement(ServiceAreaDetailPage));
				await waitFor(() => expect(queryByTestIdOrId(screen, serviceAreaDetailTestId)).toBeTruthy());
			});

			it('renders a service detail route when an explicit slug field is present', async () => {
				setPixelatedConfigOverride({
					siteInfo: {
						services: [{ name: 'Custom Kitchens', slug: 'custom-kitchens' }],
					},
				});
				routeParams.service = 'custom-kitchens';
				render(React.createElement(ServiceDetailPage));
				await waitFor(() => expect(queryByTestIdOrId(screen, serviceDetailTestId)).toBeTruthy());
			});
		}
	});
}

export interface CommonGoogleReviewsCoverageOptions {
	Component: React.ComponentType<any>;
	render: any;
	screen: any;
	waitFor: any;
	setPixelatedConfigOverride: (_config: any | null | undefined) => void; // eslint-disable-line no-unused-vars
	reviewTestId?: string;
	googlePlacesConfig?: any;
}

export function runCommonGoogleReviewsCoverage({
	Component,
	render,
	screen,
	waitFor,
	setPixelatedConfigOverride,
	reviewTestId = 'google-reviews-carousel',
	googlePlacesConfig = { integrations: { googlePlaces: { placeId: 'test-place' } } },
}: CommonGoogleReviewsCoverageOptions) {
	describe('Common Google Reviews coverage', () => {
		afterEach(() => setPixelatedConfigOverride(undefined));

		it('renders GoogleReviewsCarousel when googlePlaces config is present', async () => {
			setPixelatedConfigOverride(googlePlacesConfig);
			render(React.createElement(Component));
			await waitFor(() => expect(screen.getByTestId(reviewTestId)).toBeTruthy());
		});

		it('does not render GoogleReviewsCarousel when googlePlaces config is unavailable', async () => {
			setPixelatedConfigOverride(null);
			render(React.createElement(Component));
			expect(screen.queryByTestId(reviewTestId)).toBeNull();
		});
	});
}
