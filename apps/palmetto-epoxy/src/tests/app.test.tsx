import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { createPageComponentMocks, resetMockState, setContentfulEntriesResponse, setContentfulEntryResponse } from '@/tests/page-mocks';
import { headers } from 'next/headers';
import * as components from '@pixelated-tech/components';
import * as componentsServer from '@pixelated-tech/components/server';

function findReactElementByTypeName(node: any, typeName: string): boolean {
	if (node == null) return false;
	const nodes = Array.isArray(node) ? node : [node];
	for (const item of nodes) {
		if (!item || typeof item !== 'object') continue;
		const itemType = item.type;
		const actualType = typeof itemType === 'function' ? itemType.name : itemType;
		if (actualType === typeName) return true;
		if (findReactElementByTypeName(item.props?.children, typeName)) return true;
	}
	return false;
}

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());
vi.mock('@pixelated-tech/components/server', async () => {
	const actual = await vi.importActual<typeof componentsServer>('@pixelated-tech/components/server');
	return {
		__esModule: true,
		...actual,
		createWellKnownResponse: vi.fn((type: string, req: any) => ({ type, url: req.url })),
		generateMetaTags: vi.fn(() => React.createElement('meta', { 'data-testid': 'meta-tags' }, null)),
		PageMetaTags: function PageMetaTags() { return React.createElement('meta', { 'data-testid': 'page-meta-tags' }, null); },
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
		next: (options: any) => ({
			...options,
			request: options?.request ?? {
				headers: options?.request?.headers ?? new Headers(),
			},
			headers: new Headers(),
		}),
	},
}));

import RootLayout from '@/app/layout';
import { proxy } from '@/proxy';
import { GET as humansGET } from '@/app/humans.txt/route';
import { GET as securityGET } from '@/app/security.txt/route';
import { config as pixelatedConfig } from '@/tests/page-mocks';


describe('Palmetto Epoxy app coverage', () => {
	beforeEach(() => {
		resetMockState();
		vi.clearAllMocks();
	});

	it('renders root layout with metadata and children', async () => {
		const root = await RootLayout({ children: React.createElement('div', { 'data-testid': 'child' }) });
		expect(root.type).not.toBeUndefined();
		const content = root.props?.children ?? root;
		expect(findReactElementByTypeName(content, 'PageMetaTags')).toBe(true);
	});

	it('renders root layout with trailing slash path and fallback metadata', async () => {
		vi.mocked(headers).mockResolvedValueOnce(new Headers({ 'x-path': '/projects/', 'x-origin': 'https://example.com' }));
		const root = await RootLayout({ children: React.createElement('div', { 'data-testid': 'child' }) });
		const content = root.props?.children ?? root;
		expect(findReactElementByTypeName(content, 'PageMetaTags')).toBe(true);
	});

	it('renders root layout when project slug decoding fails and falls back gracefully', async () => {
		vi.mocked(headers).mockResolvedValueOnce(new Headers({ 'x-path': '/projects/%E0', 'x-origin': 'https://example.com' }));
		const root = await RootLayout({ children: React.createElement('div', { 'data-testid': 'child' }) });
		const content = root.props?.children ?? root;
		expect(findReactElementByTypeName(content, 'PageMetaTags')).toBe(true);
	});

	it('renders root layout with x-url fallback metadata when origin is missing', async () => {
		vi.mocked(headers).mockResolvedValueOnce(new Headers({ 'x-path': '/contact', 'x-url': 'https://example.com/contact' }));
		const root = await RootLayout({ children: React.createElement('div', { 'data-testid': 'child' }) });
		const content = root.props?.children ?? root;
		expect(findReactElementByTypeName(content, 'PageMetaTags')).toBe(true);
	});

	it('renders root layout with unknown path fallback metadata', async () => {
		vi.mocked(headers).mockResolvedValueOnce(new Headers({ 'x-path': '/unknown', 'x-origin': 'https://example.com' }));
		const root = await RootLayout({ children: React.createElement('div', { 'data-testid': 'child' }) });
		const content = root.props?.children ?? root;
		expect(findReactElementByTypeName(content, 'PageMetaTags')).toBe(true);
	});

	it('renders root layout for a project route with contentful metadata', async () => {
		setContentfulEntriesResponse({
			items: [
				{
					sys: { contentType: { sys: { id: 'carouselCard' } } },
					fields: {
						title: 'Test Project',
						description: 'Test description',
						keywords: 'test, project',
					},
				},
			],
			includes: { Asset: [] },
		});
		setContentfulEntryResponse({
			fields: {
				title: 'Test Project',
				description: 'Test description',
				keywords: 'test, project',
			},
		});
		vi.mocked(headers).mockResolvedValueOnce(new Headers({ 'x-path': '/projects/test-project', 'x-origin': 'https://example.com' }));
		const root = await RootLayout({ children: React.createElement('div', { 'data-testid': 'child' }) });
		const content = root.props?.children ?? root;
		expect(findReactElementByTypeName(content, 'PageMetaTags')).toBe(true);
	});

	it('renders root layout for a project route with contentful keywords array', async () => {
		setContentfulEntriesResponse({
			items: [
				{
					sys: { contentType: { sys: { id: 'carouselCard' } } },
					fields: {
						title: 'Test Project',
						description: 'Test description',
						keywords: ['test', 'project'],
					},
				},
			],
			includes: { Asset: [] },
		});
		setContentfulEntryResponse({
			fields: {
				title: 'Test Project',
				description: 'Test description',
				keywords: ['test', 'project'],
			},
		});
		vi.mocked(headers).mockResolvedValueOnce(new Headers({ 'x-path': '/projects/test-project', 'x-origin': 'https://example.com' }));
		const root = await RootLayout({ children: React.createElement('div', { 'data-testid': 'child' }) });
		const content = root.props?.children ?? root;
		expect(findReactElementByTypeName(content, 'PageMetaTags')).toBe(true);
	});

	it('renders root layout fallback metadata when Contentful entry is unavailable', async () => {
		setContentfulEntriesResponse({
			items: [
				{
					sys: { contentType: { sys: { id: 'carouselCard' } } },
					fields: {
						title: 'Test Project',
						description: 'Test description',
						keywords: ['test', 'project'],
					},
				},
			],
			includes: { Asset: [] },
		});
		setContentfulEntryResponse(null);
		vi.mocked(headers).mockResolvedValueOnce(new Headers({ 'x-path': '/projects/test-project', 'x-origin': 'https://example.com' }));
		const root = await RootLayout({ children: React.createElement('div', { 'data-testid': 'child' }) });
		const content = root.props?.children ?? root;
		expect(findReactElementByTypeName(content, 'PageMetaTags')).toBe(true);
	});

	it('renders root layout fallback metadata when Contentful lookup throws', async () => {
		vi.spyOn(components, 'getContentfulEntriesByType').mockRejectedValueOnce(new Error('Contentful failure'));
		vi.mocked(headers).mockResolvedValueOnce(new Headers({ 'x-path': '/projects/test-project', 'x-origin': 'https://example.com' }));
		const root = await RootLayout({ children: React.createElement('div', { 'data-testid': 'child' }) });
		const content = root.props?.children ?? root;
		expect(findReactElementByTypeName(content, 'PageMetaTags')).toBe(true);
	});

	it('renders root layout for a project route with empty decoded slug and fallback metadata', async () => {
		setContentfulEntriesResponse({
			items: [
				{
					sys: { contentType: { sys: { id: 'carouselCard' } } },
					fields: {
						title: '',
						description: '',
						keywords: '',
					},
				},
			],
			includes: { Asset: [] },
		});
		setContentfulEntryResponse({
			fields: {
				title: '',
				description: '',
				keywords: '',
			},
		});
		vi.mocked(headers).mockResolvedValueOnce(new Headers({ 'x-path': '/projects/%20', 'x-origin': 'https://example.com' }));
		const root = await RootLayout({ children: React.createElement('div', { 'data-testid': 'child' }) });
		const content = root.props?.children ?? root;
		expect(findReactElementByTypeName(content, 'PageMetaTags')).toBe(true);
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

	it('uses real pixelated.config.json siteInfo and route data', () => {
		expect(pixelatedConfig.siteInfo).toBeDefined();
		expect(pixelatedConfig.siteInfo.url).toEqual(expect.any(String));
		expect(pixelatedConfig.routes.some((route: any) => route.path === '/')).toBe(true);
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
