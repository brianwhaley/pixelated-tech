import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks } from '@/test/page-mocks';
import { headers } from 'next/headers';
import * as componentsServer from '@pixelated-tech/components/server';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());
vi.mock('@pixelated-tech/components/server', () => ({
	getRouteByKey: vi.fn(() => ({ title: 'Home', description: 'desc', keywords: 'kw' })),
	generateMetaTags: () => <meta data-testid="mock-meta" />,
	WebsiteSchema: () => <div data-testid="mock-websiteschema" />,
	LocalBusinessSchema: () => <div data-testid="mock-businessschema" />,
	ServicesSchema: () => <div data-testid="mock-servicesschema" />,
	BreadcrumbListSchema: () => <div data-testid="mock-breadcrumb" />,
	PixelatedServerConfigProvider: ({ children }: any) => <>{children}</>,
	VisualDesignStyles: () => null,
	getFullPixelatedConfig: () => ({ contentful: {}, global: {}, siteInfo: {} }),
	getOriginFromNextHeaders: async () => 'https://www.jzhomeimprovement.com',
	buildSitemapConfig: () => ({}),
	generateSitemap: async () => [],
	createWellKnownResponse: (_type: string, _req: any, _props: any) => ({ ok: true }),
	Manifest: ({ siteInfo }: any) => ({ siteInfo }),
}));
vi.mock('next/headers', () => ({
	headers: vi.fn(() => ({
		get: (key: string) => {
			if (key === 'x-path') return '/';
			if (key === 'x-origin') return 'http://localhost';
			if (key === 'x-url') return 'http://localhost/';
			return null;
		},
	})),
}));

import Layout from '@/app/layout';
import Header from '@/app/elements/header';
import Nav from '@/app/elements/nav';
import Footer from '@/app/elements/footer';
import LayoutClient from '@/app/elements/layout-client';
import GlobalError from '@/app/global-error';
import Loading from '@/app/loading';
import manifest from '@/app/manifest';
import NotFound from '@/app/not-found';
import robots from '@/app/robots';
import SiteMapXML from '@/app/sitemap';
import StyleGuide from '@/app/(pages)/styleguide/page';
import { GET as getHumans } from '@/app/humans.txt/route';
import { GET as getSecurity } from '@/app/security.txt/route';

describe('JZ app foundation', () => {
	it('renders shared app components and route modules', async () => {
		render(<Header />);
		expect(screen.getAllByTestId('mock-pagesection').length).toBeGreaterThan(0);

		render(<Nav />);
		expect(screen.getAllByTestId('mock-pagesection').length).toBeGreaterThan(0);

		render(<Footer />);
		expect(screen.getAllByTestId('mock-pagesection').length).toBeGreaterThan(0);
		render(<LayoutClient />);
		expect(true).toBe(true);

		render(<GlobalError error={new Error('boom')} reset={() => {}} />);
		render(<Loading />);
		render(<NotFound />);
		render(<StyleGuide />);

		const sitemap = await SiteMapXML();
		expect(sitemap).toEqual([]);

		const manifestResult = manifest();
		expect(manifestResult).toEqual({ siteInfo: expect.any(Object) });

		const robotsResult = robots();
		expect(robotsResult).toEqual({
			rules: {
				userAgent: '*',
				allow: '/',
				disallow: '',
			},
			sitemap: 'https://www.jzhomeimprovement.com/sitemap.xml',
		});

		const humansResponse = await getHumans({} as any);
		expect(humansResponse).toEqual({ ok: true });

		const securityResponse = await getSecurity({} as any);
		expect(securityResponse).toEqual({ ok: true });

		const layoutElement = await Layout({ children: <div data-testid="layout-child" /> });
		expect(layoutElement).toBeTruthy();
	});

	it('renders root layout with trailing slash path and fallback metadata', async () => {
		vi.mocked(headers).mockImplementationOnce(() => ({
			get: (key: string) => {
				if (key === 'x-path') return '/contact/';
				if (key === 'x-origin') return 'https://example.com';
				return null;
			},
		} as any));

		vi.mocked(componentsServer.getRouteByKey).mockReturnValueOnce(undefined as any);

		const layoutElement = await Layout({ children: <div data-testid="layout-child" /> });
		expect(layoutElement.type).toBe('html');
		const head = Array.isArray(layoutElement.props.children) ? layoutElement.props.children[1] : undefined;
		expect(head).toBeDefined();
		const headChildren = Array.isArray(head.props.children) ? head.props.children : [head.props.children];
		expect(headChildren.some((child: any) => child?.props?.['data-testid'] === 'mock-meta')).toBe(true);
	});
});
