import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { createPageComponentMocks, resetMockState } from '@/test/page-mocks';
import { headers } from 'next/headers';
import * as componentsServer from '@pixelated-tech/components/server';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());
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
		next: (options: any) => options,
	},
}));

import GlobalError from '@/app/global-error';
import Loading from '@/app/loading';
import manifest from '@/app/manifest';
import robots from '@/app/robots';
import SiteMapXML from '@/app/sitemap';
import NotFound from '@/app/not-found';
import siteConfig from '@/app/data/siteconfig.json';
import LayoutClient from '@/app/elements/layout-client';
import Header from '@/app/elements/header';
import Footer from '@/app/elements/footer';
import Nav from '@/app/elements/nav';
import SocialTags from '@/app/elements/socialtags';
import RootLayout from '@/app/layout';
import { proxy } from '@/proxy';
import { GET as humansGET } from '@/app/humans.txt/route';
import { GET as securityGET } from '@/app/security.txt/route';

describe('Threemuses app shell coverage', () => {
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
		expect(screen.getByTestId('skeleton-loading')).toBeTruthy();
	});

	it('returns manifest metadata', () => {
		const result = manifest();
		expect(result).toHaveProperty('manifest', true);
	});

	it('generates robots metadata', () => {
		expect(robots()).toMatchObject({ sitemap: 'https://www.thethreemusesofbluffton.com/sitemap.xml' });
	});

	it('generates a sitemap object', async () => {
		const result = await SiteMapXML();
		expect(result).toEqual([{ url: 'https://example.com/sitemap.xml' }]);
	});

	it('renders the not-found page', () => {
		render(<NotFound />);
		expect(screen.getByTestId('mock-fourohfour')).toBeTruthy();
	});

	it('renders layout client without error', () => {
		render(<LayoutClient />);
		expect(true).toBe(true);
	});

	it('renders social tags section', () => {
		render(<SocialTags />);
		expect(screen.getAllByTestId('mock-callout').length).toBeGreaterThan(0);
	});

	it('renders the header component', () => {
		render(<Header />);
		expect(screen.getByTestId('mock-menuaccordionbutton')).toBeTruthy();
		expect(screen.getByTestId('mock-menuaccordion')).toBeTruthy();
	});

	it('renders the footer component', () => {
		render(<Footer />);
		expect(screen.getByTestId('mock-pixelatedfooter')).toBeTruthy();
	});

	it('renders the navigation component', () => {
		render(<Nav />);
		expect(screen.getByTestId('mock-menusimple')).toBeTruthy();
	});

	it('uses real siteconfig siteInfo and route data', () => {
		expect(siteConfig.siteInfo).toBeDefined();
		expect(siteConfig.siteInfo.url).toContain('thethreemusesofbluffton.com');
		expect(siteConfig.routes.some(route => route.path === '/')).toBe(true);
	});

	it('renders root layout with metadata and children', async () => {
		const root = await RootLayout({ children: React.createElement('div', { 'data-testid': 'child' }) });
		expect(root.type).toBe('html');
		const head = Array.isArray(root.props.children) ? root.props.children[1] : undefined;
		expect(head).toBeDefined();
		const headChildren = Array.isArray(head.props.children) ? head.props.children : [head.props.children];
		expect(headChildren.some((child: any) => child?.props?.['data-testid'] === 'meta-tags')).toBe(true);
	});

	it('renders root layout with trailing slash path and fallback metadata', async () => {
		vi.mocked(headers).mockResolvedValueOnce(new Headers({ 'x-path': '/contact/', 'x-origin': 'https://example.com', 'x-url': 'https://example.com/contact/' }));
		const root = await RootLayout({ children: React.createElement('div', { 'data-testid': 'child' }) });
		expect(root.type).toBe('html');
		const head = Array.isArray(root.props.children) ? root.props.children[1] : undefined;
		expect(head).toBeDefined();
		const headChildren = Array.isArray(head.props.children) ? head.props.children : [head.props.children];
		expect(headChildren.some((child: any) => child?.props?.['data-testid'] === 'meta-tags')).toBe(true);
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

	it('returns humans well-known response', async () => {
		const result = await humansGET({ url: 'https://example.com/humans.txt' } as any);
		expect(result).toEqual({ type: 'humans', url: 'https://example.com/humans.txt' });
	});

	it('returns security well-known response', async () => {
		const result = await securityGET({ url: 'https://example.com/security.txt' } as any);
		expect(result).toEqual({ type: 'security', url: 'https://example.com/security.txt' });
	});
});
