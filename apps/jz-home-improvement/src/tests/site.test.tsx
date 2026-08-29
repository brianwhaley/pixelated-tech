import path from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import {
	render,
	screen,
	waitFor,
	runCommonPageCoverage,
	runCommonElementCoverage,
	runCommonServiceRouteCoverage,
	runPageSmokeTests,
} from '../../../../shared/test-utils/index.test-utils';
import {
	config as pixelatedConfig,
	setPixelatedConfigOverride,
	setContentfulEntriesResponse,
	setContentfulImagesResponse,
	resetContentfulMocks,
	resetPixelatedConfigOverride,
} from '@/tests/page-mocks';
import { headers } from 'next/headers';

import Header from '@/app/elements/header';
import Nav from '@/app/elements/nav';
import Footer from '@/app/elements/footer';
import LayoutClient from '@/app/elements/layout-client';
import NotFound from '@/app/not-found';
import RootLayout from '@/app/layout';
import Home from '@/app/(pages)/(home)/page';
import ContactPage from '@/app/(pages)/contact/page';
import FaqsPage from '@/app/(pages)/faqs/page';
import ServicesPage from '@/app/(pages)/services/page';
import ServiceAreasPage from '@/app/(pages)/service-areas/page';
import ServiceAreaDetailPage from '@/app/(pages)/service-areas/[serviceArea]/page';
import ServiceDetailPage from '@/app/(pages)/services/[service]/page';
import StyleGuidePage from '@/app/(pages)/styleguide/page';
import ProjectsPage from '@/app/(pages)/projects/page';
import { proxy } from '@/proxy';
import { GET as humansGET } from '@/app/humans.txt/route';
import { GET as securityGET } from '@/app/security.txt/route';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '..', '..');

const routeParams: Record<string, string | undefined> = {
	serviceArea: 'union-nj',
	service: 'kitchens',
};

vi.mock('next/navigation', () => ({
	useParams: () => routeParams,
}));

describe('JZ Home Improvement coverage', () => {
	runCommonPageCoverage({
		appRoot,
		ignoredPageTypes: [
			'blog',
			'blogcalendar',
			'partners',
			'podcast',
			'updates',
			'resume',
			'workportfolio',
			'buzzwordbingo',
			'readme',
			'recipes',
		],

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

	runPageSmokeTests([
		{
			name: 'Home',
			Component: Home,
			assertion: async () => {
				await waitFor(() => expect(screen.getAllByTestId('page-title-header').length).toBeGreaterThan(0));
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
				await waitFor(() => expect(screen.getByTestId('form-engine')).not.toBeNull());
			},
		},
		{
			name: 'FAQ',
			Component: FaqsPage,
			assertion: async () => {
				await waitFor(() => expect(screen.getByTestId('page-title-header')).not.toBeNull());
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


	describe('JZ Home Improvement home page coverage', () => {
		const originalLocation = window.location;

		beforeAll(() => {
			delete (window as any).location;
			Object.defineProperty(window, 'location', {
				configurable: true,
				value: { href: '/' },
			});
		});

		afterAll(() => {
			Object.defineProperty(window, 'location', {
				configurable: true,
				value: originalLocation,
			});
		});

		it('navigates to /contact when the contact button is clicked and renders BusinessFooter', () => {
			render(<Home />);

			const button = screen.getByTestId('formbutton');
			button.click();

			expect(window.location.href).toBe('/contact');
			expect(screen.getByTestId('business-footer')).toBeTruthy();
		});

		it('renders BusinessFooter when config is missing', async () => {
			setPixelatedConfigOverride(null);
			render(<Home />);

			expect(screen.getByTestId('business-footer')).toBeTruthy();
			setPixelatedConfigOverride(undefined);
		});
	});

	describe('JZ Home Improvement projects page', () => {
		beforeEach(() => {
			resetContentfulMocks();
		});

		it('renders projects through the ProjectsClient component', async () => {
			setContentfulEntriesResponse({
				items: [
					{
						sys: { contentType: { sys: { id: '5yLwz568n8n0BwOzHYda0W' } } },
						fields: {
							title: 'Project One',
							description: 'A beautiful epoxy project',
							images: [],
						},
					},
				],
				includes: { Asset: [] },
			});
			setContentfulImagesResponse([]);

			const pageElement = await ProjectsPage();
			render(pageElement);

			expect(screen.getByTestId('projects-client')).toBeTruthy();
		});

		it('renders project cards with images and numeric sorting', async () => {
			setContentfulEntriesResponse({
				items: [
					{
						sys: { contentType: { sys: { id: '5yLwz568n8n0BwOzHYda0W' } } },
						fields: {
							title: '2 Project',
							description: 'Second project',
							images: [{ sys: { id: 'img-1' } }],
						},
					},
					{
						sys: { contentType: { sys: { id: '5yLwz568n8n0BwOzHYda0W' } } },
						fields: {
							title: 'Project One',
							description: 'First project',
							images: [],
						},
					},
				],
				includes: { Asset: [{ sys: { id: 'img-1' } }] },
			});
			setContentfulImagesResponse([{ image: '/images/project.jpg', imageAlt: 'Project image' }]);

			const pageElement = await ProjectsPage();
			render(pageElement);
			expect(screen.getByTestId('projects-client').textContent).toBe('2');
		});

		it('skips non-matching content types and sorts numeric titles correctly', async () => {
			setContentfulEntriesResponse({
				items: [
					{
						sys: { contentType: { sys: { id: '5yLwz568n8n0BwOzHYda0W' } } },
						fields: {
							title: '3 Project',
							description: 'Third project',
							images: [],
						},
					},
					{
						sys: { contentType: { sys: { id: '5yLwz568n8n0BwOzHYda0W' } } },
						fields: {
							title: '10 Project',
							description: 'Tenth project',
							images: [],
						},
					},
					{
						sys: { contentType: { sys: { id: 'wrong-type' } } },
						fields: {
							title: 'Ignored Project',
							description: 'Should be ignored',
							images: [],
						},
					},
				],
				includes: { Asset: [] },
			});
			setContentfulImagesResponse([]);

			const pageElement = await ProjectsPage();
			render(pageElement);
			expect(screen.getByTestId('projects-client').textContent).toBe('2');
		});

		it('sorts alphabetic titles in descending order', async () => {
			setContentfulEntriesResponse({
				items: [
					{
						sys: { contentType: { sys: { id: '5yLwz568n8n0BwOzHYda0W' } } },
						fields: {
							title: 'Apple Project',
							description: 'Apple project',
							images: [],
						},
					},
					{
						sys: { contentType: { sys: { id: '5yLwz568n8n0BwOzHYda0W' } } },
						fields: {
							title: 'Banana Project',
							description: 'Banana project',
							images: [],
						},
					},
				],
				includes: { Asset: [] },
			});
			setContentfulImagesResponse([]);

			const pageElement = await ProjectsPage();
			render(pageElement);
			expect(screen.getByTestId('projects-client').textContent).toBe('2');
		});

		it('orders numeric titles before alphabetic titles to exercise mixed sorting branch', async () => {
			setContentfulEntriesResponse({
				items: [
					{
						sys: { contentType: { sys: { id: '5yLwz568n8n0BwOzHYda0W' } } },
						fields: {
							title: 'Project Alpha',
							description: 'Alpha project',
							images: [],
						},
					},
					{
						sys: { contentType: { sys: { id: '5yLwz568n8n0BwOzHYda0W' } } },
						fields: {
							title: '2 Project',
							description: 'Second project',
							images: [],
						},
					},
				],
				includes: { Asset: [] },
			});
			setContentfulImagesResponse([]);

			const pageElement = await ProjectsPage();
			render(pageElement);
			expect(screen.getByTestId('projects-client').textContent).toBe('2');
		});
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
		initialServiceAreaSlug: 'union-nj',
		initialServiceSlug: 'kitchens',
	});
});
