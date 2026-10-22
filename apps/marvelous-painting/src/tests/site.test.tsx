import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { runCommonPageCoverage, runCommonElementCoverage, runCommonMarkdownPageCoverage, runCommonPodcastPageCoverage, runCommonServiceRouteCoverage, runPageSmokeTests } from '../../../../shared/test-utils/index.test-utils';
import { config as pixelatedConfig, createPageComponentMocks, mockState, resetMockState, resetFileDataState, setFileDataState, setPixelatedConfigOverride } from '@/tests/page-mocks';
import { headers } from 'next/headers';
import { getFullPixelatedConfig } from '@pixelated-tech/components/server';

vi.mock('@pixelated-tech/components', async () => ({
	__esModule: true,
	...(await vi.importActual('@pixelated-tech/components')),
	...createPageComponentMocks(),
}));

pixelatedConfig.siteInfo.url = 'https://example.com';
import Header from '@/app/elements/header';
import Nav from '@/app/elements/nav';
import Footer from '@/app/elements/footer';
import LayoutClient from '@/app/elements/layout-client';
import NotFound from '@/app/not-found';
import RootLayout from '@/app/layout';
import Home from '@/app/(pages)/(home)/page';
import BlogCalendarPage from '@/app/(pages)/blogcalendar/page';
import PodcastPage from '@/app/(pages)/podcast/page';
import ServiceAreasPage from '@/app/(pages)/service-areas/page';
import ServiceAreaDetailPage from '@/app/(pages)/service-areas/[serviceArea]/page';
import ServicesPage from '@/app/(pages)/services/page';
import ServiceDetailPage from '@/app/(pages)/services/[service]/page';
import TermsPage from '@/app/(pages)/terms/page';
import OurProcessPage from '@/app/(pages)/our-process/page';
import TestimonialsPage from '@/app/(pages)/testimonials/page';
import UpdatesPage from '@/app/(pages)/updates/page';
import { proxy } from '@/proxy';
import { GET as humansGET } from '@/app/humans.txt/route';
import { GET as securityGET } from '@/app/security.txt/route';

const getFirstSlug = (items: any[] | undefined) => {
	if (!Array.isArray(items) || items.length === 0) {
		return '';
	}
	return String(items[0]?.slug ?? items[0]?.name ?? '')
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '-');
};

const initialServiceAreaSlug = getFirstSlug(pixelatedConfig.siteInfo?.serviceAreas);
const initialServiceSlug = getFirstSlug(pixelatedConfig.siteInfo?.services);

const routeParams = {
	serviceArea: initialServiceAreaSlug,
	service: initialServiceSlug,
};

vi.mock('next/navigation', () => ({
	useParams: () => routeParams,
	useSearchParams: () => new URLSearchParams(''),
	usePathname: () => '/',
}));


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '..', '..');

describe('Pixelated Template site coverage', () => {
	beforeEach(() => {
		resetMockState();
		setPixelatedConfigOverride(undefined);
		routeParams.serviceArea = initialServiceAreaSlug;
		routeParams.service = initialServiceSlug;
	});

	afterEach(() => {
		resetMockState();
		resetFileDataState();
		setPixelatedConfigOverride(undefined);
	});

	runCommonPageCoverage({
		appRoot,
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
		render,
		screen,
		createElement: React.createElement,
		navAssertion: () => {
			expect(screen.getByTestId('menu-simple')).not.toBeNull();
		},
		headerAssertion: () => {
			expect(screen.getByTestId('menu-accordion-button')).not.toBeNull();
		},
		footerAssertion: () => {
			expect(screen.queryByText(/All rights reserved/i)).not.toBeNull();
		},
		notFoundAssertion: () => {
			expect(screen.getByTestId('four-oh-four')).not.toBeNull();
		},
	});

	runCommonMarkdownPageCoverage({
		pages: [
			{
				name: 'Updates',
				Component: UpdatesPage,
				markdownTestId: 'markdown',
				loadingText: 'Loading...',
				errorText: 'Error: File not found',
			},
		],
		render,
		screen,
		waitFor,
		setFileDataState,
		resetFileDataState,
	});

	runCommonPodcastPageCoverage({
		Component: PodcastPage,
		render,
		screen,
		waitFor,
		mockState,
		resetMockState,
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
		serviceAreaNotFoundText: 'Service area not found. Please return to the service areas list and choose another region.',
		serviceNotFoundText: 'Service not found. Please return to the services list and choose another option.',
		initialServiceAreaSlug,
		initialServiceSlug,
	});

	runPageSmokeTests([
		{
			name: 'Home',
			Component: Home,
			assertion: async () => {
				expect(screen.getByTestId('page-title-header')).not.toBeNull();
				expect(screen.getByText(/Marvelous Painting/)).not.toBeNull();
			},
		},
		{
			name: 'Services',
			Component: ServicesPage,
			assertion: async () => {
			 expect(screen.getByTestId('page-title-header')).not.toBeNull();
			 // page may render the title in multiple places; accept any matches
			 expect(screen.getAllByText(/Marvelous Painting Services/).length).toBeGreaterThan(0);
			},
		},
		{
			name: 'Terms',
			Component: TermsPage,
			assertion: async () => {
				setPixelatedConfigOverride(null);
				render(<TermsPage />);
				expect(screen.getByText(/Address not available/i)).not.toBeNull();
				expect(screen.getByText(/State not available/i)).not.toBeNull();
			},
		},
		{
			name: 'Our Process',
			Component: OurProcessPage,
			assertion: async () => {
				expect(screen.getByTestId('page-title-header')).toHaveTextContent('Our Process');
				expect(screen.getByText('Exterior painting process')).not.toBeNull();
				expect(screen.getByText('Interior painting process')).not.toBeNull();
				expect(screen.getAllByRole('listitem')).toHaveLength(10);
				expect(screen.getByRole('link', { name: 'Tell us about your project' })).toHaveAttribute('href', '/contact');
			},
		},
		{
			name: 'Testimonials',
			Component: TestimonialsPage,
			assertion: async () => {
				expect(screen.getByTestId('page-title-header')).toHaveTextContent('Testimonials');
				expect(screen.getByText(/Marvelous Painting just completed a painting project/i)).not.toBeNull();
				expect(screen.getByText(/Dennis and Gina Tupper/i)).not.toBeNull();
				expect(screen.getByRole('link', { name: 'gallery' })).toHaveAttribute('href', '/gallery');
				expect(screen.getByRole('link', { name: 'contact us' })).toHaveAttribute('href', '/contact');
			},
		},
	]);

	it('renders Header fallback when config is unavailable', () => {
		setPixelatedConfigOverride(null);
		render(<Header />);
		expect(screen.getByTestId('menu-accordion-button')).not.toBeNull();
	});

	it('renders Footer fallback when config is unavailable', async () => {
		vi.mocked(getFullPixelatedConfig).mockReturnValueOnce({ siteInfo: {} } as any);
		render(await Footer());
		expect(screen.getByText(/All rights reserved/i)).not.toBeNull();
		expect(screen.getByText(/Marvelous Painting/)).not.toBeNull();
	});

	it('proxies request headers with fallback origin when nextUrl.origin is unavailable', () => {
		const result = proxy({
			nextUrl: { pathname: '/test', search: '?a=1', origin: undefined, href: 'https://example.com/test?a=1' },
			headers: new Headers({}),
			url: 'https://example.com/test?a=1',
		} as any);
		expect(result.request.headers.get('x-origin')).toBe('https://example.com');
	});

	it('proxies request headers with fallback url when nextUrl.href is unavailable', () => {
		const result = proxy({
			nextUrl: { pathname: '/test', search: '?a=1', origin: 'https://example.com', href: undefined },
			headers: new Headers({}),
			url: 'https://example.com/test?a=1',
		} as any);
		expect(result.request.headers.get('x-url')).toBe('https://example.com/test?a=1');
	});

	it('renders Services page fallback when config is unavailable', () => {
		setPixelatedConfigOverride(null);
		render(<ServicesPage />);
		expect(screen.getByText(/Marvelous Painting\s+provides painting/i)).not.toBeNull();
	});

	it('renders Service Areas page fallback when config is unavailable', () => {
		setPixelatedConfigOverride(null);
		render(<ServiceAreasPage />);
		expect(screen.getByTestId('page-title-header')).not.toBeNull();
		expect(screen.getByText(/Marvelous Painting serves residential and commercial customers/i)).not.toBeNull();
	});


	describe('Pixelated Template explicit branch coverage', () => {
		it('renders Blog Calendar while loading', async () => {
			setFileDataState({ data: null, loading: true, error: null });
			render(<BlogCalendarPage />);
			expect((await screen.findByTestId('list-items')).textContent).toBe('0');
		});

		it('renders Blog Calendar when data loading fails', async () => {
			setFileDataState({ data: null, loading: false, error: 'File not found' });
			render(<BlogCalendarPage />);
			expect((await screen.findByTestId('list-items')).textContent).toBe('0');
		});

		it('renders Updates loading state', async () => {
			setFileDataState({ data: null, loading: true, error: null });
			render(<UpdatesPage />);
			expect(await screen.findByText(/Loading\.\.\./i)).toBeTruthy();
		});

		it('renders Updates error state', async () => {
			setFileDataState({ data: null, loading: false, error: 'File not found' });
			render(<UpdatesPage />);
			expect(await screen.findByText(/Error: File not found/i)).toBeTruthy();
		});

		it('renders Service Area detail not found branch', () => {
			routeParams.serviceArea = 'unknown-area';
			render(<ServiceAreaDetailPage />);
			expect(screen.getByText(/Service area not found\./i)).toBeTruthy();
		});

		it('renders Service detail not found branch', () => {
			routeParams.service = 'unknown-service';
			render(<ServiceDetailPage />);
			expect(screen.getByText(/Service not found\./i)).toBeTruthy();
		});
	});
});
