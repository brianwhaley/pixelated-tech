import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, vi } from 'vitest';
import { cleanup, render, screen, waitFor, runCommonPageCoverage, runCommonElementCoverage, runCommonServiceRouteCoverage, runPageSmokeTests } from '../../../../shared/test-utils/index.test-utils';
import React from 'react';
import { config as pixelatedConfig, mockState, resetMockState, setFileDataState, resetFileDataState, setPixelatedConfigOverride, resetPixelatedConfigOverride } from '@/tests/page-mocks';
import { headers } from 'next/headers';

const routeParams: Record<string, string | undefined> = {
	serviceArea: 'morris-plains-nj',
	service: 'web-development',
};
let navigationSearchParams = new URLSearchParams();
const setNavigationSearchParams = (params: string) => {
	navigationSearchParams = new URLSearchParams(params);
};

vi.mock('next/navigation', () => ({
	useSearchParams: () => navigationSearchParams,
	useParams: () => routeParams,
}));

import Header from '@/app/elements/header';
import Nav from '@/app/elements/nav';
import Footer from '@/app/elements/footer';
import { LayoutClient } from '@/app/elements/layoutclient';
import NotFoundElement from '@/app/not-found';
import RootLayout from '@/app/layout';
import Home from '@/app/(pages)/(home)/page';
import StyleGuide from '@/app/(pages)/styleguide/page';
import Portfolio from '@/app/(pages)/portfolio/page';
import Schedule from '@/app/(pages)/schedule/page';
import BlogPage from '@/app/(pages)/blog/page';
import BlogCalendarPage from '@/app/(pages)/blogcalendar/page';
import FAQPage from '@/app/(pages)/faqs/page';
import ServiceAreasPage from '@/app/(pages)/service-areas/page';
import ServicesPage from '@/app/(pages)/services/page';
import ServiceAreaDetailPage from '@/app/(pages)/service-areas/[serviceArea]/page';
import ServiceDetailPage from '@/app/(pages)/services/[service]/page';
import LegalPage from '@/app/(pages)/legal/page';
import TermsPage from '@/app/(pages)/terms/page';
import PartnersPage from '@/app/(pages)/partners/page';
import PodcastPage from '@/app/(pages)/podcast/page';
import PricingPage from '@/app/(pages)/pricing/page';
import PrivacyPage from '@/app/(pages)/privacy/page';
import ProcessPage from '@/app/(pages)/process/page';
import SamplesPage from '@/app/(pages)/samples/page';
import SamplePage1 from '@/app/(pages)/samples/page1/page';
import SamplePage2 from '@/app/(pages)/samples/page2/page';
import SamplePage3 from '@/app/(pages)/samples/page3/page';
import SamplePage4 from '@/app/(pages)/samples/page4/page';
import SamplePage5 from '@/app/(pages)/samples/page5/page';
import SamplePage6 from '@/app/(pages)/samples/page6/page';
import InstagramPage from '@/app/(pages)/instagram/page';
import HeaderNav from '@/app/elements/headernav';
import Search from '@/app/elements/search';
import ByTheWayPage from '@/app/(pages)/bytheway/page';
import NerdJokesPage from '@/app/(pages)/nerdjokes/page';
import StkrPage from '@/app/(pages)/stkr/page';
import { proxy } from '@/proxy';
import { GET as humansGET } from '@/app/humans.txt/route';
import { GET as securityGET } from '@/app/security.txt/route';
import { GET as sitemapJsonGET } from '@/app/sitemap.json/route';
import { GET as rssXmlGET } from '@/app/rss.xml/route';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '..', '..');

describe('Site coverage', () => {
	afterEach(() => {
		resetMockState();
		resetFileDataState();
		resetPixelatedConfigOverride();
	});

	runCommonPageCoverage({
		appRoot,
		ignoredPageTypes: [
			'about',
			'contact',
			'updates',
		],
		ignoredCommonRoutes: ['socialtags'],
	});

	runCommonElementCoverage({
		Header,
		Nav,
		Footer,
		LayoutClient,
		NotFoundElement,
		RootLayout,
		proxy,
		humansGET,
		securityGET,
		config: pixelatedConfig,
		setPixelatedConfigOverride,
		headersModule: { headers },
		cloudinaryProductEnv: 'test_env',
		render,
		screen,
		createElement: React.createElement,
		navAssertion: () => {
			expect(screen.getByTestId('menuaccordion')).not.toBeNull();
		},
		headerAssertion: () => {
			expect(screen.getByTestId('menu-accordion-button')).not.toBeNull();
		},
		notFoundAssertion: () => {
			expect(screen.getByTestId('four-oh-four')).not.toBeNull();
		},
	});

	it('renders HeaderNav with fallback route data', () => {
		setPixelatedConfigOverride(null);
		render(React.createElement(HeaderNav));
		expect(screen.getByTestId('menu-simple')).not.toBeNull();
	});

	it('renders Nav with and without fullmenu query param', () => {
		setNavigationSearchParams('');
		render(React.createElement(Nav));
		expect(screen.getByTestId('menuaccordion')).not.toBeNull();
		cleanup();

		setNavigationSearchParams('fullmenu=true');
		render(React.createElement(Nav));
		expect(screen.getByTestId('menuaccordion')).not.toBeNull();
	});

	it('renders Search component and GoogleSearch mock', () => {
		render(React.createElement(Search));
		expect(screen.getByTestId('google-search')).not.toBeNull();
	});

	it('returns sitemap.json response from the route', async () => {
		const response = await sitemapJsonGET({ url: 'https://example.com/sitemap.json' } as any);
		expect(response.status).toBe(200);
		const json = await response.json();
		expect(json).toHaveProperty('urlset');
		expect(Array.isArray(json.urlset)).toBe(true);
	});

	it('returns rss.xml response from the route', async () => {
		const response = await rssXmlGET({ url: 'https://example.com/rss.xml' } as any);
		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toContain('application/xml');
		const text = await response.text();
		expect(text).toContain('<?xml-stylesheet type="text/xsl" href="/rss.xsl"?>');
		expect(text).toContain('<rss version="2.0">');
	});

	it('renders Portfolio page and exercises Flickr callback sorting branches', async () => {
		render(React.createElement(Portfolio));
		await waitFor(() => expect(document.getElementById('portfolio-tiles-section')).not.toBeNull());
		expect(screen.getByTestId('tiles')).not.toBeNull();
	});

	it('renders Home page and exercises hero video selection', async () => {
		render(React.createElement(Home));
		expect(await screen.findByTestId('hero')).not.toBeNull();
		expect(await screen.findByTestId('page-title-header')).not.toBeNull();
	});

	it('renders Blog page with categories and posts', async () => {
		render(React.createElement(BlogPage));
		expect(await screen.findByTestId('blog-post-list')).not.toBeNull();
	});

	it('renders Blog page when WordPress configuration is missing', async () => {
		setPixelatedConfigOverride({
			...pixelatedConfig,
			integrations: {
				...pixelatedConfig.integrations,
				wordpress: undefined,
			},
		});
		mockState.wordpressPosts = null;
		mockState.wordpressCategories = null;
		render(React.createElement(BlogPage));
		expect(await screen.findByTestId('blog-post-list')).not.toBeNull();
	});

	it('renders Blog Calendar page with markdown content', async () => {
		setFileDataState({ data: 'blog calendar markdown', loading: false, error: null });
		render(React.createElement(BlogCalendarPage));
		expect(await screen.findByTestId('markdown')).not.toBeNull();
	});

	it('renders Blog Calendar loading state', async () => {
		setFileDataState({ data: null, loading: true, error: null });
		render(React.createElement(BlogCalendarPage));
		expect(await screen.findByText(/Loading.../i)).not.toBeNull();
	});

	it('renders Blog Calendar error state', async () => {
		setFileDataState({ data: null, loading: false, error: 'File not found' });
		render(React.createElement(BlogCalendarPage));
		expect(await screen.findByText(/Error: File not found/i)).not.toBeNull();
	});

	it('renders NerdJokes page with installed query branch', async () => {
		setNavigationSearchParams('installed=true');
		render(React.createElement(NerdJokesPage));
		expect(await screen.findByText(/Congratulations on successfully installing NerdJokes/i)).not.toBeNull();
	});

	it('renders NerdJokes page without installed query branch', async () => {
		setNavigationSearchParams('');
		render(React.createElement(NerdJokesPage));
		const smartImages = await screen.findAllByTestId('smart-image');
		expect(smartImages.length).toBeGreaterThan(0);
	});

	it('renders Partners page and exercises PartnersBadge URL branch', async () => {
		render(React.createElement(PartnersPage));
		await screen.findByText(/Pixelated Technologies Partners/i);
		await waitFor(() => expect(document.querySelectorAll('[data-testid="callout"]').length).toBeGreaterThan(0));
	});

	it('renders Podcast page and exercises Spotify series sorting branch', async () => {
		render(React.createElement(PodcastPage));
		await screen.findByText(/Pixelated Technologies Podcast Episodes/i);
		await waitFor(() => expect(document.querySelector('[data-testid="podcast-episode-list"]')).not.toBeNull());
	});

	runCommonServiceRouteCoverage({
		routeParams,
		ServiceAreasPage,
		ServiceAreaDetailPage,
		ServiceDetailPage,
		render,
		screen,
		waitFor,
		setPixelatedConfigOverride,
		resetPixelatedConfigOverride,
		serviceAreaNotFoundText: 'Service area not found. Please return to the service areas list and choose another region.',
		serviceNotFoundText: 'Service not found. Please return to the services list and choose another option.',
		initialServiceAreaSlug: 'denville-nj',
		initialServiceSlug: 'web-development',
	});

	runPageSmokeTests([
		{
			name: 'Home',
			Component: Home,
			assertion: async () => {
				await waitFor(() => expect(screen.getByTestId('page-title-header')).not.toBeNull());
				expect(screen.getByTestId('hero')).not.toBeNull();
			},
		},
		{
			name: 'Style Guide',
			Component: StyleGuide,
			assertion: async () => {
				await waitFor(() => expect(document.getElementById('colors-section')).not.toBeNull());
			},
		},
		{
			name: 'Portfolio',
			Component: Portfolio,
			assertion: async () => {
				await waitFor(() => expect(document.getElementById('portfolio-intro-section')).not.toBeNull());
				expect(document.getElementById('portfolio-tiles-section')).not.toBeNull();
				expect(screen.getByTestId('tiles')).not.toBeNull();
			},
		},
		{
			name: 'Schedule',
			Component: Schedule,
			assertion: async () => {
				await waitFor(() => expect(document.getElementById('social-section')).not.toBeNull());
				expect(screen.getByTestId('form-engine')).not.toBeNull();
			},
		},
		{
			name: 'Blog',
			Component: BlogPage,
			assertion: async () => {
				await waitFor(() => expect(screen.getByTestId('page-title-header')).not.toBeNull());
				expect(document.getElementById('blog-section')).not.toBeNull();
			},
		},
		{
			name: 'Blog Calendar',
			Component: BlogCalendarPage,
			assertion: async () => {
				await waitFor(() => expect(document.getElementById('markdown-container')).not.toBeNull());
			},
		},
		{
			name: 'FAQs',
			Component: FAQPage,
			assertion: async () => {
				await waitFor(() => expect(screen.getByTestId('page-title-header')).not.toBeNull());
				expect(document.getElementById('faq-section')).not.toBeNull();
			},
		},
		{
			name: 'Service Areas',
			Component: ServiceAreasPage,
			assertion: async () => {
				await waitFor(() => expect(screen.getByTestId('page-title-header')).not.toBeNull());
				expect(document.getElementById('service-areas-intro')).not.toBeNull();
			},
		},
		{
			name: 'Services',
			Component: ServicesPage,
			assertion: async () => {
				await waitFor(() => expect(screen.getByTestId('page-title-header')).not.toBeNull());
				expect(document.getElementById('services-intro')).not.toBeNull();
			},
		},
		{
			name: 'Legal',
			Component: LegalPage,
			assertion: async () => {
				await waitFor(() => expect(document.getElementById('terms-section')).not.toBeNull());
				expect(document.getElementById('privacy-section')).not.toBeNull();
			},
		},
		{
			name: 'Terms',
			Component: TermsPage,
			assertion: async () => {
				await waitFor(() => expect(document.getElementById('terms-section')).not.toBeNull());
			},
		},
		{
			name: 'Partners',
			Component: PartnersPage,
			assertion: async () => {
				await waitFor(() => expect(screen.getByTestId('page-title-header')).not.toBeNull());
				expect(document.getElementById('partners-section')).not.toBeNull();
			},
		},
		{
			name: 'Podcast',
			Component: PodcastPage,
			assertion: async () => {
				await waitFor(() => expect(screen.getByTestId('page-title-header')).not.toBeNull());
			},
		},
		{
			name: 'Pricing',
			Component: PricingPage,
			assertion: async () => {
				await waitFor(() => expect(document.getElementById('value-prop-section')).not.toBeNull());
			},
		},
		{
			name: 'Privacy',
			Component: PrivacyPage,
			assertion: async () => {
				await waitFor(() => expect(document.getElementById('privacy-section')).not.toBeNull());
			},
		},
		{
			name: 'Process',
			Component: ProcessPage,
			assertion: async () => {
				await waitFor(() => expect(document.getElementById('process-overview-section')).not.toBeNull());
			},
		},
		{
			name: 'Samples',
			Component: SamplesPage,
			assertion: async () => {
				await waitFor(() => expect(document.getElementById('samples-tiles-section')).not.toBeNull());
				expect(document.querySelectorAll('[data-testid="callout"]').length).toBeGreaterThan(0);
			},
		},
		{
			name: 'Instagram',
			Component: InstagramPage,
			assertion: async () => {
				await waitFor(() => expect(document.getElementById('instagram-section')).not.toBeNull());
				expect(document.getElementById('curator-feed-default-feed-layout')).not.toBeNull();
			},
		},
		{
			name: 'Sample Page 1',
			Component: SamplePage1,
			assertion: async () => {
				await waitFor(() => expect(document.getElementById('header-callout-section')).not.toBeNull());
				expect(document.getElementById('landscape-tiles-section')).not.toBeNull();
			},
		},
		{
			name: 'Sample Page 2',
			Component: SamplePage2,
			assertion: async () => {
				await waitFor(() => expect(document.getElementById('header-callout-section')).not.toBeNull());
				expect(document.getElementById('landscape-tiles-section')).not.toBeNull();
			},
		},
		{
			name: 'Sample Page 3',
			Component: SamplePage3,
			assertion: async () => {
				await waitFor(() => expect(document.getElementById('main-section')).not.toBeNull());
				expect(document.getElementById('tiles-section')).not.toBeNull();
			},
		},
		{
			name: 'Sample Page 4',
			Component: SamplePage4,
			assertion: async () => {
				await waitFor(() => expect(document.getElementById('hero-section')).not.toBeNull());
				expect(document.getElementById('featured-section')).not.toBeNull();
			},
		},
		{
			name: 'Sample Page 5',
			Component: SamplePage5,
			assertion: async () => {
				await waitFor(() => expect(document.getElementById('hero-section')).not.toBeNull());
				expect(document.getElementById('menu-section')).not.toBeNull();
			},
		},
		{
			name: 'Sample Page 6',
			Component: SamplePage6,
			assertion: async () => {
				await waitFor(() => expect(document.getElementById('hero-section')).not.toBeNull());
				expect(document.getElementById('whoweare-1-section')).not.toBeNull();
			},
		},
		{
			name: 'By The Way',
			Component: ByTheWayPage,
			assertion: async () => {
				await waitFor(() => expect(screen.getByTestId('page-title-header')).not.toBeNull());
			},
		},
		{
			name: 'NerdJokes',
			Component: NerdJokesPage,
			assertion: async () => {
				await waitFor(() => expect(screen.getByTestId('page-title-header')).not.toBeNull());
				expect(document.getElementById('nerdjoke-section')).not.toBeNull();
			},
		},
		{
			name: 'Stkr',
			Component: StkrPage,
			assertion: async () => {
				await waitFor(() => expect(screen.getByTestId('page-title-header')).not.toBeNull());
			},
		},
	]);
});
