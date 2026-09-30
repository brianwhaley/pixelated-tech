import path from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { describe, expect, vi } from 'vitest';
import {
	render,
	screen,
	waitFor,
	runCommonPageCoverage,
	runCommonElementCoverage,
	runCommonBlogPageCoverage,
	runCommonMarkdownPageCoverage,
	runCommonServiceRouteCoverage,
	runCommonGoogleReviewsCoverage,
	runPageSmokeTests,
} from '../../../../shared/test-utils/index.test-utils';
import {
	config as pixelatedConfig,
	resetMockState,
	mockState,
	setFileDataState,
	resetFileDataState,
	setPixelatedConfigOverride,
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
import AboutUsPage from '@/app/(pages)/about-us/page';
import BlogPage from '@/app/(pages)/blog/page';
import UpdatesPage from '@/app/(pages)/updates/page';
import ContactUsPage from '@/app/(pages)/contact-us/page';
import FaqsPage from '@/app/(pages)/faqs/page';
import GalleryPage from '@/app/(pages)/gallery/page';
import ServicesPage from '@/app/(pages)/services/page';
import StyleGuidePage from '@/app/(pages)/styleguide/page';
import ServiceAreasPage from '@/app/(pages)/service-areas/page';
import ServiceAreaDetailPage from '@/app/(pages)/service-areas/[serviceArea]/page';
import ServiceDetailPage from '@/app/(pages)/services/[service]/page';
import { proxy } from '@/proxy';
import { GET as humansGET } from '@/app/humans.txt/route';
import { GET as securityGET } from '@/app/security.txt/route';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '..', '..');

const routeParams: Record<string, string | undefined> = {
	serviceArea: 'morris-plains-nj',
	service: 'precision-metal-fabrication',
};

vi.mock('next/navigation', () => ({
	useParams: () => routeParams,
}));

describe('Manning Metalworks coverage', () => {
	runCommonPageCoverage({
		appRoot,
		ignoredPageTypes: ['partners', 'podcast'],
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
		headerAssertion: () => {
			expect(screen.getByTestId('hero')).toBeTruthy();
		},
		footerAssertion: () => {
			expect(screen.getByTestId('business-footer')).toBeTruthy();
		},
		notFoundAssertion: () => {
			expect(screen.getByTestId('four-oh-four')).toBeTruthy();
		},
	});

	runPageSmokeTests([
		{
			name: 'Home',
			Component: Home,
			assertion: async () => {
				await waitFor(() => expect(screen.getByTestId('page-title-header')).toBeTruthy());
			},
		},
		{
			name: 'About Us',
			Component: AboutUsPage,
			assertion: async () => {
				await waitFor(() => expect(screen.getByTestId('page-title-header')).toBeTruthy());
			},
		},
		{
			name: 'Services',
			Component: ServicesPage,
			assertion: async () => {
				await waitFor(() => expect(screen.getByTestId('services')).toBeTruthy());
			},
		},
		{
			name: 'Contact Us',
			Component: ContactUsPage,
			assertion: async () => {
				await waitFor(() => expect(screen.getByTestId('page-title-header')).toBeTruthy());
			},
		},
		{
			name: 'FAQs',
			Component: FaqsPage,
			assertion: async () => {
				await waitFor(() => expect(screen.getByTestId('faq')).toBeTruthy());
			},
		},
		{
			name: 'Gallery',
			Component: GalleryPage,
			assertion: async () => {
				await waitFor(() => expect(screen.getByTestId('page-title-header')).toBeTruthy());
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
	});

	runCommonGoogleReviewsCoverage({
		Component: AboutUsPage,
		render,
		screen,
		waitFor,
		setPixelatedConfigOverride,
	});

	it('renders Header with fallback routes when config is unavailable', () => {
		setPixelatedConfigOverride(null);
		render(<Header />);
		expect(screen.getByTestId('hero')).toBeTruthy();
	});

	it('normalizes a trailing slash before rendering Footer', async () => {
		vi.mocked(headers).mockResolvedValueOnce(new Headers({ 'x-path': '/contact/' }));
		render(await Footer());
		expect(screen.getByTestId('business-footer')).toBeTruthy();
	});

});
