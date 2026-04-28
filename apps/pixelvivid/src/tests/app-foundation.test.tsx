import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { createPageComponentMocks, resetMockState } from '@/test/page-mocks';
import { headers } from 'next/headers';
import * as componentsServer from '@pixelated-tech/components/server';

vi.mock('@pixelated-tech/components', async () => {
	const actual = await vi.importActual<typeof import('@pixelated-tech/components')>('@pixelated-tech/components');
	return {
		__esModule: true,
		...actual,
		...createPageComponentMocks(),
	};
});
vi.mock('@pixelated-tech/components/server', async () => {
	const actual = await vi.importActual<typeof componentsServer>('@pixelated-tech/components/server');
	return {
		__esModule: true,
		...actual,
		createWellKnownResponse: vi.fn((type: string, req: any) => ({ type, url: req.url })),
		generateMetaTags: vi.fn(() => React.createElement('meta', { 'data-testid': 'meta-tags' }, null)),
		WebsiteSchema: () => null,
		LocalBusinessSchema: () => null,
		ServicesSchema: () => null,
		BreadcrumbListSchema: () => null,
		VisualDesignStyles: () => null,
		PixelatedServerConfigProvider: ({ children }: any) => React.createElement('div', { 'data-testid': 'server-config-provider' }, children),
		getFullPixelatedConfig: () => ({}),
		buildSitemapConfig: () => ({ sitemap: true }),
		generateSitemap: async () => [{ url: 'https://example.com/sitemap.xml' }],
		getOriginFromNextHeaders: async () => 'https://example.com',
		Manifest: vi.fn((opts: any) => ({ manifest: true, ...opts })),
	};
});

vi.mock('next/headers', () => ({
	headers: vi.fn(async () => new Headers({ 'x-path': '/', 'x-origin': 'https://example.com', 'x-url': 'https://example.com/' })),
}));

vi.mock('next/server', () => ({
	NextResponse: {
		next: (options: any) => ({ ...options, headers: new Headers() }),
	},
}));

import GlobalError from '@/app/global-error';
import Loading from '@/app/loading';
import manifest from '@/app/manifest';
import robots from '@/app/robots';
import SiteMapXML from '@/app/sitemap';
import NotFound from '@/app/not-found';
import siteConfig from '@/app/data/siteconfig.json';
import Footer from '@/app/elements/footer';
import Header from '@/app/elements/header';
import HeaderNav from '@/app/elements/headernav';
import Interactions from '@/app/elements/interactions';
import LayoutClient from '@/app/elements/layoutclient';
import Nav from '@/app/elements/nav';
import Privacy from '@/app/elements/privacy';
import Search from '@/app/elements/search';
import SocialTags from '@/app/elements/socialtags';
import Terms from '@/app/elements/terms';
import RootLayout from '@/app/layout';
import { proxy } from '@/proxy';
import { GET as humansGET } from '@/app/humans.txt/route';
import { GET as securityGET } from '@/app/security.txt/route';

describe('App shell coverage', () => {
	beforeEach(() => {
		resetMockState();
		vi.clearAllMocks();
	});

	it('renders the global error UI', () => {
		render(<GlobalError error={new Error('fail')} reset={() => undefined} />);
		expect(screen.getByTestId('global-error-ui').textContent).toContain('fail');
	});

	it('renders the loading component', () => {
		render(<Loading />);
		expect(screen.getByTestId('skeleton-loading')).not.toBeNull();
	});

	it('returns manifest metadata', () => {
		expect(manifest()).toHaveProperty('manifest', true);
	});

	it('generates robots metadata', async () => {
		const result = await robots();
		expect(result.sitemap).toContain('/sitemap.xml');
	});

	it('generates a sitemap object', async () => {
		const result = await SiteMapXML();
		expect(result).toEqual([{ url: 'https://example.com/sitemap.xml' }]);
	});

	it('renders the not-found page', () => {
		render(<NotFound />);
		expect(screen.getByTestId('four-oh-four')).not.toBeNull();
	});

	it('renders layout client without error', async () => {
		render(<LayoutClient />);
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(true).toBe(true);
	});

	it('renders header, header nav, and navigation sections', () => {
		render(<Header />);
		expect(screen.getByTestId('menu-accordion-button')).not.toBeNull();
		render(<HeaderNav />);
		expect(screen.getByTestId('menu-simple')).not.toBeNull();
		render(<Nav />);
		expect(screen.getByTestId('mock-menuaccordion')).not.toBeNull();
	});

	it('renders footer, search, privacy, terms, and interactions sections', async () => {
		render(<Footer />);
		expect(screen.getByTestId('google-analytics')).not.toBeNull();
		expect(screen.getByTestId('pixelated-footer')).not.toBeNull();
		render(<Search />);
		expect(screen.getByTestId('google-search')).not.toBeNull();
		render(<Privacy />);
		expect(screen.getByTestId('page-title-header')).not.toBeNull();
		render(<Terms />);
		expect(screen.getAllByText(/Terms of Service/i).length).toBeGreaterThan(0);
		render(<Interactions />);
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(true).toBe(true);
	});

	it('renders social tags section', () => {
		render(<SocialTags />);
		expect(screen.queryAllByTestId(/mock-/).length).toBeGreaterThan(0);
	});

	it('uses real siteconfig.json siteInfo and route data', () => {
		expect(siteConfig.siteInfo).toBeDefined();
		expect(typeof siteConfig.siteInfo.url).toBe('string');
		expect(siteConfig.siteInfo.url).toContain('http');
		expect(siteConfig.routes.some(route => route.path === '/')).toBe(true);
	});

	it('renders root layout with metadata and children', async () => {
		const root = await RootLayout({ children: React.createElement('div', { 'data-testid': 'child' }) });
		expect(root).toBeDefined();
		expect(root.props?.children).toBeTruthy();
	});

	it('renders root layout with trailing slash path and fallback metadata', async () => {
		vi.mocked(headers).mockResolvedValueOnce(new Headers({ 'x-path': '/contact/', 'x-origin': 'https://example.com' }));
		const root = await RootLayout({ children: React.createElement('div', { 'data-testid': 'child' }) });
		expect(root).toBeDefined();
		expect(root.props?.children).toBeTruthy();
	});

	it('proxies request headers correctly', () => {
		const result = proxy({
			nextUrl: { pathname: '/test', search: '?a=1', origin: 'https://example.com', href: 'https://example.com/test?a=1' },
			headers: new Headers({}),
			url: 'https://example.com/test?a=1',
		} as any);
		expect(result.request.headers.get('x-path')).toBe('/test?a=1');
		expect(result.request.headers.get('x-origin')).toBe('https://example.com');
	});

	it('proxies request headers with fallback url when href is unavailable', () => {
		const result = proxy({
			nextUrl: { pathname: '/test', search: '?a=1', origin: 'https://example.com', href: undefined },
			headers: new Headers({}),
			url: 'https://example.com/test?a=1',
		} as any);
		expect(result.request.headers.get('x-url')).toBe('https://example.com/test?a=1');
	});

	it('returns humans well-known response', async () => {
		const result = await humansGET({ url: 'https://example.com/humans.txt' } as any);
		expect(result).toEqual({ type: 'humans', url: 'https://example.com/humans.txt' });
	});

	it('returns security well-known response', async () => {
		const result = await securityGET({ url: 'https://example.com/security.txt' } as any);
		expect(result).toEqual({ type: 'security', url: 'https://example.com/security.txt' });
	});
});
