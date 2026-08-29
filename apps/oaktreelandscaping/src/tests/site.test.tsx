import path from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { beforeEach, describe, expect, vi } from 'vitest';
import {
	render,
	screen,
	waitFor,
	runCommonPageCoverage,
	runCommonElementCoverage,
	runCommonBlogPageCoverage,
	runCommonMarkdownPageCoverage,
	runCommonServiceRouteCoverage,
	runPageSmokeTests,
} from '../../../../shared/test-utils/index.test-utils';
import {
	config as pixelatedConfig,
	mockState,
	resetMockState,
	setFileDataState,
	resetFileDataState,
	setPixelatedConfigOverride,
	resetPixelatedConfigOverride,
	setContentfulEntriesResponse,
	setContentfulImagesResponse,
} from '@/tests/page-mocks';
import { headers } from 'next/headers';

import Header from '@/app/elements/header';
import Nav from '@/app/elements/nav';
import Footer from '@/app/elements/footer';
import LayoutClient from '@/app/elements/layout-client';
import NotFound from '@/app/not-found';
import RootLayout from '@/app/layout';
import Home from '@/app/(pages)/(home)/page';
import AboutPage from '@/app/(pages)/about/page';
import BlogPage from '@/app/(pages)/blog/page';
import BlogCalendarPage from '@/app/(pages)/blogcalendar/page';
import ContactPage from '@/app/(pages)/contact/page';
import FaqsPage from '@/app/(pages)/faqs/page';
import ProjectsPage from '@/app/(pages)/projects/page';
import ProspectsPage from '@/app/(pages)/prospects/page';
import ServicesPage from '@/app/(pages)/services/page';
import ServiceAreasPage from '@/app/(pages)/service-areas/page';
import ServiceAreaDetailPage from '@/app/(pages)/service-areas/[serviceArea]/page';
import ServiceDetailPage from '@/app/(pages)/services/[service]/page';
import StyleGuidePage from '@/app/(pages)/styleguide/page';
import { proxy } from '@/proxy';
import { GET as humansGET } from '@/app/humans.txt/route';
import { GET as securityGET } from '@/app/security.txt/route';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '..', '..');

const routeParams: Record<string, string | undefined> = {
	serviceArea: 'bluffton-sc',
	service: 'commercial',
};

vi.mock('next/navigation', () => ({
	useParams: () => routeParams,
}));

describe('Oaktree Landscaping coverage', () => {
	runCommonPageCoverage({
		appRoot,
		ignoredPageTypes: [
			'partners',
			'podcast',
			'updates',
			'resume',
			'workportfolio',
			'buzzwordbingo',
			'readme',
			'recipes',
		],

		config: pixelatedConfig,
		setPixelatedConfigOverride,
		headersModule: { headers },
		cloudinaryProductEnv: 'test_env',
		render,
		screen,
		createElement: React.createElement,
		notFoundAssertion: () => {
			expect(screen.getByTestId('four-oh-four')).not.toBeNull();
		},
	});

	runCommonElementCoverage({
		Header,
		Nav,
		Footer,
		LayoutClient,
		NotFoundElement: NotFound,
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
		notFoundAssertion: () => {
			expect(screen.getByTestId('four-oh-four')).not.toBeNull();
		},
	});

	runCommonBlogPageCoverage({
		Component: BlogPage,
		render,
		screen,
		waitFor,
		mockState,
		resetMockState,
		blogPostListTestId: 'blog-post-list',
	});

	runCommonMarkdownPageCoverage({
		pages: [
			{
				name: 'Blog Calendar',
				Component: BlogCalendarPage,
				markdownTestId: 'markdown',
				loadingText: 'Loading...',
				errorText: 'Error: Failed to load',
			},
		],
		render,
		screen,
		waitFor,
		setFileDataState,
		resetFileDataState,
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
		initialServiceAreaSlug: 'bluffton-sc',
		initialServiceSlug: 'commercial',
	});

	describe('Oaktree branch coverage', () => {
		beforeEach(() => {
			resetMockState();
			resetFileDataState();
			setPixelatedConfigOverride(undefined);
		});

		it('renders the Projects page with matching Contentful entries and images', async () => {
			setContentfulEntriesResponse({
				items: [
					{
						sys: { contentType: { sys: { id: 'wrong-type' } } },
						fields: {
							title: 'Ignored Project',
							description: 'Should be ignored',
							images: [],
						},
					},
					{
						sys: { contentType: { sys: { id: '4upe5EGYMjJulOSqyXJsuw' } } },
						fields: {
							title: '10 Project',
							description: 'Tenth project',
							images: [],
						},
					},
					{
						sys: { contentType: { sys: { id: '4upe5EGYMjJulOSqyXJsuw' } } },
						fields: {
							title: 'Project One',
							description: 'First project',
							images: [{ sys: { id: 'img-1' } }],
						},
					},
					{
						sys: { contentType: { sys: { id: '4upe5EGYMjJulOSqyXJsuw' } } },
						fields: {
							title: '2 Project',
							description: 'Second project',
							images: [],
						},
					},
				],
				includes: {
					Asset: [{ sys: { id: 'img-1' } }],
				},
			});
			setContentfulImagesResponse([
				{ image: 'https://example.com/project.jpg', imageAlt: 'Project image' },
			]);

			const pageElement = await ProjectsPage();
			render(pageElement);

			await waitFor(() => expect(screen.getByTestId('projects-client')).not.toBeNull());
			expect(screen.getByTestId('projects-client').textContent).toBe('3');
		});

		it('renders the Prospects page with loaded requests data', async () => {
			setFileDataState({
				data: [
					{
						company: 'Test Co',
						'street address': '1 Main St',
						city: 'Testville',
						state: 'SC',
						zip: '29401',
						emails: ['test@example.com'],
						'first name': 'Jane',
						'last name': 'Doe',
					},
				],
				loading: false,
				error: null,
			});

			render(<ProspectsPage />);

			await waitFor(() => expect(screen.getByTestId('table')).not.toBeNull());
		});

		it('renders Header with missing config routes fallback', () => {
			setPixelatedConfigOverride(null);
			render(<Header />);
			expect(screen.getByTestId('menu-accordion-button')).not.toBeNull();
			setPixelatedConfigOverride(undefined);
		});

		it('renders Home page when wordpress posts are unavailable', async () => {
			mockState.wordpressPosts = [];
			render(<Home />);

			await waitFor(() => expect(screen.getByTestId('blog-post-list')).not.toBeNull());
		});

		it('renders Blog page when wordpress posts are unavailable', async () => {
			mockState.wordpressPosts = [];
			render(<BlogPage />);

			await waitFor(() => expect(screen.getByTestId('blog-post-list')).not.toBeNull());
		});
	});

	runPageSmokeTests([
		{
			name: 'Home',
			Component: Home,
			assertion: async () => {
				await waitFor(() => expect(screen.getAllByTestId('callout').length).toBeGreaterThan(0));
			},
		},
		{
			name: 'About',
			Component: AboutPage,
			assertion: async () => {
				await waitFor(() => expect(screen.getByTestId('page-title-header')).not.toBeNull());
			},
		},
		{
			name: 'Services',
			Component: ServicesPage,
			assertion: async () => {
				await waitFor(() => expect(screen.getByTestId('services')).not.toBeNull());
			},
		},
		{
			name: 'Contact',
			Component: ContactPage,
			assertion: async () => {
				setPixelatedConfigOverride({ siteInfo: pixelatedConfig.siteInfo });
				await waitFor(() => expect(screen.getByTestId('form-engine')).not.toBeNull());
				setPixelatedConfigOverride(undefined);
			},
		},
		{
			name: 'FAQs',
			Component: FaqsPage,
			assertion: async () => {
				await waitFor(() => expect(screen.getByTestId('faq')).not.toBeNull());
			},
		},
		{
			name: 'Projects',
			Component: ProjectsPage,
			assertion: async () => {
				const pageElement = await ProjectsPage();
				render(pageElement);
				await waitFor(() => expect(screen.getByTestId('projects-client')).not.toBeNull());
			},
		},
		{
			name: 'Prospects',
			Component: ProspectsPage,
			assertion: async () => {
				await waitFor(() => expect(screen.getAllByTestId(/page-section/).length).toBeGreaterThan(0));
			},
		},
		{
			name: 'Style Guide',
			Component: StyleGuidePage,
			assertion: async () => {
				await waitFor(() => expect(document.getElementById('colors-section')).not.toBeNull());
			},
		},
	]);

});
