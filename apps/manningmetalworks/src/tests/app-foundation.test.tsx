import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
import routesJson from '@/app/data/routes.json';
import LayoutClient from '@/app/elements/layout-client';
import SocialTags from '@/app/elements/socialtags';
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
		expect(screen.getByTestId('global-error-ui')).toHaveTextContent('fail');
	});

	it('renders the loading component', () => {
		render(<Loading />);
		expect(screen.getByTestId('skeleton-loading')).toBeInTheDocument();
	});

	it('returns manifest metadata', () => {
		const result = manifest();
		expect(result).toHaveProperty('manifest', true);
	});

	it('generates robots metadata', () => {
		expect(robots()).toMatchObject({ sitemap: 'https://www.manningmetalworks.com/sitemap.xml' });
	});

	it('generates a sitemap object', async () => {
		const result = await SiteMapXML();
		expect(result).toEqual([{ url: 'https://example.com/sitemap.xml' }]);
	});

	it('renders the not-found page', () => {
		render(<NotFound />);
		expect(screen.getByTestId('mock-fourohfour')).toBeInTheDocument();
	});

	it('renders layout client without error', () => {
		render(<LayoutClient />);
		expect(true).toBe(true);
	});

	it('renders social tags section', () => {
		render(<SocialTags />);
		expect(screen.getAllByTestId('mock-callout').length).toBeGreaterThan(0);
	});

	it('uses real routes.json siteInfo and route data', () => {
		expect(routesJson.siteInfo).toBeDefined();
		expect(routesJson.siteInfo.url).toContain('manningmetalworks.com');
		expect(routesJson.routes.some(route => route.path === '/')).toBe(true);
	});

	it('renders root layout with metadata and children', async () => {
		const root = await RootLayout({ children: React.createElement('div', { 'data-testid': 'child' }) });
		render(root);
		await waitFor(() => expect(screen.getByTestId('child')).toBeInTheDocument());
		expect(document.querySelector('[data-testid="meta-tags"]')).toBeInTheDocument();
	});

	it('renders root layout with trailing slash path and fallback metadata', async () => {
		vi.mocked(headers).mockResolvedValueOnce(new Headers({ 'x-path': '/contact/', 'x-origin': 'https://example.com' }));
		const root = await RootLayout({ children: React.createElement('div', { 'data-testid': 'child' }) });
		render(root);
		await waitFor(() => expect(screen.getByTestId('child')).toBeInTheDocument());
		expect(document.querySelector('[data-testid="meta-tags"]')).toBeInTheDocument();
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
