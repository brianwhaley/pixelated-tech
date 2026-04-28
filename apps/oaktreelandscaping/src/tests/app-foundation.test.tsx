import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { createPageComponentMocks } from '@/test/page-mocks';
import BlogCalendar from '@/app/(pages)/blogcalendar/page';
import RequestsPage from '@/app/(pages)/prospects/page';

let currentPath = '/';
let routeMetadata: { title: string; description: string; keywords: string } | undefined = {
	title: 'Home',
	description: 'desc',
	keywords: 'kw',
};

const fileDataState: Record<string, any> = {
	'/data/blogcalendar.md': { data: 'Rendered markdown', loading: false, error: null },
	'/data/prospects.json': { data: [], loading: false, error: null },
};

vi.mock('@pixelated-tech/components', () => createPageComponentMocks({
	useFileData: (path: string) => fileDataState[path] ?? { data: null, loading: false, error: null },
	Table: ({ data }: any) => <div data-testid="mock-table">{data?.length}</div>,
	Markdown: ({ markdowndata }: any) => <div data-testid="mock-markdown">{markdowndata}</div>,
}));
vi.mock('@pixelated-tech/components/server', () => ({
	getRouteByKey: () => routeMetadata,
	generateMetaTags: () => <meta data-testid="mock-meta" />,
	WebsiteSchema: () => <div data-testid="mock-websiteschema" />,
	LocalBusinessSchema: () => <div data-testid="mock-businessschema" />,
	ServicesSchema: () => <div data-testid="mock-servicesschema" />,
	BreadcrumbListSchema: () => <div data-testid="mock-breadcrumb" />,
	PixelatedServerConfigProvider: ({ children }: any) => <>{children}</>,
	VisualDesignStyles: () => null,
	getFullPixelatedConfig: () => ({ contentful: {}, global: {}, siteInfo: {} }),
	getOriginFromNextHeaders: async () => 'https://www.oaktreelandscaping.com',
	buildSitemapConfig: () => ({}),
	generateSitemap: async () => [],
	createWellKnownResponse: (_type: string, _req: any, _props: any) => ({ ok: true }),
	Manifest: ({ siteInfo }: any) => ({ siteInfo }),
}));
vi.mock('next/headers', () => ({
	headers: () => ({
		get: (key: string) => {
			if (key === 'x-path') return currentPath;
			if (key === 'x-origin') return 'http://localhost';
			if (key === 'x-url') return 'http://localhost/';
			return null;
		},
	}),
}));

import Layout from '@/app/layout';
import Header from '@/app/elements/header';
import Nav from '@/app/elements/nav';
import Footer from '@/app/elements/footer';
import LayoutClient from '@/app/elements/layout-client';
import SocialTags from '@/app/elements/socialtags';
import UnderConstruction from '@/app/elements/underconstruction';
import GlobalError from '@/app/global-error';
import Loading from '@/app/loading';
import manifest from '@/app/manifest';
import NotFound from '@/app/not-found';
import robots from '@/app/robots';
import SiteMapXML from '@/app/sitemap';
import StyleGuide from '@/app/(pages)/styleguide/page';
import { GET as getHumans } from '@/app/humans.txt/route';
import { GET as getSecurity } from '@/app/security.txt/route';

describe('Oaktree app foundation', () => {
	it('renders shared infrastructure modules and route helpers', async () => {
		render(<Header />);
		render(<Nav />);
		render(<Footer />);
		render(<LayoutClient />);
		render(<SocialTags />);
		render(<UnderConstruction />);
		render(<GlobalError error={new Error('boom')} reset={() => {}} />);
		render(<Loading />);
		render(<NotFound />);
		render(<StyleGuide />);

		const layoutElement = await Layout({ children: <div data-testid="layout-child" /> });
		expect(layoutElement).toBeTruthy();

		const sitemap = await SiteMapXML();
		expect(sitemap).toEqual([]);
		expect(manifest()).toEqual({ siteInfo: expect.any(Object) });
		expect(robots()).toEqual({
			rules: { userAgent: '*', allow: '/', disallow: '' },
			sitemap: 'https://palmetto-epoxy.com/sitemap.xml',
		});
		expect(await getHumans({} as any)).toEqual({ ok: true });
		expect(await getSecurity({} as any)).toEqual({ ok: true });
	});

	it('renders fallback route metadata and path normalization in RootLayout', async () => {
		currentPath = '/services/';
		routeMetadata = undefined;
		const layoutElement = await Layout({ children: <div data-testid="layout-fallback-child" /> });
		expect(layoutElement).toBeTruthy();
		currentPath = '/';
		routeMetadata = { title: 'Home', description: 'desc', keywords: 'kw' };
	});

	it('renders BlogCalendar loading, error, and content states', async () => {
		fileDataState['/data/blogcalendar.md'] = { data: null, loading: true, error: null };
		const loadingElement = render(<BlogCalendar />);
		expect(loadingElement.container.textContent).toContain('Loading...');

		fileDataState['/data/blogcalendar.md'] = { data: null, loading: false, error: 'Read failure' };
		const errorElement = render(<BlogCalendar />);
		expect(errorElement.container.textContent).toContain('Error: Read failure');

		fileDataState['/data/blogcalendar.md'] = { data: 'Markdown content', loading: false, error: null };
		const contentElement = render(<BlogCalendar />);
		expect(contentElement.getByTestId('mock-markdown').textContent).toContain('Markdown content');
	});

	it('renders the prospects page with table and fallback no-data state', async () => {
		fileDataState['/data/prospects.json'] = { data: [], loading: false, error: null };
		const noDataRender = render(<RequestsPage />);
		expect(noDataRender.container.textContent).toContain('No custom requests found.');

		fileDataState['/data/prospects.json'] = { data: [{ company: 'Acme', 'street address': '123 Main', city: 'Nowhere', state: 'SC', zip: '29999', emails: 'test@acme.com', 'first name': 'Jane', 'last name': 'Doe' }], loading: false, error: null };
		const dataRender = render(<RequestsPage />);
		expect(dataRender.getByTestId('mock-table').textContent).toBe('1');
	});
});
