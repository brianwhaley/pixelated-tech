import path from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { describe, expect, vi } from 'vitest';
import {
	render,
	screen,
	waitFor,
	fireEvent,
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
	setContentfulEntryResponse,
	setContentfulImagesResponse,
	resetContentfulMocks,
} from '@/tests/page-mocks';
import { headers } from 'next/headers';

import Header from '@/app/elements/header';
import Nav from '@/app/elements/nav';
import Footer from '@/app/elements/footer';
import { LayoutClient } from '@/app/elements/layoutclient';
import NotFound from '@/app/not-found';
import RootLayout from '@/app/layout';
import Home from '@/app/(pages)/(home)/page';
import AboutPage from '@/app/(pages)/about/page';
import BlogPage from '@/app/(pages)/blog/page';
import BlogCalendarPage from '@/app/(pages)/blogcalendar/page';
import ContactPage from '@/app/(pages)/contact/page';
import FaqsPage from '@/app/(pages)/faqs/page';
import ProjectsPage from '@/app/(pages)/projects/page';
import ProjectDetailPage from '@/app/(pages)/projects/[project]/page';
import AdCalendarPage from '@/app/(pages)/adcalendar/page';
import ServicesPage from '@/app/(pages)/services/page';
import ServiceAreasPage from '@/app/(pages)/service-areas/page';
import ServiceAreaDetailPage from '@/app/(pages)/service-areas/[serviceArea]/page';
import ServiceDetailPage from '@/app/(pages)/services/[service]/page';
import CommercialService from '@/app/(pages)/services/[service]/page';
import ConcretePolishingService from '@/app/(pages)/services/[service]/page';
import DrivewayCoatingService from '@/app/(pages)/services/[service]/page';
import EpoxyGarageFloorsService from '@/app/(pages)/services/[service]/page';
import PaverSealingService from '@/app/(pages)/services/[service]/page';
import ResidentialService from '@/app/(pages)/services/[service]/page';
import ResinCountertopsService from '@/app/(pages)/services/[service]/page';
import BeaufortSCServiceArea from '@/app/(pages)/service-areas/[serviceArea]/page';
import BlufftonSCServiceArea from '@/app/(pages)/service-areas/[serviceArea]/page';
import HardeevilleSCServiceArea from '@/app/(pages)/service-areas/[serviceArea]/page';
import HiltonHeadSCServiceArea from '@/app/(pages)/service-areas/[serviceArea]/page';
import OkatieSCServiceArea from '@/app/(pages)/service-areas/[serviceArea]/page';
import RidgelandSCServiceArea from '@/app/(pages)/service-areas/[serviceArea]/page';
import FlooringEstimatorPage, { FlooringEstimate } from '@/app/(pages)/flooring-estimator/page';
import StyleGuidePage from '@/app/(pages)/styleguide/page';
import SubmitReviewPage from '@/app/(pages)/submitreview/page';
import UpdatesPage from '@/app/(pages)/updates/page';
import { ContactCTA } from '@/app/elements/calloutlibrary';
import * as PixelatedComponents from '@pixelated-tech/components';
import { proxy } from '@/proxy';
import { GET as humansGET } from '@/app/humans.txt/route';
import { GET as securityGET } from '@/app/security.txt/route';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '..', '..');

const routeParams: Record<string, string | undefined> = {
	serviceArea: 'bluffton-sc',
	service: 'commercial',
	project: 'test-project',
};

vi.mock('next/navigation', () => ({
	useParams: () => routeParams,
}));

describe('Palmetto Epoxy coverage', () => {
	beforeEach(() => {
		resetMockState();
		resetFileDataState();
		resetContentfulMocks();
		routeParams.serviceArea = 'bluffton-sc';
		routeParams.service = 'commercial';
		routeParams.project = 'test-project';
		setPixelatedConfigOverride(undefined);
	});

	runCommonPageCoverage({
		appRoot,
		ignoredPageTypes: [
			'partners',
			'podcast',
			'resume',
			'workportfolio',
			'buzzwordbingo',
			'readme',
			'recipes',
		],
		ignoredCommonRoutes: ['socialtags'],
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
		footerAssertion: () => {
			expect(screen.getByText(/Palmetto Epoxy\. All rights reserved\./i)).not.toBeNull();
		},
		notFoundAssertion: () => {
			expect(document.getElementById('notfound-section')).not.toBeNull();
		},
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
		serviceAreaTestId: 'service-areas-intro',
		serviceAreaDetailTestId: 'service-area-detail-wrapper',
		serviceDetailTestId: 'service-detail-wrapper',
		initialServiceAreaSlug: 'bluffton-sc',
		initialServiceSlug: 'commercial',
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
				markdownTestId: 'markdown-container',
				loadingText: 'Loading...',
				errorText: 'Error: Calendar load failed',
			},
			{
				name: 'Updates',
				Component: UpdatesPage,
				markdownTestId: 'markdown-container',
				loadingText: 'Loading...',
				errorText: 'Error: Failed to load',
			},
			{
				name: 'Ad Calendar',
				Component: AdCalendarPage,
				markdownTestId: 'markdown-container',
				loadingText: 'Loading...',
				errorText: 'Error: Calendar load failed',
			},
		],
		render,
		screen,
		waitFor,
		setFileDataState,
		resetFileDataState,
	});


	it('renders Projects page with Contentful carousel cards', async () => {
		setPixelatedConfigOverride(pixelatedConfig);
		setContentfulEntriesResponse({
			items: [
				{
					sys: { contentType: { sys: { id: 'carouselCard' } } },
					fields: {
						title: 'Demo Project',
						description: 'Demo project description',
						image: 'https://example.com/demo.jpg',
					},
				},
			],
			includes: { Asset: [] },
		});
		setContentfulImagesResponse([{ image: 'https://example.com/demo.jpg', imageAlt: 'Demo image' }]);

		render(React.createElement(ProjectsPage));

		await waitFor(() => expect(document.getElementById('projects-section')).not.toBeNull());
	});

	it('renders Projects page when Contentful entry is a different content type', async () => {
		setPixelatedConfigOverride(pixelatedConfig);
		setContentfulEntriesResponse({
			items: [
				{
					sys: { contentType: { sys: { id: 'otherType' } } },
					fields: {
						title: 'Hidden Project',
						description: 'This card should be ignored',
						image: 'https://example.com/hidden.jpg',
					},
				},
			],
			includes: { Asset: [] },
		});
		setContentfulImagesResponse([{ image: 'https://example.com/hidden.jpg', imageAlt: 'Hidden image' }]);

		render(React.createElement(ProjectsPage));

		await waitFor(() => expect(document.getElementById('projects-section')).not.toBeNull());
	});

	it('renders Project Detail page from Contentful project data', async () => {
		setPixelatedConfigOverride(pixelatedConfig);
		setContentfulEntriesResponse({
			items: [
				{
					sys: { contentType: { sys: { id: 'carouselCard' } } },
					fields: {
						title: 'Test Project',
						description: 'Project detail description',
						carouselImages: [{ image: 'https://example.com/tile.jpg', imageAlt: 'Tile image' }],
					},
				},
			],
			includes: { Asset: [] },
		});
		setContentfulEntryResponse({
			fields: {
				title: 'Test Project',
				description: 'Project detail description',
				carouselImages: [{ image: 'https://example.com/tile.jpg', imageAlt: 'Tile image' }],
			},
		});
		setContentfulImagesResponse([{ image: 'https://example.com/tile.jpg', imageAlt: 'Tile image' }]);

		render(React.createElement(ProjectDetailPage));

		await waitFor(() => expect(document.getElementById('project-carousel-section')).not.toBeNull());
	});

	it('renders Project Detail page with no slug and falls back to project detail shell', async () => {
		setPixelatedConfigOverride(pixelatedConfig);
		routeParams.project = undefined;
		render(React.createElement(ProjectDetailPage));

		await waitFor(() => expect(document.getElementById('project-carousel-section')).not.toBeNull());
	});

	it('renders Submit Review page and sets install date input', async () => {
		setPixelatedConfigOverride(pixelatedConfig);
		render(React.createElement(SubmitReviewPage));

		await waitFor(() => expect(document.getElementById('submitreview-section')).not.toBeNull());
		await waitFor(() => expect(document.getElementById('installdate')).not.toBeNull());
		expect((document.getElementById('installdate') as HTMLInputElement).value).not.toBe('');
	});

	runPageSmokeTests([
		{
			name: 'Home',
			Component: Home,
			assertion: async () => {
				await waitFor(() => expect(screen.getByText(/Elevate your space/i)).not.toBeNull());
				expect(document.getElementById('home-reviews-section')).not.toBeNull();
			},
		},
		{
			name: 'About',
			Component: AboutPage,
			assertion: async () => {
				await waitFor(() => expect(document.getElementById('aboutus-section')).not.toBeNull());
			},
		},
		{
			name: 'Services',
			Component: ServicesPage,
			assertion: async () => {
				await waitFor(() => expect(document.getElementById('primary-services-section')).not.toBeNull());
			},
		},
		{
			name: 'Contact',
			Component: ContactPage,
			assertion: async () => {
				await waitFor(() => expect(document.getElementById('contactus-section')).not.toBeNull());
			},
		},
		{
			name: 'FAQs',
			Component: FaqsPage,
			assertion: async () => {
				await waitFor(() => expect(document.getElementById('faq-section')).not.toBeNull());
			},
		},
		{
			name: 'Projects',
			Component: ProjectsPage,
			assertion: async () => {
				await waitFor(() => expect(document.getElementById('projects-section')).not.toBeNull());
				await waitFor(() => expect(screen.getByText(/Projects/i)).not.toBeNull());
			},
		},
		{
			name: 'Flooring Estimator',
			Component: FlooringEstimatorPage,
			assertion: async () => {
				await waitFor(() => expect(document.getElementById('floor-estimator-section')).not.toBeNull());
			},
		},
		{
			name: 'Submit Review',
			Component: SubmitReviewPage,
			assertion: async () => {
				await waitFor(() => expect(screen.getByText(/Share your experience/i)).not.toBeNull());
				await waitFor(() => expect(document.getElementById('submitreview-section')).not.toBeNull());
			},
		},
		{
			name: 'Style Guide',
			Component: StyleGuidePage,
			assertion: async () => {
				await waitFor(() => expect(document.getElementById('colors-section')).not.toBeNull());
			},
		},
		{
			name: 'Ad Calendar',
			Component: AdCalendarPage,
		},
		{
			name: 'Beaufort Service Area',
			Component: BeaufortSCServiceArea,
		},
		{
			name: 'Bluffton Service Area',
			Component: BlufftonSCServiceArea,
		},
		{
			name: 'Hardeeville Service Area',
			Component: HardeevilleSCServiceArea,
		},
		{
			name: 'Hilton Head Service Area',
			Component: HiltonHeadSCServiceArea,
		},
		{
			name: 'Okatie Service Area',
			Component: OkatieSCServiceArea,
		},
		{
			name: 'Ridgeland Service Area',
			Component: RidgelandSCServiceArea,
		},
		{
			name: 'Commercial Service',
			Component: CommercialService,
		},
		{
			name: 'Concrete Polishing Service',
			Component: ConcretePolishingService,
		},
		{
			name: 'Driveway Coating Service',
			Component: DrivewayCoatingService,
		},
		{
			name: 'Epoxy Garage Floors Service',
			Component: EpoxyGarageFloorsService,
		},
		{
			name: 'Paver Sealing Service',
			Component: PaverSealingService,
		},
		{
			name: 'Residential Service',
			Component: ResidentialService,
		},
		{
			name: 'Resin Countertops Service',
			Component: ResinCountertopsService,
		},
	]);

	it('renders home page when config is unavailable', async () => {
		setPixelatedConfigOverride(null);
		render(<Home />);
		await waitFor(() => expect(screen.getByText(/Elevate your space/i)).not.toBeNull());
		setPixelatedConfigOverride(undefined);
	});

	it('renders the projects page loading fallback when config is unavailable', async () => {
		setPixelatedConfigOverride(null);
		render(<ProjectsPage />);
		await waitFor(() => expect(screen.getByTestId('loading-spinner')).not.toBeNull());
		setPixelatedConfigOverride(undefined);
	});

	it('renders the projects page with empty integrations config', async () => {
		setPixelatedConfigOverride({});
		render(<ProjectsPage />);
		await waitFor(() => expect(screen.getByText(/Projects/i)).not.toBeNull());
		setPixelatedConfigOverride(undefined);
	});

	it('renders the projects page with contentful cards', async () => {
		setContentfulEntriesResponse({
			items: [
				{
					sys: { contentType: { sys: { id: 'carouselCard' } } },
					fields: {
						image: { url: '/images/card.jpg', alt: 'Card image' },
						title: 'Test Project',
						description: 'Test description',
					},
				},
			],
			includes: { Asset: [{ sys: { id: 'img-1' } }] },
		});
		setContentfulImagesResponse([{ image: '/images/card.jpg', imageAlt: 'Card image' }]);

		render(<ProjectsPage />);
		await waitFor(() => expect(screen.getByTestId('callout')).not.toBeNull());
		expect(screen.getByText('Test Project')).not.toBeNull();
	});

	it('executes home page CTA navigation buttons', async () => {
		const originalLocation = window.location;
		delete (window as any).location;
		(window as any).location = { href: originalLocation.href };

		render(<Home />);
		fireEvent.click(screen.getByRole('button', { name: /Schedule an Estimate/i }));
		expect(window.location.href).toContain('/contact');
		fireEvent.click(screen.getByRole('button', { name: /Submit your Review/i }));
		expect(window.location.href).toContain('/submitreview');

		delete (window as any).location;
		(window as any).location = originalLocation;
	});

	it('renders the submit review form and initializes the install date', async () => {
		render(<SubmitReviewPage />);
		await waitFor(() => {
			const installdate = document.getElementById('installdate') as HTMLInputElement;
			expect(installdate).not.toBeNull();
			expect(installdate?.value).not.toBe('');
		});
	});

	it('renders submit review page when FormEngine does not render the form', async () => {
		const spy = vi.spyOn(PixelatedComponents, 'FormEngine').mockImplementation(() => null as any);
		render(<SubmitReviewPage />);
		await waitFor(() => expect(screen.getByText(/Share your experience/i)).not.toBeNull());
		spy.mockRestore();
	});

	it('renders the flooring estimate component with selected options and addons', async () => {
		render(<FlooringEstimate estimate={{
			projectType: 'epoxy_garage_floors',
			length: 10,
			width: 10,
			condition: 'heavy-wear',
			floorOptions: ['gloss'],
			flooringFinishes: [],
			addons: ['stem-wall', 'slip-resistant'],
			baseRate: 8,
			multiplier: 1.35,
			area: 100,
			subtotal: 1080,
			addonCost: 750,
			total: 1830,
		}} />);
		await waitFor(() => expect(screen.getByText(/Flooring Estimate/i)).not.toBeNull());
		expect(screen.getByText(/gloss/i)).not.toBeNull();
		expect(screen.getByText(/stem-wall, slip-resistant/i)).not.toBeNull();
		expect(screen.getByText(/Total: \$1830\.00/i)).not.toBeNull();
	});

	it('renders the flooring estimate component with no options or addons fallback', async () => {
		render(<FlooringEstimate estimate={{
			projectType: 'epoxy_garage_floors',
			length: 10,
			width: 10,
			condition: 'good-condition',
			floorOptions: [],
			flooringFinishes: [],
			addons: [],
			baseRate: 4,
			multiplier: 1,
			area: 100,
			subtotal: 400,
			addonCost: 0,
			total: 1200,
		}} />);
		await waitFor(() => expect(screen.getByText(/Flooring Estimate/i)).not.toBeNull());
		expect(screen.getByText(/Floor Options: None/i)).not.toBeNull();
		expect(screen.getByText(/Add-Ons: None/i)).not.toBeNull();
	});

	it('submits the flooring estimator with a non-epoxy service and unknown condition', async () => {
		const spy = vi.spyOn(PixelatedComponents, 'FormEngine').mockImplementation(({ onSubmitHandler }: any) => (
			<form data-testid="flooring-estimator-form" onSubmit={(event) => { event.preventDefault(); onSubmitHandler(event); }}>
				<label htmlFor="project-type">Project Type</label>
				<input id="project-type" name="project-type" defaultValue="driveway_coating" />
				<label htmlFor="length">Length in feet</label>
				<input id="length" name="length" defaultValue="5" />
				<label htmlFor="width">Width in feet</label>
				<input id="width" name="width" defaultValue="5" />
				<label htmlFor="flooring-condition">Flooring Condition</label>
				<input id="flooring-condition" name="flooring-condition" defaultValue="unknown-condition" />
				<label htmlFor="flooring-addons-unknown">Flooring Addons</label>
				<input type="checkbox" id="flooring-addons-unknown" name="flooring-addons" value="unknown-addon" defaultChecked />
				<button type="submit">Submit</button>
			</form>
		));

		render(<FlooringEstimatorPage />);
		fireEvent.submit(screen.getByTestId('flooring-estimator-form'));
		await waitFor(() => expect(screen.getByText(/Total: \$/i)).not.toBeNull());
		expect(screen.getByText(/Total: \$1200\.00/i)).not.toBeNull();
		spy.mockRestore();
	});

	it('submits the flooring estimator and clamps total to the minimum', async () => {
		const spy = vi.spyOn(PixelatedComponents, 'FormEngine').mockImplementation(({ onSubmitHandler }: any) => (
			<form data-testid="flooring-estimator-form" onSubmit={(event) => { event.preventDefault(); onSubmitHandler(event); }}>
				<label htmlFor="project-type">Project Type</label>
				<input id="project-type" name="project-type" defaultValue="epoxy_garage_floors" />
				<label htmlFor="length">Length in feet</label>
				<input id="length" name="length" defaultValue="5" />
				<label htmlFor="width">Width in feet</label>
				<input id="width" name="width" defaultValue="5" />
				<label htmlFor="flooring-condition">Flooring Condition</label>
				<input id="flooring-condition" name="flooring-condition" defaultValue="good-condition" />
				<label htmlFor="flooring-options-solid">Flooring Options</label>
				<input type="checkbox" id="flooring-options-solid" name="flooring-options" value="solid" defaultChecked />
				<label htmlFor="flooring-addons-slip">Flooring Addons</label>
				<input type="checkbox" id="flooring-addons-slip" name="flooring-addons" value="slip-resistant" defaultChecked />
				<button type="submit">Submit</button>
			</form>
		));

		render(<FlooringEstimatorPage />);
		fireEvent.submit(screen.getByTestId('flooring-estimator-form'));
		await waitFor(() => expect(screen.getByText(/Total: \$/i)).not.toBeNull());
		expect(screen.getByText(/Total: \$1200\.00/i)).not.toBeNull();
		spy.mockRestore();
	});

	it('renders contact CTA navigation button without error', async () => {
		const originalLocation = window.location;
		delete (window as any).location;
		(window as any).location = { href: originalLocation.href };

		render(<ContactCTA />);
		fireEvent.click(screen.getByRole('button', { name: /CONTACT US/i }));
		expect(window.location.href).toContain('/contact');

		delete (window as any).location;
		(window as any).location = originalLocation;
	});

	describe('Palmetto Epoxy project detail coverage', () => {
		it('renders the project detail page with contentful tile cards', async () => {
			setContentfulEntriesResponse({
				items: [
					{
						sys: { contentType: { sys: { id: 'carouselCard' } } },
						fields: {
							title: 'Test Project',
							description: 'Test description',
							carouselImages: [{ sys: { id: 'img-1' } }],
						},
					},
				],
				includes: { Asset: [{ sys: { id: 'img-1' } }] },
			});
			setContentfulEntryResponse({
				fields: {
					title: 'Test Project',
					description: 'Test description',
					carouselImages: [{ sys: { id: 'img-1' } }],
				},
			});
			setContentfulImagesResponse([{ image: '/images/project.jpg', imageAlt: 'Project image' }]);

			render(<ProjectDetailPage />);
			await waitFor(() => expect(document.getElementById('project-carousel-section')).not.toBeNull());
		});

		it('renders the project detail page loading fallback when config is unavailable', async () => {
			setPixelatedConfigOverride(null);
			render(<ProjectDetailPage />);
			await waitFor(() => expect(document.getElementById('loadingSpinner')).not.toBeNull());
			setPixelatedConfigOverride(undefined);
		});

		it('renders the project detail page without a route slug', async () => {
			routeParams.project = undefined;
			render(<ProjectDetailPage />);
			await waitFor(() => expect(document.getElementById('project-carousel-section')).not.toBeNull());
		});
	});
});
