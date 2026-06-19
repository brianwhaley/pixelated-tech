/* eslint-disable pixelated/no-hardcoded-config-keys */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import path from 'path';
import { pathToFileURL } from 'url';

const mockSearchParams = new URLSearchParams('callbackUrl=/');
const mockSignIn = vi.fn(async () => true);
const mockSignOut = vi.fn(async () => Promise.resolve());
const mockUseSession = vi.fn(() => ({ data: null, status: 'unauthenticated' }));

const mockSmartFetch = vi.fn(async (url: unknown) => {
	const stringUrl = String(url);
	if (stringUrl.includes('/api/component-usage')) {
		return {
			ok: true,
			json: async () => ({
				components: ['component-a'],
				siteList: [{ name: 'site-a', localPath: '/site-a' }],
				usageMatrix: { 'component-a': { 'site-a': true } },
			}),
		};
	}
	if (stringUrl.includes('/api/sites')) {
		return { ok: true, json: async () => [] };
	}
	return { ok: true, json: async () => ({}) };
});

const mockRedirect = vi.fn();
const mockHeaderValues: Record<string, string | null> = {
	'x-path': '/login',
	'x-origin': 'https://admin.pixelated.tech',
	'x-url': 'https://admin.pixelated.tech/login',
	'host': 'admin.pixelated.tech',
};

const mockHeaders = {
	get: (name: string) => mockHeaderValues[name] || null,
};

vi.mock('next/navigation', () => ({
	__esModule: true,
	useSearchParams: () => mockSearchParams,
	redirect: (path: string) => mockRedirect(path),
}));

vi.mock('next/headers', () => ({
	__esModule: true,
	headers: () => mockHeaders,
}));

vi.mock('@pixelated-tech/components', async () => {
	return {
		__esModule: true,
		PageSection: ({ children }: any) => <div>{children}</div>,
		Loading: () => <div>Loading</div>,
		SkeletonLoading: () => <div>Skeleton</div>,
		ToggleLoading: () => null,
		Table: ({ children }: any) => <table>{children}</table>,
		smartFetch: (...args: any[]) => mockSmartFetch(...args),
		ConfigBuilder: ({ children }: any) => <div>{children}</div>,
		FormBuilder: ({ children }: any) => <div>{children}</div>,
		FormEngine: ({ children }: any) => <div>{children}</div>,
		PageBuilderUI: ({ children }: any) => <div>{children}</div>,
		Accordion: ({ children }: any) => <div>{children}</div>,
		StyleGuideUI: ({ children }: any) => <div>{children}</div>,
		SidePanel: ({ children }: any) => <div>{children}</div>,
		MenuAccordion: ({ menuItems }: any) => <div>{JSON.stringify(menuItems)}</div>,
		FourOhFour: ({ images }: any) => <div>404 {images?.length ?? 0}</div>,
		GlobalErrorUI: ({ error }: any) => <div>Error: {error?.message ?? 'unknown'}</div>,
		WebsiteSchema: ({ children }: any) => <>{children}</>,
		LocalBusinessSchema: ({ children }: any) => <>{children}</>,
		ServicesSchema: ({ children }: any) => <>{children}</>,
		usePixelatedConfig: () => ({ routes: [{ name: 'Home', path: '/' }, { name: 'Login', path: '/login' }], siteInfo: {} }),
	};
});

vi.mock('@pixelated-tech/components/adminclient', async () => {
	const make = (name: string) => ({ _children }: any) => <div data-testid={name}>{_children}</div>;
	const normalizeRoutePath = (value: string | undefined | null) => {
		const path = String(value ?? '/').trim();
		return path === '' ? '/' : path.replace(/\/+/g, '/');
	};
	const getAllowedAdminRoutes = (_email: string | undefined | null, routes: any[] = []) => {
		return routes.filter(route => typeof route?.path === 'string' && normalizeRoutePath(route.path) !== '/login');
	};
	const isRouteAllowedForID = (_email: string | undefined | null, _path: string, _config: any) => true;
	return {
		__esModule: true,
		BillingDashboard: make('BillingDashboard'),
		InvoiceView: make('InvoiceView'),
		Unauthorized: make('Unauthorized'),
		SiteHealthGit: make('SiteHealthGit'),
		SiteHealthUptime: make('SiteHealthUptime'),
		SiteHealthSecurity: make('SiteHealthSecurity'),
		SiteHealthOverview: make('SiteHealthOverview'),
		SiteHealthPerformance: make('SiteHealthPerformance'),
		SiteHealthAccessibility: make('SiteHealthAccessibility'),
		SiteHealthAxeCore: make('SiteHealthAxeCore'),
		SiteHealthDependencyVulnerabilities: make('SiteHealthDependencyVulnerabilities'),
		SiteHealthSEO: make('SiteHealthSEO'),
		SiteHealthGoogleAnalytics: make('SiteHealthGoogleAnalytics'),
		SiteHealthGoogleSearchConsole: make('SiteHealthGoogleSearchConsole'),
		SiteHealthOnSiteSEO: make('SiteHealthOnSiteSEO'),
		SiteHealthCloudwatch: make('SiteHealthCloudwatch'),
		normalizeRoutePath,
		getAllowedAdminRoutes,
		isRouteAllowedForID,
	};
});

vi.mock('@pixelated-tech/components/adminserver', () => ({
	checkUptimeHealth: async () => ({ success: true, uptime: [] }),
	performOnSiteSEOAnalysis: async () => ({ success: true, data: {} }),
	performCoreWebVitalsAnalysis: async () => ({ success: true, metrics: [] }),
	getGoogleAnalyticsData: async () => ({ success: true, data: {} }),
	getSearchConsoleData: async () => ({ success: true, data: {} }),
	getCloudwatchHealthCheckData: async () => ({ success: true, data: {} }),
	analyzeSecurityHealth: async () => ({ status: 'success', data: { summary: {}, vulnerabilities: [], dependencies: 0, totalDependencies: 0 } }),
	analyzeGitHealth: async () => ({ success: true, data: {} }),
	discoverComponentsFromLibrary: async () => [],
	analyzeComponentUsage: async () => ({ components: [] }),
	executeDeployment: async () => ({ success: true }),
	loadBillingData: () => ({
		sites: [{ name: 'site-a', billing: true, blogRss: 'https://example.com/feed' }],
		subscriptions: [{ plan: 'basic' }],
		paymentInfo: { card: '****' },
	}),
	compileInvoiceData: (_site: any, _billingCycle: string, _subscriptions: any, _paymentInfo: any, _posts: any, _socialReferrers: any) => ({ id: 'invoice-1', total: 100 }),
	getLiveBillingStats: async () => ({ posts: [], socialReferrers: [] }),
	dispatchInvoiceEmails: async (invoices: any[]) => [{ invoice: invoices[0].invoice, status: 'sent' }],
	generateInvoicePdfsForSites: async (targetSites: any[], billingMonth: string, previewOnly: boolean) => ({
		results: targetSites.map((site: any) => ({ site, billingMonth, previewOnly, success: true })),
	}),
	getNextAuthCredentials: () => ({ secret: 'test-secret' }),
	getGoogleOAuthCredentials: () => ({ clientId: 'g-id', clientSecret: 'g-secret' }),
}));

vi.mock('next-auth/react', () => ({
	useSession: () => mockUseSession(),
	signIn: mockSignIn,
	signOut: mockSignOut,
	SessionProvider: ({ children }: any) => <>{children}</>,
}));

const mockGetServerSession = vi.fn(async () => null);

vi.mock('next-auth', () => ({
	getServerSession: () => mockGetServerSession(),
}));

vi.mock('@/lib/authentication', () => ({
	authOptions: {},
}));

vi.mock('@pixelated-tech/components/server', () => ({
	getRouteByKey: () => ({ title: 'Test', description: 'Desc', keywords: ['a'] }),
	generateMetaTags: () => <meta />, 
	PageMetaTags: () => <meta data-testid="mock-page-meta-tags" />,
	WebsiteSchema: ({ children }: any) => <>{children}</>,
	LocalBusinessSchema: ({ children }: any) => <>{children}</>,
	ServicesSchema: ({ children }: any) => <>{children}</>,
	VisualDesignStyles: ({ children }: any) => <>{children}</>,
	PixelatedServerConfigProvider: ({ children }: any) => <>{children}</>,
	getFullPixelatedConfig: () => ({
		integrations: {
			nextAuth: { secret: 'test-secret' },
			google: { client_id: 'g-id', client_secret: 'g-secret' },
		},
	}),
	Manifest: () => ({ name: 'Pixelated Admin', short_name: 'Admin' }),
	generateMetaTags: () => <meta />, 
	PageMetaTags: () => <meta data-testid="mock-page-meta-tags" />,
	WebsiteSchema: ({ children }: any) => <>{children}</>,
	LocalBusinessSchema: ({ children }: any) => <>{children}</>,
	ServicesSchema: ({ children }: any) => <>{children}</>,
	VisualDesignStyles: ({ children }: any) => <>{children}</>,
	generateSitemap: async () => [{ url: 'https://admin.pixelated.tech/sitemap.xml' }],
	generateAiRecommendations: async () => ({ success: true, data: {} }),
	loadSitesConfig: async () => [{ name: 'test', url: 'https://example.com' }],
	listContentfulPages: async () => [{ id: 'page-1' }],
	deleteContentfulPage: async () => ({ success: true }),
	loadContentfulPage: async () => ({ id: 'page-1', content: '' }),
	saveContentfulPage: async () => ({ success: true }),
	getSiteConfig: async () => ({ siteName: 'test' }),
	getRuntimeEnvFromHeaders: () => ({ isTest: true }),
}));

const appPages = [
	['home', 'src/app/(pages)/(home)/page.tsx'],
	['login', 'src/app/(pages)/login/page.tsx'],
	['configbuilder', 'src/app/(pages)/configbuilder/page.tsx'],
	['contentful-migrate', 'src/app/(pages)/contentful-migrate/page.tsx'],
	['formbuilder', 'src/app/(pages)/formbuilder/page.tsx'],
	['newdeployment', 'src/app/(pages)/newdeployment/page.tsx'],
	['pagebuilder', 'src/app/(pages)/pagebuilder/page.tsx'],
	['component-usage', 'src/app/(pages)/component-usage/page.tsx'],
	['billing', 'src/app/(pages)/billing/page.tsx'],
	['site-health', 'src/app/(pages)/site-health/page.tsx'],
	['styleguide', 'src/app/(pages)/styleguide/page.tsx'],
	['loading', 'src/app/loading.tsx'],
	['not-found', 'src/app/not-found.tsx'],
	['global-error', 'src/app/global-error.tsx'],
];

async function importModule(relPath: string) {
	const filePath = pathToFileURL(path.resolve(__dirname, '../../', relPath)).href;
	return import(filePath);
}

describe('pixelated-admin app pages', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	for (const [name, relPath] of appPages) {
		it(`renders ${name} page without errors`, async () => {
			const mod = await importModule(relPath);
			const Page = mod.default;
			expect(Page).toBeTypeOf('function');
			const { container } = render(<Page error={new Error('test error')} reset={() => {}} />);
			expect(container).toBeTruthy();

			if (name === 'component-usage' || name === 'site-health') {
				await waitFor(() => {
					expect(mockSmartFetch).toHaveBeenCalled();
				});
			}
		});
	}
});

describe('pixelated-admin API routes', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it('returns sites JSON from sites route', async () => {
		const route = await importModule('src/app/api/sites/route.ts');
		const response = await route.GET();
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual([{ name: 'test', url: 'https://example.com' }]);
	});

	it('returns an error when AI recommendations API key is missing', async () => {
		const route = await importModule('src/app/api/ai/recommendations/route.ts');
		const response = await route.POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify({}) }));
		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({ success: false, error: 'Google Gemini API key not configured' });
	});

	it('returns AI recommendations when a valid API key is configured', async () => {
		vi.spyOn(await import('@pixelated-tech/components/server'), 'getFullPixelatedConfig').mockReturnValue({ integrations: { google: { api_key: 'gkey' } } });
		const route = await importModule('src/app/api/ai/recommendations/route.ts');
		const response = await route.POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify({}) }));
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ success: true, data: { success: true, data: {} } });
	});
});

describe('pixelated-admin extra coverage', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it('renders the Nav component and handles sign-out UI', async () => {
		const mod = await importModule('src/app/components/Nav.tsx');
		const Nav = mod.default;
		render(<Nav />);
		expect(screen.getByText('Not signed in')).toBeTruthy();
	});

	it('renders the Nav component in loading and authenticated states', async () => {
		mockUseSession.mockReturnValueOnce({ data: null, status: 'loading' });
		let mod = await importModule('src/app/components/Nav.tsx');
		let Nav = mod.default;
		render(<Nav />);
		expect(screen.getByText('Loading...')).toBeTruthy();

		mockUseSession.mockReturnValueOnce({ data: { user: { name: 'Test User', email: 'test@example.com' } }, status: 'authenticated' });
		mod = await importModule('src/app/components/Nav.tsx');
		Nav = mod.default;
		render(<Nav />);
		expect(screen.getByText('Test User')).toBeTruthy();
		fireEvent.click(screen.getByRole('button', { name: /Sign Out/i }));
		expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/login' });
	});

	it('calls signIn with normalized callbackUrl for login redirects', async () => {
		mockSearchParams.set('callbackUrl', '/login');
		const mod = await importModule('src/app/(pages)/login/page.tsx');
		const Page = mod.default;
		render(<Page />);
		fireEvent.click(screen.getByRole('button', { name: /Sign in with Google/i }));
		await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith('google', { callbackUrl: '/' }));
	});

	it('handles signIn rejection and restores the login button state', async () => {
		mockSearchParams.set('callbackUrl', '/');
		mockSignIn.mockRejectedValueOnce(new Error('fail'));
		const mod = await importModule('src/app/(pages)/login/page.tsx');
		const Page = mod.default;
		render(<Page />);
		const button = screen.getByRole('button', { name: /Sign in with Google/i });
		fireEvent.click(button);
		await waitFor(() => expect(mockSignIn).toHaveBeenCalled());
		expect(button).not.toBeDisabled();
	});

	it('renders Providers with children', async () => {
		const mod = await importModule('src/app/components/providers.tsx');
		const Providers = mod.Providers;
		render(
			<Providers>
				<div data-testid="provider-child" />
			</Providers>
		);
		expect(screen.getByTestId('provider-child')).toBeTruthy();
	});

	it('renders LayoutClient without errors', async () => {
		const mod = await importModule('src/app/components/layout-client.tsx');
		const LayoutClient = mod.default;
		render(<LayoutClient />);
		expect(screen.queryByTestId('layout-client')).toBeNull();
	});

	it('creates standardized error responses', async () => {
		const mod = await importModule('src/app/lib/route-utils.ts');
		const result = mod.createErrorResponse('site-a', 'problem');
		expect(result).toMatchObject({ success: false, siteName: 'site-a', error: 'problem' });
		expect(typeof result.timestamp).toBe('string');
	});

	it('renders RootLayout for login route without redirecting', async () => {
		mockRedirect.mockReset();
		const mod = await importModule('src/app/layout.tsx');
		const Layout = mod.default;
		const element = await Layout({ children: <div data-testid="layout-child" /> });
		expect(element.type).toBe('html');
		expect(mockRedirect).not.toHaveBeenCalled();
	});

	it('redirects /newdeployment to login when unauthenticated and not localhost', async () => {
		mockRedirect.mockReset();
		mockHeaders.get = (name: string) => {
			if (name === 'x-path') return '/newdeployment';
			if (name === 'x-origin') return 'https://admin.pixelated.tech';
			if (name === 'x-url') return 'https://admin.pixelated.tech/newdeployment';
			if (name === 'host') return 'admin.pixelated.tech';
			return null;
		};
		const mod = await importModule('src/app/layout.tsx');
		const Layout = mod.default;
		await Layout({ children: <div /> });
		expect(mockRedirect).toHaveBeenCalledWith('/login');
	});

	it('redirects protected routes to login when unauthenticated', async () => {
		mockRedirect.mockReset();
		mockHeaders.get = (name: string) => {
			if (name === 'x-path') return '/configbuilder';
			if (name === 'x-origin') return 'https://admin.pixelated.tech';
			if (name === 'x-url') return 'https://admin.pixelated.tech/configbuilder';
			if (name === 'host') return 'admin.pixelated.tech';
			return null;
		};
		const mod = await importModule('src/app/layout.tsx');
		const Layout = mod.default;
		await Layout({ children: <div /> });
		expect(mockRedirect).toHaveBeenCalledWith('/login');
	});

	it('RootLayout redirects /newdeployment to home when authenticated', async () => {
		mockRedirect.mockReset();
		mockGetServerSession.mockResolvedValue({ user: { name: 'Admin' } });
		mockHeaders.get = (name: string) => {
			if (name === 'x-path') return '/newdeployment';
			if (name === 'host') return 'admin.pixelated.tech';
			return null;
		};
		const mod = await importModule('src/app/layout.tsx');
		const Layout = mod.default;
		await Layout({ children: <div /> });
		expect(mockRedirect).toHaveBeenCalledWith('/');
	});

	it('RootLayout handles session check failure for /newdeployment', async () => {
		mockRedirect.mockReset();
		mockGetServerSession.mockRejectedValueOnce(new Error('Auth fail'));
		mockHeaders.get = (name: string) => {
			if (name === 'x-path') return '/newdeployment';
			if (name === 'host') return 'admin.pixelated.tech';
			return null;
		};
		const mod = await importModule('src/app/layout.tsx');
		const Layout = mod.default;
		await Layout({ children: <div /> });
		expect(mockRedirect).toHaveBeenCalledWith('/login');
	});

	it('renders billing page without errors', async () => {
		const mod = await importModule('src/app/(pages)/billing/page.tsx');
		const BillingPage = mod.default;
		render(<BillingPage />);
		expect(screen.getByTestId('BillingDashboard')).toBeTruthy();
	});

	it('renders the invoice print page with billing data', async () => {
		const mod = await importModule('src/app/(pages)/billing/invoice/[siteName]/[billingCycle]/page.tsx');
		const PrintInvoicePage = mod.default;
		const element = await PrintInvoicePage({ params: Promise.resolve({ siteName: 'site-a', billingCycle: '2026-06' }) });
		expect(element).toBeTruthy();
	});

	it('renders unauthorized page without errors', async () => {
		const mod = await importModule('src/app/unauthorized/page.tsx');
		const UnauthorizedPage = mod.default;
		render(<UnauthorizedPage />);
		expect(screen.getByTestId('Unauthorized')).toBeTruthy();
	});

	it('returns manifest JSON object', async () => {
		const mod = await importModule('src/app/manifest.tsx');
		const manifest = mod.default();
		expect(manifest).toHaveProperty('name');
	});

	it('returns robots metadata', async () => {
		const mod = await importModule('src/app/robots.tsx');
		const robots = mod.default();
		expect(robots).toHaveProperty('rules');
		expect(robots.rules).toHaveProperty('userAgent');
	});

	it('returns sitemap object', async () => {
		const mod = await importModule('src/app/sitemap.tsx');
		const sitemap = await mod.default();
		expect(Array.isArray(sitemap)).toBe(true);
	});

	it('returns billing config JSON from route', async () => {
		const route = await importModule('src/app/api/billing/config/route.ts');
		const response = await route.GET();
		expect(response.status).toBe(200);
		expect(await response.json()).toHaveProperty('sites');
	});

	it('validates payload for email invoice route', async () => {
		const route = await importModule('src/app/api/billing/email/route.ts');
		const response = await route.POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify({}) }));
		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ success: false, message: 'invoices array is required' });
	});

	it('emails invoices successfully', async () => {
		const route = await importModule('src/app/api/billing/email/route.ts');
		const invoices = [{ siteName: 'site-a', pdfPath: '/tmp/invoice.pdf', email: 'test@example.com', invoice: 'inv-1' }];
		const response = await route.POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ invoices }) }));
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ success: true, logs: [{ invoice: 'inv-1', status: 'sent' }] });
	});

	it('validates payload for generate invoice PDFs route', async () => {
		const route = await importModule('src/app/api/billing/generate/route.ts');
		const response = await route.POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify({}) }));
		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ success: false, message: 'sites array and billingMonth are required' });
	});

	it('generates invoice PDFs successfully', async () => {
		const route = await importModule('src/app/api/billing/generate/route.ts');
		const response = await route.POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ sites: [{ name: 'site-a' }], billingMonth: '2026-06', previewOnly: true }) }));
		expect(response.status).toBe(200);
		expect(await response.json()).toHaveProperty('results');
	});
});
