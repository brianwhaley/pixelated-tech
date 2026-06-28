import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, vi } from 'vitest';
import {
	render,
	screen,
	waitFor,
	act,
	cleanup,
	fireEvent,
	runCommonPageCoverage,
	runCommonElementCoverage,
	runPageSmokeTests,
} from '../../../../shared/test-utils/index.test-utils';
import React from 'react';
import * as serverComponents from '@pixelated-tech/components/server';
import {
	config as pixelatedConfig,
	mockState,
	setPixelatedConfigOverride,
	resetPixelatedConfigOverride,
	resetMockState,
	resetContentfulMocks,
	setContentfulEntriesResponse,
	createPageComponentMocks,
} from '@/tests/page-mocks';
import { headers } from 'next/headers';
import BlogPage from '@/app/(pages)/blog/page';

vi.mock('next/headers', () => ({
	headers: vi.fn(async () => new Headers({ 'host': 'www.pixelated.tech', 'x-path': '/', 'x-origin': 'https://www.pixelated.tech', 'x-url': 'https://www.pixelated.tech/' })),
}));

vi.mock('@pixelated-tech/components', async () => {
	const actual = await vi.importActual<typeof import('@pixelated-tech/components')>('@pixelated-tech/components');
	return {
		__esModule: true,
		...actual,
		...createPageComponentMocks(),
		EbayItemDetail: (props: any) => React.createElement('div', { 'data-testid': 'ebay-item-detail', ...props }, null),
		ContentfulItemDetail: (props: any) => React.createElement('div', { 'data-testid': 'contentful-item-detail', ...props }, null),
	};
});

vi.mock('next/navigation', () => ({
	useSearchParams: () => new URLSearchParams('?installed=true'),
	usePathname: () => '/',
	useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
	useParams: () => mockNavigationParams,
}));

let mockNavigationParams: Record<string, string> = {};

import Header from '@/app/elements/header';
import HeaderNav from '@/app/elements/headernav';
import Nav from '@/app/elements/nav';
import Footer from '@/app/elements/footer';
import LayoutClient from '@/app/elements/layoutclient';
import NotFoundElement from '@/app/not-found';
import RootLayout from '@/app/layout';
import Home from '@/app/(pages)/(home)/page';
import About from '@/app/(pages)/about/page';
import Cart from '@/app/(pages)/cart/page';
import Contact from '@/app/(pages)/contact/page';
import Customsgallery from '@/app/(pages)/customsgallery/page';
import Customsunglasses from '@/app/(pages)/customsunglasses/page';
import Faqs from '@/app/(pages)/faqs/page';
import Photography from '@/app/(pages)/photography/page';
import Preorder2026 from '@/app/(pages)/preorder-2026/page';
import Requests from '@/app/(pages)/requests/page';
import Returns from '@/app/(pages)/returns/page';
import Store from '@/app/(pages)/store/page';
import ServicesPage from '@/app/(pages)/services/page';
import ServiceAreasPage from '@/app/(pages)/service-areas/page';
import ServiceAreaDetailPage from '@/app/(pages)/service-areas/[serviceArea]/page';
import ServiceDetailPage from '@/app/(pages)/services/[service]/page';
import StyleGuide from '@/app/(pages)/styleguide/page';
import Subscribe from '@/app/(pages)/subscribe/page';
import Search from '@/app/elements/search';
import Privacy from '@/app/elements/privacy';
import Terms from '@/app/elements/terms';
import Interactions from '@/app/elements/interactions';
import { default as robots } from '@/app/robots';
import * as CalloutLibrary from '@/app/elements/calloutlibrary';
import { proxy } from '@/proxy';
import { GET as humansGET } from '@/app/humans.txt/route';
import { GET as securityGET } from '@/app/security.txt/route';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '..', '..');

const cloudinaryProductEnv = 'test_env';

const smokePages = [
	{
		name: 'Home',
		Component: Home,
		assertion: async () => {
			await waitFor(() => expect(screen.getByTestId('page-title-header')).not.toBeNull());
			expect(screen.getByTestId('contentful-reviews-carousel')).not.toBeNull();
		},
	},
	{
		name: 'About',
		Component: About,
	},
	{
		name: 'Cart',
		Component: Cart,
	},
	{
		name: 'Contact',
		Component: Contact,
	},
	{
		name: 'Customsgallery',
		Component: Customsgallery,
	},
	{
		name: 'Customsunglasses',
		Component: Customsunglasses,
	},
	{
		name: 'Faqs',
		Component: Faqs,
	},
	{
		name: 'Photography',
		Component: Photography,
	},
	{
		name: 'Preorder2026',
		Component: Preorder2026,
	},
	{
		name: 'Requests',
		Component: Requests,
	},
	{
		name: 'Returns',
		Component: Returns,
	},
	{
		name: 'Store',
		Component: Store,
	},
	{
		name: 'Services',
		Component: ServicesPage,
	},
	{
		name: 'ServiceAreas',
		Component: ServiceAreasPage,
	},
	{
		name: 'StyleGuide',
		Component: StyleGuide,
	},
	{
		name: 'Subscribe',
		Component: Subscribe,
	},
];

describe('PixelVivid coverage', () => {
	runCommonPageCoverage({
		appRoot,
		ignoredPageTypes: ['blog', 'blogcalendar', 'partners', 'podcast', 'projects', 'updates'],
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
		cloudinaryProductEnv,
		render,
		screen,
		createElement: React.createElement,
		navAssertion: () => {
			expect(screen.getByTestId('menu-accordion')).not.toBeNull();
		},
		headerAssertion: () => {
			expect(screen.getByTestId('menu-accordion-button')).not.toBeNull();
		},
		notFoundAssertion: () => {
			expect(screen.getByTestId('four-oh-four')).not.toBeNull();
		},
	});

	runPageSmokeTests(smokePages);

	afterEach(() => {
		cleanup();
	});

	describe('PixelVivid additional coverage', () => {
		it('renders header navigation through MenuSimple', () => {
			render(<HeaderNav />);
			expect(screen.getByTestId('menu-simple')).not.toBeNull();
		});

		it('renders search element', () => {
			render(<Search />);
			expect(screen.getByTestId('google-search')).not.toBeNull();
		});

		it('renders Blog page with posts', async () => {
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
			render(React.createElement(BlogPage));
			expect(await screen.findByTestId('blog-post-list')).not.toBeNull();
		});

		it('renders privacy page content', () => {
			render(<Privacy />);
			expect(screen.getByText(/Privacy Policy/i)).not.toBeNull();
		});

		it('renders terms page content', () => {
			render(<Terms />);
			expect(screen.getAllByText(/Terms of Service/i).length).toBeGreaterThan(0);
		});

		it('renders interactions without error', async () => {
			render(<Interactions />);
			await waitFor(() => expect(true).toBe(true));
		});

		it('renders a service area detail page for a known slug', async () => {
			mockNavigationParams = { serviceArea: 'us-nationwide-shipping' };
			render(<ServiceAreaDetailPage />);
			await waitFor(() => expect(screen.getAllByTestId('page-title-header').length).toBeGreaterThan(0));
		});

		it('renders a service detail page for a known slug', async () => {
			mockNavigationParams = { service: 'custom-upcycled-sunglasses' };
			render(<ServiceDetailPage />);
			await waitFor(() => expect(screen.getAllByTestId('page-title-header').length).toBeGreaterThan(0));
		});

		it('renders EbayItem numeric item branch without error', async () => {
			const { default: EbayItem } = await import('@/app/(pages)/store/[item]/page');
			await act(async () => {
				render(<EbayItem params={Promise.resolve({ item: '123456789012' } as any)} />);
			});
			await waitFor(() => expect(screen.getByTestId('ebay-item-detail')).not.toBeNull());
		});

		it('renders EbayItem contentful item branch without error', async () => {
			const { default: EbayItem } = await import('@/app/(pages)/store/[item]/page');
			await act(async () => {
				render(<EbayItem params={Promise.resolve({ item: 'custom-item' } as any)} />);
			});
			await waitFor(() => expect(screen.getByTestId('contentful-item-detail')).not.toBeNull());
		});

		it('renders RootLayout store item branch with ebay product metadata', async () => {
			vi.mocked(serverComponents.getEbayItem).mockResolvedValueOnce({ legacyItemId: '123456789012', title: 'Store Item', description: 'Test description' });
			vi.mocked(serverComponents.getEbayProductSchema).mockReturnValueOnce({ '@type': 'Product', name: 'Store Item' });
			vi.mocked(headers).mockResolvedValueOnce(new Headers({ 'x-path': '/store/123456789012', 'x-origin': 'https://example.com', 'x-url': 'https://example.com/store/123456789012' }));
			const root = await RootLayout({ children: React.createElement('div', { 'data-testid': 'child' }) });
			expect(root).toBeDefined();
			expect(root.props?.children).toBeTruthy();
		});

		it('renders RootLayout when eBay metadata fetch errors', async () => {
			vi.mocked(serverComponents.getEbayItem).mockRejectedValueOnce(new Error('Network fail'));
			vi.mocked(headers).mockResolvedValueOnce(new Headers({ 'x-path': '/store/123456789012', 'x-origin': 'https://example.com', 'x-url': 'https://example.com/store/123456789012' }));
			const root = await RootLayout({ children: React.createElement('div', { 'data-testid': 'child' }) });
			expect(root).toBeDefined();
			expect(root.props?.children).toBeTruthy();
		});

		it('renders robots route for localhost host', async () => {
			vi.mocked(headers).mockResolvedValueOnce(new Headers({ host: 'localhost' }));
			const result = await robots();
			expect(result.rules.disallow).toBe('/');
		});

		it('renders robots route for production host', async () => {
			vi.mocked(headers).mockResolvedValueOnce(new Headers({ host: 'www.pixelated.tech' }));
			const result = await robots();
			expect(result.rules.allow).toBe('/');
		});

		it('renders HeaderNav with fallback routes when config is unavailable', () => {
			setPixelatedConfigOverride(null);
			render(<HeaderNav />);
			expect(screen.getAllByTestId('menu-simple').length).toBeGreaterThan(0);
		});

		it('renders Contact page safely with default site info values', () => {
			setPixelatedConfigOverride({ siteInfo: { address: { streetAddress: '', addressLocality: '', addressRegion: '', postalCode: '' }, email: '', telephone: '' } });
			render(<Contact />);
			const headers = screen.getAllByTestId('page-title-header');
			expect(headers.some((header) => /Contact Us/i.test(header.textContent ?? ''))).toBe(true);
		});

		it('renders Home loading fallback without config', () => {
			setPixelatedConfigOverride(null);
			render(<Home />);
			expect(screen.getAllByTestId('loading').length).toBeGreaterThan(0);
		});

		it('renders Customsgallery loading fallback without config', () => {
			setPixelatedConfigOverride(null);
			render(<Customsgallery />);
			expect(screen.getAllByTestId('loading').length).toBeGreaterThan(0);
		});

		it('renders Customsunglasses loading fallback without config', () => {
			setPixelatedConfigOverride(null);
			render(<Customsunglasses />);
			expect(screen.getAllByTestId('loading').length).toBeGreaterThan(0);
		});

		it('renders Photography loading fallback without config', () => {
			setPixelatedConfigOverride(null);
			render(<Photography />);
			expect(screen.getAllByTestId('loading').length).toBeGreaterThan(0);
		});

		it('renders Store loading fallback without config', () => {
			setPixelatedConfigOverride(null);
			render(<Store />);
			expect(screen.getAllByTestId('loading').length).toBeGreaterThan(0);
		});

		it('renders Requests loading fallback without config', () => {
			setPixelatedConfigOverride(null);
			render(<Requests />);
			expect(screen.getAllByTestId('loading').length).toBeGreaterThan(0);
		});

		it('renders Requests page with custom requests entries', async () => {
			setContentfulEntriesResponse({
				items: [
					{
						sys: { contentType: { sys: { id: 'customRequest' } } },
						fields: {
							name: 'Test Request',
							source: 'Website',
							description: 'Test description',
							status: 'open',
							requestDate: new Date('2026-01-01'),
						},
					},
				],
			});
			render(<Requests />);
			await waitFor(() => expect(screen.getAllByTestId('table').length).toBeGreaterThan(0));
		});

		it('submits the preorder form and renders the success modal', async () => {
			render(<Preorder2026 />);
			const forms = screen.getAllByTestId('form-engine');
			const preorderForm = forms.find((form) => form.getAttribute('id') === 'preorder2026Form');
			expect(preorderForm).toBeDefined();
			fireEvent.submit(preorderForm!);
			await waitFor(() => expect(screen.getByTestId('preorder-modal')).not.toBeNull());
		});

		it('renders calloutlibrary homeDesign function', () => {
			render(<CalloutLibrary.homeDesign />);
			expect(screen.getByTestId('callout')).not.toBeNull();
		});

		it('renders EbayItem branch without config as null', async () => {
			setPixelatedConfigOverride(null);
			const { default: EbayItem } = await import('@/app/(pages)/store/[item]/page');
			await act(async () => {
				render(<EbayItem params={Promise.resolve({ item: '123456789012' } as any)} />);
			});
			expect(screen.queryByTestId('ebay-item-detail')).toBeNull();
		});

		afterEach(() => {
			resetPixelatedConfigOverride();
			resetMockState();
			resetContentfulMocks();
			cleanup();
		});
	});
});
