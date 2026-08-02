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
	runCommonMarkdownPageCoverage,
	runCommonServiceRouteCoverage,
	runPageSmokeTests,
} from '../../../../shared/test-utils/index.test-utils';
import {
	config as pixelatedConfig,
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
import ServiceAreasPage from '@/app/(pages)/service-areas/page';
import ServiceAreaDetailPage from '@/app/(pages)/service-areas/[serviceArea]/page';
import ServiceDetailPage from '@/app/(pages)/services/[service]/page';
import TermsPage from '@/app/(pages)/terms/page';
import UpdatesPage from '@/app/(pages)/updates/page';
import { proxy } from '@/proxy';
import { GET as humansGET } from '@/app/humans.txt/route';
import { GET as securityGET } from '@/app/security.txt/route';
import { contentfulValueToSlug } from '@pixelated-tech/components';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '..', '..');

const routeParams: Record<string, string | undefined> = {
	serviceArea: undefined,
	service: undefined,
};

const getFirstSlug = (items: any[] | undefined) => {
	const item = items?.[0];
	if (!item) return undefined;
	return contentfulValueToSlug({ value: item.slug ?? item.name });
};

const initialServiceAreaSlug = getFirstSlug(pixelatedConfig.siteInfo?.serviceAreas);
const initialServiceSlug = getFirstSlug(pixelatedConfig.siteInfo?.services);

vi.mock('next/navigation', () => ({
	useParams: () => routeParams,
}));

describe('Simple Day Concierge coverage', () => {
	beforeEach(() => {
		resetMockState();
		resetFileDataState();
		setContentfulEntriesResponse({ items: [], includes: { Asset: [] } });
		setContentfulImagesResponse([]);
		setPixelatedConfigOverride(undefined);
		routeParams.serviceArea = initialServiceAreaSlug;
		routeParams.service = initialServiceSlug;
	});

	runCommonPageCoverage({
		appRoot,
		ignoredPageTypes: [
			'partners',
			'podcast',
			'blog',
			'projects',
			'prospects',
			'resume',
			'workportfolio',
			'buzzwordbingo',
			'readme',
			'recipes',
			'blogcalendar',
		],
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

	runCommonMarkdownPageCoverage({
		pages: [
			{
				name: 'Updates',
				Component: UpdatesPage,
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
		initialServiceAreaSlug: initialServiceAreaSlug,
		initialServiceSlug: initialServiceSlug,
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
			name: 'Updates',
			Component: UpdatesPage,
			assertion: async () => {
				await waitFor(() => expect(screen.getByTestId('markdown')).not.toBeNull());
			},
		},
	]);

	describe('Simple Day Concierge additional coverage', () => {
		it('proxies request headers with empty search fallback', () => {
			const result = proxy({
				nextUrl: { pathname: '/test', search: '', origin: 'https://example.com', href: 'https://example.com/test' },
				headers: new Headers({}),
				url: 'https://example.com/test',
			} as any);
			expect(result.request.headers.get('x-path')).toBe('/test');
		});

		it('proxies request headers with fallback origin when origin is unavailable', () => {
			const result = proxy({
				nextUrl: { pathname: '/test', search: '?a=1', origin: undefined, href: 'https://example.com/test?a=1' },
				headers: new Headers({}),
				url: 'https://example.com/test?a=1',
			} as any);
			expect(result.request.headers.get('x-origin')).toBe('https://example.com');
		});

		it('proxies request headers with fallback url when href and url are unavailable', () => {
			const result = proxy({
				nextUrl: { pathname: '/test', search: '', origin: 'https://example.com', href: undefined },
				headers: new Headers({}),
				url: undefined,
			} as any);
			expect(result.request.headers.get('x-url')).toBe('https://example.com/test');
		});
		it('renders Home with missing service names and fallback index values', async () => {
			setPixelatedConfigOverride({
				siteInfo: {
					...pixelatedConfig.siteInfo,
					services: [{ image: 'https://example.com/test.jpg' }],
				},
			});
			render(<Home />);
			await waitFor(() => expect(screen.getAllByTestId('callout').length).toBeGreaterThan(0));
		});

		it('renders Terms page with valid config', async () => {
			resetPixelatedConfigOverride();
			render(<TermsPage />);
			await waitFor(() => expect(screen.getByText('Terms & Privacy')).not.toBeNull());
		});

		it('renders Home with no services configured', async () => {
			setPixelatedConfigOverride({ siteInfo: {} });
			render(<Home />);
			await waitFor(() => expect(screen.getByText('Our Services')).not.toBeNull());
		});

		it('renders Home with service name fallback', async () => {
			setPixelatedConfigOverride({ siteInfo: { services: [{ image: 'https://example.com/test.jpg' }] } });
			render(<Home />);
			await waitFor(() => expect(screen.getAllByTestId('callout').length).toBeGreaterThan(0));
		});

		it('renders a service area detail page when params are missing', async () => {
			setPixelatedConfigOverride(null);
			routeParams.serviceArea = undefined;
			render(<ServiceAreaDetailPage />);
			await waitFor(() => expect(screen.getByText('Service area not found. Please return to the service areas list and choose another region.')).not.toBeNull());
		});

		it('renders a service detail page when params are missing', async () => {
			setPixelatedConfigOverride(null);
			routeParams.service = undefined;
			render(<ServiceDetailPage />);
			await waitFor(() => expect(screen.getByText('Service not found. Please return to the services list and choose another option.')).not.toBeNull());
		});

		it('renders a service area detail page when serviceArea slug exists but serviceAreas use name fallback', async () => {
			setPixelatedConfigOverride({ siteInfo: { serviceAreas: [{ name: 'Mahwah NJ 07430' }] } });
			routeParams.serviceArea = 'mahwah-nj-07430';
			render(<ServiceAreaDetailPage />);
			await waitFor(() => expect(screen.getByTestId('serviceareadetailpage')).not.toBeNull());
		});

		it('renders a service detail page when service slug exists but services use name fallback', async () => {
			setPixelatedConfigOverride({ siteInfo: { services: [{ name: 'Errand Running and Logistics' }] } });
			routeParams.service = 'errand-running-and-logistics';
			render(<ServiceDetailPage />);
			await waitFor(() => expect(screen.getByTestId('servicedetailpage')).not.toBeNull());
		});

	});
});
