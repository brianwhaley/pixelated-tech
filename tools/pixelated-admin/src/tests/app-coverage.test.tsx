/* eslint-disable pixelated/no-hardcoded-config-keys */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import path from 'path';
import { pathToFileURL } from 'url';

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

vi.mock('next/navigation', () => ({
	useSearchParams: () => new URLSearchParams('callbackUrl=/'),
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
	};
});

vi.mock('@pixelated-tech/components/adminclient', async () => {
	const make = (name: string) => ({ _children }: any) => <div data-testid={name}>{_children}</div>;
	return {
		__esModule: true,
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
}));

vi.mock('next-auth/react', () => ({
	useSession: () => ({ data: null, status: 'unauthenticated' }),
	signIn: vi.fn(),
	SessionProvider: ({ children }: any) => <>{children}</>,
}));

vi.mock('next-auth', () => ({
	getServerSession: async () => null,
}));

vi.mock('@/lib/auth', () => ({
	authOptions: {},
}));

vi.mock('@pixelated-tech/components/server', () => ({
	getRouteByKey: () => ({ title: 'Test', description: 'Desc', keywords: ['a'] }),
	generateMetaTags: () => <meta />, 
	WebsiteSchema: ({ children }: any) => <>{children}</>,
	LocalBusinessSchema: ({ children }: any) => <>{children}</>,
	ServicesSchema: ({ children }: any) => <>{children}</>,
	VisualDesignStyles: ({ children }: any) => <>{children}</>,
	PixelatedServerConfigProvider: ({ children }: any) => <>{children}</>,
	getFullPixelatedConfig: () => ({
		nextAuth: { secret: 'test-secret' },
		google: { client_id: 'g-id', client_secret: 'g-secret' },
	}),
	generateAiRecommendations: async () => ({ success: true, data: {} }),
	loadSitesConfig: async () => [{ name: 'test', url: 'https://example.com' }],
	listContentfulPages: async () => [{ id: 'page-1' }],
	deleteContentfulPage: async () => ({ success: true }),
	loadContentfulPage: async () => ({ id: 'page-1', content: '' }),
	saveContentfulPage: async () => ({ success: true }),
	getSiteConfig: async () => ({ siteName: 'test' }),
	getRuntimeEnvFromHeaders: () => ({ isTest: true }),
}));

vi.mock('next/headers', () => ({
	headers: () => ({
		get: (name: string) => {
			if (name === 'x-path') return '/login';
			if (name === 'x-origin') return 'https://admin.pixelated.tech';
			if (name === 'x-url') return 'https://admin.pixelated.tech/login';
			if (name === 'host') return 'admin.pixelated.tech';
			return null;
		},
	}),
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
	['site-health', 'src/app/(pages)/site-health/page.tsx'],
	['styleguide', 'src/app/(pages)/styleguide/page.tsx'],
	['loading', 'src/app/loading.tsx'],
	['not-found', 'src/app/not-found.tsx'],
	['global-error', 'src/app/global-error.tsx'],
];

async function importModule(relPath: string) {
	const filePath = pathToFileURL(path.join(process.cwd(), relPath)).href;
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
		vi.spyOn(await import('@pixelated-tech/components/server'), 'getFullPixelatedConfig').mockReturnValue({ google: { api_key: 'gkey' } });
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
		const mod = await importModule('src/app/layout.tsx');
		const Layout = mod.default;
		const element = await Layout({ children: <div data-testid="layout-child" /> });
		render(element);
		expect(screen.getByTestId('layout-child')).toBeTruthy();
	});
});
