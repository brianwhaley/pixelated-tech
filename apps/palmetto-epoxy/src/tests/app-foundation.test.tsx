import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks, resetContentfulMocks, resetPixelatedConfigOverride, setContentfulEntriesResponse, setContentfulEntryResponse } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks({
	GlobalErrorUI: ({ error }: any) => <div data-testid="global-error-ui">{error?.message}</div>,
	SkeletonLoading: () => <div data-testid="mock-loading" />,
	FourOhFour: () => <div data-testid="mock-404" />,
	capitalizeWords: (str: string) => str.replace(/\b\w/g, char => char.toUpperCase()),
}));

vi.mock('@pixelated-tech/components/server', () => ({
	getRouteByKey: () => ({ title: 'Home', description: 'desc', keywords: 'kw' }),
	generateMetaTags: () => <meta data-testid="mock-meta" />,
	WebsiteSchema: () => <div data-testid="mock-websiteschema" />,
	LocalBusinessSchema: () => <div data-testid="mock-businessschema" />,
	ServicesSchema: () => <div data-testid="mock-servicesschema" />,
	BreadcrumbListSchema: () => <div data-testid="mock-breadcrumb" />,
	PixelatedServerConfigProvider: ({ children }: any) => <>{children}</>,
	VisualDesignStyles: () => null,
	getFullPixelatedConfig: () => ({ contentful: {}, global: {}, siteInfo: { url: 'https://palmetto-epoxy.com' } }),
	getOriginFromNextHeaders: async () => 'https://palmetto-epoxy.com',
	buildSitemapConfig: () => ({ siteUrl: 'https://palmetto-epoxy.com' }),
	generateSitemap: async () => [{ url: 'https://palmetto-epoxy.com/sitemap.xml' }],
	Manifest: ({ siteInfo }: any) => ({ siteInfo }),
	handlePixelatedProxy: (req: any) => {
		const path = req.nextUrl.pathname + (req.nextUrl.search || '');
		const origin = req.nextUrl?.origin ?? new URL(req.url).origin;
		const url = req.nextUrl?.href ?? req.url;
		const requestHeaders = new Headers(req.headers);
		requestHeaders.set('x-path', path);
		requestHeaders.set('x-origin', String(origin));
		requestHeaders.set('x-url', String(url));
		return { request: { headers: requestHeaders } };
	},
	createWellKnownResponse: (type: string, req: any) => ({ type, url: req.url }),
}));

let currentPath = '/';
const currentOrigin = 'https://palmetto-epoxy.com';
let currentUrl = 'https://palmetto-epoxy.com/';

vi.mock('next/headers', () => ({
	headers: () => ({
		get: (key: string) => {
			if (key === 'x-path') return currentPath;
			if (key === 'x-origin') return currentOrigin;
			if (key === 'x-url') return currentUrl;
			return null;
		},
	}),
}));

import Layout from '@/app/layout';
import GlobalError from '@/app/global-error';
import Loading from '@/app/loading';
import manifest from '@/app/manifest';
import NotFound from '@/app/not-found';
import robots from '@/app/robots';
import SiteMapXML from '@/app/sitemap';
import StyleGuidePage from '@/app/(pages)/styleguide/page';
import { proxy } from '@/proxy';
import { GET as humansGET } from '@/app/humans.txt/route';
import { GET as securityGET } from '@/app/security.txt/route';

describe('Palmetto Epoxy app foundation', () => {
	beforeEach(() => {
		resetContentfulMocks();
		resetPixelatedConfigOverride();
	});

	it('renders route helpers and metadata utilities', async () => {
		const layoutElement = await Layout({ children: <div data-testid="layout-child" /> });
		expect(layoutElement).toBeTruthy();

		render(<GlobalError error={new Error('boom')} reset={() => {}} />);
		expect(screen.getByTestId('global-error-ui').textContent).toContain('boom');

		render(<Loading />);
		expect(screen.getByTestId('mock-loading')).toBeTruthy();

		render(<NotFound />);
		expect(screen.getByTestId('mock-404')).toBeTruthy();

		render(<StyleGuidePage />);
		expect(screen.getByTestId('mock-styleguideui')).toBeTruthy();

		expect(robots()).toEqual({
			rules: {
				userAgent: '*',
				allow: '/',
				disallow: '',
			},
			sitemap: 'https://palmetto-epoxy.com/sitemap.xml',
		});

		expect(manifest()).toEqual({ siteInfo: expect.any(Object) });
		expect(await SiteMapXML()).toEqual([{ url: 'https://palmetto-epoxy.com/sitemap.xml' }]);
	});

	it('renders project metadata fallback when project path is provided', async () => {
		setContentfulEntriesResponse({
			items: [
				{
					sys: { contentType: { sys: { id: 'carouselCard' } } },
					fields: {
						title: 'Test Project',
						description: 'A short description',
						keywords: ['epoxy', 'flooring'],
						carouselImages: [],
					},
				},
			],
			includes: { Asset: [] },
		});
		setContentfulEntryResponse({
			fields: {
				title: 'Test Project',
				description: 'A short description',
				keywords: ['epoxy', 'flooring'],
			},
		});

		currentPath = '/projects/test-project';
		currentUrl = 'https://palmetto-epoxy.com/projects/test-project';

		const layoutElement = await Layout({ children: <div data-testid="project-layout-child" /> });
		expect(layoutElement).toBeTruthy();
	});

	it('parses string contentful keywords and catches lookup failures', async () => {
		setContentfulEntriesResponse({
			items: [
				{
					sys: { contentType: { sys: { id: 'carouselCard' } } },
					fields: {
						title: 'Test Project',
						description: 'A short description',
						keywords: 'epoxy, flooring; project',
						carouselImages: [],
					},
				},
			],
			includes: { Asset: [] },
		});
		setContentfulEntryResponse({
			fields: {
				title: 'Test Project',
				description: 'A short description',
				keywords: 'epoxy, flooring; project',
				carouselImages: [],
			},
		});

		currentPath = '/projects/keyword-test';
		currentUrl = 'https://palmetto-epoxy.com/projects/keyword-test';

		const layoutElement = await Layout({ children: <div data-testid="project-layout-keywords" /> });
		expect(layoutElement).toBeTruthy();
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
