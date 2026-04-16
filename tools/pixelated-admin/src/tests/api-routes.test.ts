/* eslint-disable pixelated/no-hardcoded-config-keys */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';
import { pathToFileURL } from 'url';

const mockNextAuthHandler = vi.fn(async (_req: Request, _context: any) => {
	return new Response('auth handler', {
		status: 302,
		headers: {
			Location: 'https://accounts.google.com/o/oauth2/v2/auth?redirect_uri=http://localhost/api/auth/callback/google',
		},
	});
});

vi.mock('next-auth', () => ({
	__esModule: true,
	default: () => mockNextAuthHandler,
}));

vi.mock('@/lib/auth', () => ({
	authOptions: {},
}));

vi.mock('@pixelated-tech/components/server', () => ({
	createWellKnownResponse: (type: string, _req: any) => new Response(`well-known ${type}`, { status: 200, headers: { 'Content-Type': 'text/plain' } }),
	getFullPixelatedConfig: () => ({
		nextAuth: { secret: 'test-secret' },
		google: { client_id: 'g-id', client_secret: 'g-secret', api_key: 'gkey' },
		googleAnalytics: { serviceAccountKey: 'key' },
		contentful: { spaceId: 'space', environmentId: 'master', accessToken: 'token' },
	}),
	loadSitesConfig: async () => [{ name: 'test', url: 'https://example.com', localPath: '/site-a' }],
	listContentfulPages: async () => [{ id: 'page-1' }],
	generateAiRecommendations: async () => ({ results: ['yes'] }),
	deleteContentfulPage: async () => ({ success: true }),
	loadContentfulPage: async () => ({ id: 'page-1', content: 'ok' }),
	saveContentfulPage: async () => ({ success: true }),
	getSiteConfig: async () => ({
		name: 'test',
		siteName: 'test',
		url: 'https://example.com',
		localPath: '/site-a',
		healthCheckId: 'hc-123',
		region: 'us-east-1',
		repo: 'repo',
		ga4PropertyId: 'ga4-123',
		gscSiteUrl: 'https://example.com',
	}),
	getRuntimeEnvFromHeaders: () => 'local',
}));

vi.mock('@pixelated-tech/components', () => ({
	getContentTypes: async () => [{ id: 'type-1', name: 'Type 1' }],
	migrateContentType: async () => ({ success: true, migrated: true }),
	validateContentfulCredentials: async () => ({ valid: true }),
}));

vi.mock('@pixelated-tech/components/adminserver', () => ({
	checkUptimeHealth: async () => ({ success: true, uptime: [] }),
	performOnSiteSEOAnalysis: async () => ({ status: 'success', data: {} }),
	performCoreWebVitalsAnalysis: async () => ({ status: 'success', metrics: [], site: 'test', url: 'https://example.com', scores: {}, categories: {}, timestamp: new Date().toISOString() }),
	performAxeCoreAnalysis: async () => ({ site: 'test', status: 'success', data: {}, metrics: [], timestamp: new Date().toISOString() }),
	getGoogleAnalyticsData: async () => ({ success: true, data: {} }),
	getSearchConsoleData: async () => ({ success: true, data: {} }),
	getCloudwatchHealthCheckData: async () => ({ success: true, data: {} }),
	analyzeSecurityHealth: async () => ({ status: 'success', data: { summary: {}, vulnerabilities: [], dependencies: 0, totalDependencies: 0 } }),
	analyzeGitHealth: async () => ({ success: true, data: { commits: [], contributors: [] } }),
	discoverComponentsFromLibrary: async () => [],
	analyzeComponentUsage: async () => ({ components: [] }),
	CacheManager: class {
		constructor() {}
		get() { return null; }
		set() {}
	},
	executeDeployment: async () => ({ success: true }),
}));

const siteConfigJson = JSON.stringify([
	{
		name: 'test',
		localPath: '/site-a',
		url: 'https://example.com',
		healthCheckId: 'hc-123',
		region: 'us-east-1',
		repo: 'repo',
		ga4PropertyId: 'ga4-123',
		gscSiteUrl: 'https://example.com'
	}
]);

vi.mock('fs', async () => {
	const actual = await vi.importActual<typeof import('fs')>('fs');
	return {
		...actual,
		promises: {
			...actual.promises,
			readFile: vi.fn(async (path: string, _encoding?: string) => {
				if (path.includes('src/app/data/sites.json')) return siteConfigJson;
				return 'HTTP/1.1 200 OK';
			}),
		},
		readFileSync: vi.fn((path: string, _encoding?: string) => {
			if (String(path).includes('src/app/data/sites.json')) return siteConfigJson;
			return actual.readFileSync(path, _encoding as any);
		}),
		default: actual,
	};
});

async function importModule(relPath: string) {
	return import(pathToFileURL(path.join(process.cwd(), relPath)).href);
}

function makeRequest(body?: unknown, method = 'POST') {
	return new Request('http://localhost', {
		method,
		body: body ? JSON.stringify(body) : undefined,
		headers: { 'Content-Type': 'application/json', host: 'localhost' },
	});
}

function makeJsonRequest(url = 'http://localhost', body?: unknown, method = 'POST') {
	return new Request(url, {
		method,
		body: body ? JSON.stringify(body) : undefined,
		headers: { 'Content-Type': 'application/json' },
	});
}

function makeGetRequest(pathname = '/', params: Record<string, string> = {}) {
	const url = new URL(`http://localhost${pathname}`);
	Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
	return new Request(url.href, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
}

describe('pixelated-admin API routes', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.resetModules();
	});

	it('returns component usage results', async () => {
		const route = await importModule('src/app/api/component-usage/route.ts');
		const response = await route.GET();
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ components: [] });
	});

	it('returns sites JSON', async () => {
		const route = await importModule('src/app/api/sites/route.ts');
		const response = await route.GET();
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual([{ name: 'test', url: 'https://example.com', localPath: '/site-a' }]);
	});

	it('returns AI error when key missing', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'getFullPixelatedConfig').mockReturnValue({ google: {} });
		const route = await importModule('src/app/api/ai/recommendations/route.ts');
		const response = await route.POST(makeRequest({ input: [] }));
		expect(response.status).toBe(500);
		const payload = await response.json();
		expect(payload.success).toBe(false);
	});

	it('returns AI recommendations when key present', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'getFullPixelatedConfig').mockReturnValue({ google: { api_key: 'gkey' } });
		const route = await importModule('src/app/api/ai/recommendations/route.ts');
		const response = await route.POST(makeRequest({ input: [] }));
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ success: true, data: { results: ['yes'] } });
	});

	it('handles deploy route', async () => {
		const route = await importModule('src/app/api/deploy/route.ts');
		const response = await route.POST({
			request: makeRequest({ site: 'test', environments: ['prod'], versionType: 'patch', commitMessage: 'ok' }),
		});
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ message: 'Deployment results', success: true });
	});

	it('returns contentful content types for valid credentials', async () => {
		const route = await importModule('src/app/api/contentful/content-types/route.ts');
		const response = await route.POST(makeJsonRequest('http://localhost', {
			spaceId: 'space',
			accessToken: 'token'
		}));
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ success: true, data: [{ id: 'type-1', name: 'Type 1' }] });
	});

	it('migrates contentful content types', async () => {
		const route = await importModule('src/app/api/contentful/migrate/route.ts');
		const response = await route.POST(makeJsonRequest('http://localhost', {
			sourceSpaceId: 'space',
			sourceAccessToken: 'token',
			targetSpaceId: 'space',
			targetAccessToken: 'token',
			contentTypeId: 'page'
		}));
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ success: true, migrated: true });
	});

	it('validates contentful credentials successfully', async () => {
		const route = await importModule('src/app/api/contentful/validate/route.ts');
		const response = await route.POST(makeJsonRequest('http://localhost', {
			spaceId: 'space',
			accessToken: 'token'
		}));
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ success: true, error: undefined });
	});

	it('lists contentful pages via pagebuilder', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'getFullPixelatedConfig').mockReturnValue({
			contentful: { spaceId: 'space', accessToken: 'token', environment: 'master' }
		});
		const route = await importModule('src/app/api/pagebuilder/list/route.ts');
		const response = await route.GET();
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual([{ id: 'page-1' }]);
	});

	it('loads a contentful page via pagebuilder', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'getFullPixelatedConfig').mockReturnValue({
			contentful: { spaceId: 'space', accessToken: 'token', environment: 'master' }
		});
		const route = await importModule('src/app/api/pagebuilder/load/route.ts');
		const response = await route.GET(makeGetRequest('/', { name: 'page-1' }));
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ id: 'page-1', content: 'ok' });
	});

	it('saves a contentful page via pagebuilder', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'getFullPixelatedConfig').mockReturnValue({
			contentful: { spaceId: 'space', accessToken: 'token', environment: 'master' }
		});
		const route = await importModule('src/app/api/pagebuilder/save/route.ts');
		const response = await route.POST(makeJsonRequest('http://localhost', {
			name: 'page-1',
			data: { foo: 'bar' }
		}));
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ success: true });
	});

	it('deletes a contentful page via pagebuilder', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'getFullPixelatedConfig').mockReturnValue({
			contentful: { spaceId: 'space', accessToken: 'token', environment: 'master' }
		});
		const route = await importModule('src/app/api/pagebuilder/delete/route.ts');
		const response = await route.DELETE(new Request('http://localhost?name=test', { method: 'DELETE' }));
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ success: true });
	});

	it('returns pagebuilder list validation failure when configuration is missing', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'getFullPixelatedConfig').mockReturnValue(undefined);
		const route = await importModule('src/app/api/pagebuilder/list/route.ts');
		const response = await route.GET();
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ success: false, pages: [], message: 'Contentful configuration not found' });
	});

	it('returns pagebuilder load failure when contentful configuration is missing', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'getFullPixelatedConfig').mockReturnValue(undefined);
		const route = await importModule('src/app/api/pagebuilder/load/route.ts');
		const response = await route.GET(makeGetRequest('/', { name: 'page-1' }));
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ success: false, message: 'Contentful configuration not found' });
	});

	it('returns pagebuilder save failure when contentful configuration is missing', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'getFullPixelatedConfig').mockReturnValue(undefined);
		const route = await importModule('src/app/api/pagebuilder/save/route.ts');
		const response = await route.POST(makeJsonRequest('http://localhost', { name: 'page-1', data: { foo: 'bar' } }));
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ success: false, message: 'Contentful configuration not found' });
	});

	it('returns pagebuilder delete failure when contentful configuration is missing', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'getFullPixelatedConfig').mockReturnValue(undefined);
		const route = await importModule('src/app/api/pagebuilder/delete/route.ts');
		const response = await route.DELETE(new Request('http://localhost?name=test', { method: 'DELETE' }));
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ success: false, message: 'Contentful configuration not found' });
	});

	it('returns contentful content-types 500 when getContentTypes throws', async () => {
		const comps = await import('@pixelated-tech/components');
		vi.spyOn(comps, 'getContentTypes').mockRejectedValue(new Error('contentive fail'));
		const route = await importModule('src/app/api/contentful/content-types/route.ts');
		const response = await route.POST(makeJsonRequest('http://localhost', { spaceId: 'space', accessToken: 'token' }));
		expect(response.status).toBe(500);
		expect(await response.json()).toMatchObject({ success: false, error: 'contentive fail' });
	});

	it('returns contentful migrate 500 when migration throws', async () => {
		const comps = await import('@pixelated-tech/components');
		vi.spyOn(comps, 'migrateContentType').mockRejectedValue(new Error('migrate fail'));
		const route = await importModule('src/app/api/contentful/migrate/route.ts');
		const response = await route.POST(makeJsonRequest('http://localhost', {
			sourceSpaceId: 'space',
			sourceAccessToken: 'token',
			targetSpaceId: 'space',
			targetAccessToken: 'token',
			contentTypeId: 'page'
		}));
		expect(response.status).toBe(500);
		expect(await response.json()).toMatchObject({ success: false, error: 'migrate fail' });
	});

	it('returns contentful validate 500 when validate function throws', async () => {
		const comps = await import('@pixelated-tech/components');
		vi.spyOn(comps, 'validateContentfulCredentials').mockRejectedValue(new Error('validate fail'));
		const route = await importModule('src/app/api/contentful/validate/route.ts');
		const response = await route.POST(makeJsonRequest('http://localhost', {
			spaceId: 'space',
			accessToken: 'token'
		}));
		expect(response.status).toBe(500);
		expect(await response.json()).toMatchObject({ success: false, error: 'Internal server error' });
	});

	it('returns AI recommendations 500 when recommendation generation throws', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'getFullPixelatedConfig').mockReturnValue({ google: { api_key: 'gkey' } });
		const comps = await import('@pixelated-tech/components/server');
		(vi.spyOn(comps as any, 'generateAiRecommendations') as any).mockRejectedValue(new Error('ai failure'));
		const route = await importModule('src/app/api/ai/recommendations/route.ts');
		const response = await route.POST(makeJsonRequest('http://localhost', { input: [] }));
		expect(response.status).toBe(500);
		expect(await response.json()).toMatchObject({ success: false, error: 'ai failure' });
	});

	it('returns axe-core success data for a valid siteName', async () => {
		const route = await importModule('src/app/api/site-health/axe-core/route.ts');
		const response = await route.GET(makeGetRequest('/', { siteName: 'test' }));
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({ success: true, data: expect.any(Array) });
		expect(response.headers.get('x-axe-cache-hit')).toBe('0');
	});

	it('returns axe-core purge-only response when purge is requested', async () => {
		const route = await importModule('src/app/api/site-health/axe-core/route.ts');
		const response = await route.GET(makeGetRequest('/', { siteName: 'test', purge: 'true', purgeOnly: 'true' }));
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({ success: true, data: [] });
	});

	it('returns on-site SEO data for valid siteName', async () => {
		const route = await importModule('src/app/api/site-health/on-site-seo/route.ts');
		const response = await route.GET(makeGetRequest('/', { siteName: 'test' }));
		expect(response.status).toBe(200);
		expect(await response.json()).toBeTruthy();
	});

	it('returns security health data for valid siteName', async () => {
		const route = await importModule('src/app/api/site-health/security/route.ts');
		const response = await route.GET(makeGetRequest('/', { siteName: 'test' }));
		expect(response.status).toBe(200);
		expect(await response.json()).toBeTruthy();
	});

	it('returns uptime health data for valid siteName', async () => {
		const route = await importModule('src/app/api/site-health/uptime/route.ts');
		const response = await route.GET(makeGetRequest('/', { siteName: 'test' }));
		expect(response.status).toBe(200);
		expect(await response.json()).toBeTruthy();
	});

	it('returns cloudwatch data for valid siteName', async () => {
		const route = await importModule('src/app/api/site-health/cloudwatch/route.ts');
		const response = await route.GET(makeGetRequest('/', { siteName: 'test' }));
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({ success: true });
	});

	it('returns google analytics data for valid siteName', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'getFullPixelatedConfig').mockReturnValue({
			google: { client_id: 'g-id', client_secret: 'g-secret', refresh_token: 'refresh' },
			googleAnalytics: { serviceAccountKey: 'key' }
		});
		const route = await importModule('src/app/api/site-health/google-analytics/route.ts');
		const response = await route.GET(makeGetRequest('/', { siteName: 'brianwhaley' }));
		expect(response.status).toBe(200);
		expect(await response.json()).toBeTruthy();
	});

	it('returns google search console data for valid siteName', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'getFullPixelatedConfig').mockReturnValue({
			google: { client_id: 'g-id', client_secret: 'g-secret', refresh_token: 'refresh' },
			googleSearchConsole: { serviceAccountKey: 'key' }
		});
		const route = await importModule('src/app/api/site-health/google-search-console/route.ts');
		const response = await route.GET(makeGetRequest('/', { siteName: 'brianwhaley' }));
		expect(response.status).toBe(200);
		expect(await response.json()).toBeTruthy();
	});

	it('returns core web vitals data for valid siteName', async () => {
		const route = await importModule('src/app/api/site-health/core-web-vitals/route.ts');
		const response = await route.GET(makeGetRequest('/', { siteName: 'test' }));
		expect(response.status).toBe(200);
		expect(await response.json()).toBeTruthy();
	});

	it('returns github health data for valid siteName', async () => {
		const route = await importModule('src/app/api/site-health/github/route.ts');
		const response = await route.GET(makeGetRequest('/', { siteName: 'brianwhaley' }));
		expect(response.status).toBe(200);
	});

	it('returns contentful content types validation failure when missing credentials', async () => {
		const route = await importModule('src/app/api/contentful/content-types/route.ts');
		const response = await route.POST(makeJsonRequest('http://localhost', { spaceId: '', accessToken: '' }));
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ success: false });
	});

	it('returns contentful migrate validation failure when missing required fields', async () => {
		const route = await importModule('src/app/api/contentful/migrate/route.ts');
		const response = await route.POST(makeJsonRequest('http://localhost', { sourceSpaceId: 'space' }));
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ success: false });
	});

	it('returns contentful validate failure when missing credentials', async () => {
		const route = await importModule('src/app/api/contentful/validate/route.ts');
		const response = await route.POST(makeJsonRequest('http://localhost', { spaceId: '' }));
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ success: false });
	});

	it('returns pagebuilder load validation failure when page name is missing', async () => {
		const route = await importModule('src/app/api/pagebuilder/load/route.ts');
		const response = await route.GET(new Request('http://localhost', { method: 'GET' }));
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ success: false });
	});

	it('returns pagebuilder save validation failure when name or data are missing', async () => {
		const route = await importModule('src/app/api/pagebuilder/save/route.ts');
		const response = await route.POST(makeJsonRequest('http://localhost', { name: '' }));
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ success: false });
	});

	it('returns pagebuilder delete validation failure when name is missing', async () => {
		const route = await importModule('src/app/api/pagebuilder/delete/route.ts');
		const response = await route.DELETE(new Request('http://localhost', { method: 'DELETE' }));
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ success: false });
	});

	it('returns AI recommendations error branch when integration returns an error', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'getFullPixelatedConfig').mockReturnValue({ google: { api_key: 'gkey' } });
		const comps = await import('@pixelated-tech/components/server');
		(vi.spyOn(comps as any, 'generateAiRecommendations') as any).mockResolvedValue({ error: 'failed' });
		const route = await importModule('src/app/api/ai/recommendations/route.ts');
		const response = await route.POST(makeJsonRequest('http://localhost', { input: [] }));
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({ success: false, error: 'failed' });
	});

	it('rejects deploy route when not running locally', async () => {
		const route = await importModule('src/app/api/deploy/route.ts');
		const request = new Request('https://example.com/api/deploy', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', host: 'example.com' },
			body: JSON.stringify({ site: 'test', environments: ['prod'], versionType: 'patch', commitMessage: 'ok' }),
		});
		const response = await route.POST({ request } as any);
		expect(response.status).toBe(403);
		expect(await response.json()).toMatchObject({ error: expect.stringContaining('only allowed when running locally') });
	});

	it('rejects deploy route when required fields are missing', async () => {
		const route = await importModule('src/app/api/deploy/route.ts');
		const request = new Request('http://localhost/api/deploy', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', host: 'localhost' },
			body: JSON.stringify({ site: 'test' }),
		});
		const response = await route.POST({ request } as any);
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ error: 'Missing required fields' });
	});

	it('rejects deploy route when site is not found', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'getSiteConfig').mockResolvedValue(null);
		const route = await importModule('src/app/api/deploy/route.ts');
		const request = new Request('http://localhost/api/deploy', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', host: 'localhost' },
			body: JSON.stringify({ site: 'missing', environments: ['prod'], versionType: 'patch', commitMessage: 'ok' }),
		});
		const response = await route.POST({ request } as any);
		expect(response.status).toBe(404);
		expect(await response.json()).toMatchObject({ error: expect.stringContaining("not found") });
	});

	it('returns deploy route error when executeDeployment throws', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'getSiteConfig').mockResolvedValue({ name: 'test', localPath: '/site-a', remote: 'site-a' } as any);
		const admin = await import('@pixelated-tech/components/adminserver');
		vi.spyOn(admin, 'executeDeployment').mockRejectedValue(new Error('boom'));
		const route = await importModule('src/app/api/deploy/route.ts');
		const request = new Request('http://localhost/api/deploy', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', host: 'localhost' },
			body: JSON.stringify({ site: 'test', environments: ['prod'], versionType: 'patch', commitMessage: 'ok' }),
		});
		const response = await route.POST({ request } as any);
		expect(response.status).toBe(500);
		expect(await response.json()).toMatchObject({ error: expect.stringContaining('Deployment failed') });
	});

	it('returns sites route 500 when loading sites fails', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'loadSitesConfig').mockRejectedValue(new Error('fail'));
		const route = await importModule('src/app/api/sites/route.ts');
		const response = await route.GET();
		expect(response.status).toBe(500);
		expect(await response.json()).toMatchObject({ error: 'Failed to load sites' });
	});

	it('returns component usage 500 when analysis fails', async () => {
		const admin = await import('@pixelated-tech/components/adminserver');
		vi.spyOn(admin, 'analyzeComponentUsage').mockRejectedValue(new Error('boom'));
		const route = await importModule('src/app/api/component-usage/route.ts');
		const response = await route.GET();
		expect(response.status).toBe(500);
		expect(await response.json()).toMatchObject({ error: 'Internal server error' });
	});

	it('returns humans.txt well-known response', async () => {
		const route = await importModule('src/app/(pages)/humans.txt/route.ts');
		const response = await route.GET(new Request('http://localhost/humans.txt', { method: 'GET' }));
		expect(response).toBeInstanceOf(Response);
		expect(response.status).toBe(200);
	});

	it('returns security.txt well-known response', async () => {
		const route = await importModule('src/app/(pages)/security.txt/route.ts');
		const response = await route.GET(new Request('http://localhost/security.txt', { method: 'GET' }));
		expect(response).toBeInstanceOf(Response);
		expect(response.status).toBe(200);
	});

	it('rewrites auth redirect location when NEXTAUTH_URL is configured', async () => {
		process.env.NEXTAUTH_URL = 'https://admin.pixelated.tech';
		const route = await importModule('src/app/api/auth/[...nextauth]/route.ts');
		const response = await route.GET(new Request('http://localhost/api/auth/signin', { method: 'GET' }));
		expect(response.status).toBe(302);
		expect(response.headers.get('location')).toContain('redirect_uri=https%3A%2F%2Fadmin.pixelated.tech%2Fapi%2Fauth%2Fcallback%2Fgoogle');
		delete process.env.NEXTAUTH_URL;
	});

	it('rewrites auth redirect location using x-origin when NEXTAUTH_URL is unset', async () => {
		const route = await importModule('src/app/api/auth/[...nextauth]/route.ts');
		const request = new Request('http://localhost/api/auth/signin', {
			method: 'GET',
			headers: { 'x-origin': 'https://admin.pixelated.tech' },
		});
		const response = await route.GET(request);
		expect(response.status).toBe(302);
		expect(response.headers.get('location')).toContain('redirect_uri=https%3A%2F%2Fadmin.pixelated.tech%2Fapi%2Fauth%2Fcallback%2Fgoogle');
	});

	it('preserves normal auth response when no rewrite is required', async () => {
		mockNextAuthHandler.mockResolvedValueOnce(new Response('ok', { status: 200 }));
		const route = await importModule('src/app/api/auth/[...nextauth]/route.ts');
		const response = await route.GET(new Request('http://localhost/api/auth/session', { method: 'GET' }));
		expect(response.status).toBe(200);
		expect(await response.text()).toBe('ok');
	});

	it('serves axe-core bundle text from node_modules', async () => {
		const fs = await import('fs');
		const readSpy = vi.spyOn(fs.promises, 'readFile').mockResolvedValueOnce('console.log("axe");');
		const route = await importModule('src/app/api/axe-core/route.ts');
		const response = await route.GET();
		expect(response.status).toBe(200);
		expect(await response.text()).toContain('console.log("axe");');
		readSpy.mockRestore();
	});

	it('returns axe-core bundle 500 when the file is unavailable', async () => {
		const fs = await import('fs');
		const readSpy = vi.spyOn(fs.promises, 'readFile').mockRejectedValueOnce(new Error('not found'));
		const route = await importModule('src/app/api/axe-core/route.ts');
		const response = await route.GET();
		expect(response.status).toBe(500);
		expect(await response.text()).toContain('axe-core not available');
		readSpy.mockRestore();
	});

	it('returns axe-core response from cache after first request', async () => {
		const route = await importModule('src/app/api/site-health/axe-core/route.ts');
		await route.GET(makeGetRequest('/', { siteName: 'test' }));
		const secondResponse = await route.GET(makeGetRequest('/', { siteName: 'test' }));
		expect(secondResponse.status).toBe(200);
		expect(secondResponse.headers.get('x-axe-cache-hit')).toBe('1');
	});

	it('returns axe-core response with cache disabled when cache=false', async () => {
		const route = await importModule('src/app/api/site-health/axe-core/route.ts');
		const response = await route.GET(makeGetRequest('/', { siteName: 'test', cache: 'false' }));
		expect(response.status).toBe(200);
		expect(response.headers.get('x-axe-use-cache')).toBe('false');
	});

	it('clears axe-core cache and processes again when purge is requested without purgeOnly', async () => {
		const route = await importModule('src/app/api/site-health/axe-core/route.ts');
		await route.GET(makeGetRequest('/', { siteName: 'test' }));
		const response = await route.GET(makeGetRequest('/', { siteName: 'test', purge: 'true', purgeOnly: 'false' }));
		expect(response.status).toBe(200);
		expect(response.headers.get('x-axe-purged')).toBeTruthy();
	});

	it('retries axe-core analysis when the first attempt fails', async () => {
		const admin = await import('@pixelated-tech/components/adminserver');
		let count = 0;
		vi.spyOn(admin, 'performAxeCoreAnalysis').mockImplementation(async () => {
			if (count++ === 0) throw new Error('boom');
			return { site: 'test', status: 'success', data: {}, metrics: [], timestamp: new Date().toISOString() };
		});
		const route = await importModule('src/app/api/site-health/axe-core/route.ts');
		const response = await route.GET(makeGetRequest('/', { siteName: 'test' }));
		expect(response.status).toBe(200);
		expect((await response.json()).success).toBe(true);
	});

	it('falls back to origin parsing when getRuntimeEnvFromHeaders throws', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'getRuntimeEnvFromHeaders').mockImplementation(() => { throw new Error('bad'); });
		const route = await importModule('src/app/api/site-health/axe-core/route.ts');
		const response = await route.GET(makeGetRequest('/', { siteName: 'test' }));
		expect(response.status).toBe(200);
		expect((await response.json()).success).toBe(true);
	});

	it('returns core web vitals 400 when siteName missing', async () => {
		const route = await importModule('src/app/api/site-health/core-web-vitals/route.ts');
		const response = await route.GET(makeGetRequest('/'));
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ success: false });
	});

	it('returns google analytics 400 when siteName missing', async () => {
		const route = await importModule('src/app/api/site-health/google-analytics/route.ts');
		const response = await route.GET(makeGetRequest('/'));
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ success: false });
	});

	it('returns google search console 400 when siteName missing', async () => {
		const route = await importModule('src/app/api/site-health/google-search-console/route.ts');
		const response = await route.GET(makeGetRequest('/'));
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ success: false });
	});

	it('returns github health 400 when siteName missing', async () => {
		const route = await importModule('src/app/api/site-health/github/route.ts');
		const response = await route.GET(makeGetRequest('/'));
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ success: false });
	});

	it('returns on-site seo 400 when siteName missing', async () => {
		const route = await importModule('src/app/api/site-health/on-site-seo/route.ts');
		const response = await route.GET(makeGetRequest('/'));
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ success: false });
	});

	it('returns security health 400 when siteName missing', async () => {
		const route = await importModule('src/app/api/site-health/security/route.ts');
		const response = await route.GET(makeGetRequest('/'));
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ success: false });
	});

	it('returns uptime health 400 when siteName missing', async () => {
		const route = await importModule('src/app/api/site-health/uptime/route.ts');
		const response = await route.GET(makeGetRequest('/'));
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ success: false });
	});

	it('returns cloudwatch 400 when siteName missing', async () => {
		const route = await importModule('src/app/api/site-health/cloudwatch/route.ts');
		const response = await route.GET(makeGetRequest('/'));
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ success: false });
	});

	it('returns site-health google analytics 500 when credentials are missing', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'getFullPixelatedConfig').mockReturnValue({ google: {}, googleAnalytics: {} });
		const route = await importModule('src/app/api/site-health/google-analytics/route.ts');
		const response = await route.GET(makeGetRequest('/', { siteName: 'brianwhaley' }));
		expect(response.status).toBe(500);
		expect(await response.json()).toMatchObject({ success: false });
	});

	it('returns google search console 403 when permission is insufficient', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'getFullPixelatedConfig').mockReturnValue({ google: { client_id: 'g-id', client_secret: 'g-secret', refresh_token: 'refresh' }, googleSearchConsole: { serviceAccountKey: 'key' } });
		const admin = await import('@pixelated-tech/components/adminserver');
		vi.spyOn(admin, 'getSearchConsoleData').mockResolvedValue({ success: false, error: 'insufficient_permission', details: 'no access', code: 403 });
		const route = await importModule('src/app/api/site-health/google-search-console/route.ts');
		const response = await route.GET(makeGetRequest('/', { siteName: 'brianwhaley' }));
		expect(response.status).toBe(403);
		expect(await response.json()).toMatchObject({ success: false, error: 'insufficient_permission' });
	});

	it('returns uptime no healthCheckId branch', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'getSiteConfig').mockResolvedValue({ name: 'test', url: 'https://example.com' } as any);
		const route = await importModule('src/app/api/site-health/uptime/route.ts');
		const response = await route.GET(makeGetRequest('/', { siteName: 'test' }));
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({ success: true, status: 'Unknown' });
	});

	it('returns security no localPath branch', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'getSiteConfig').mockResolvedValue({ name: 'test', localPath: undefined, url: 'https://example.com' } as any);
		const route = await importModule('src/app/api/site-health/security/route.ts');
		const response = await route.GET(makeGetRequest('/', { siteName: 'test' }));
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({ status: 'Unknown' });
	});

	it('returns on-site SEO no url branch', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'getSiteConfig').mockResolvedValue({ name: 'test' } as any);
		const route = await importModule('src/app/api/site-health/on-site-seo/route.ts');
		const response = await route.GET(makeGetRequest('/', { siteName: 'test' }));
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({ success: false });
	});

	it('returns cloudwatch no healthCheckId branch', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'getSiteConfig').mockResolvedValue({ name: 'test', url: 'https://example.com' } as any);
		const route = await importModule('src/app/api/site-health/cloudwatch/route.ts');
		const response = await route.GET(makeGetRequest('/', { siteName: 'test' }));
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({ success: false });
	});

	it('returns google analytics success branch with credentials', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'getFullPixelatedConfig').mockReturnValue({ google: { client_id: 'g-id', client_secret: 'g-secret', refresh_token: 'refresh' }, googleAnalytics: { serviceAccountKey: 'key' } });
		const route = await importModule('src/app/api/site-health/google-analytics/route.ts');
		const response = await route.GET(makeGetRequest('/', { siteName: 'brianwhaley' }));
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({ success: true });
	});

	it('returns google search console success branch', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'getFullPixelatedConfig').mockReturnValue({ google: { client_id: 'g-id', client_secret: 'g-secret', refresh_token: 'refresh' }, googleSearchConsole: { serviceAccountKey: 'key' } });
		const route = await importModule('src/app/api/site-health/google-search-console/route.ts');
		const response = await route.GET(makeGetRequest('/', { siteName: 'brianwhaley' }));
		expect(response.status).toBe(200);
	});

	it('returns github success branch', async () => {
		const route = await importModule('src/app/api/site-health/github/route.ts');
		const response = await route.GET(makeGetRequest('/', { siteName: 'brianwhaley' }));
		expect(response.status).toBe(200);
	});

	it('returns cloudwatch success branch for valid site', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'getSiteConfig').mockResolvedValue({ name: 'brianwhaley', healthCheckId: 'hc-123', url: 'https://example.com' } as any);
		const route = await importModule('src/app/api/site-health/cloudwatch/route.ts');
		const response = await route.GET(makeGetRequest('/', { siteName: 'brianwhaley' }));
		expect(response.status).toBe(200);
	});

	it('returns uptime success branch for valid site', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'getSiteConfig').mockResolvedValue({ name: 'brianwhaley', healthCheckId: 'hc-123', url: 'https://example.com' } as any);
		const route = await importModule('src/app/api/site-health/uptime/route.ts');
		const response = await route.GET(makeGetRequest('/', { siteName: 'brianwhaley' }));
		expect(response.status).toBe(200);
	});

	it('returns core web vitals error branch when reading sites fails', async () => {
		const fs = await import('fs');
		const readFileSpy = vi.spyOn(fs.promises, 'readFile').mockImplementation(async () => {
			throw new Error('file missing');
		});
		const route = await importModule('src/app/api/site-health/core-web-vitals/route.ts');
		const response = await route.GET(makeGetRequest('/', { siteName: 'test' }));
		expect(response.status).toBe(500);
		expect(await response.json()).toMatchObject({ success: false });
		readFileSpy.mockRestore();
	});

	it('returns google search console no site found 404 branch', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'getFullPixelatedConfig').mockReturnValue({ google: { client_id: 'g-id', client_secret: 'g-secret', refresh_token: 'refresh' }, googleSearchConsole: { serviceAccountKey: 'key' } });
		vi.spyOn(server, 'loadSitesConfig').mockResolvedValue([] as any);
		const route = await importModule('src/app/api/site-health/google-search-console/route.ts');
		const response = await route.GET(makeGetRequest('/', { siteName: 'missing' }));
		expect(response.status).toBe(404);
		expect(await response.json()).toMatchObject({ success: false });
	});

	it('returns github site not found 404 branch', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'loadSitesConfig').mockResolvedValue([] as any);
		const route = await importModule('src/app/api/site-health/github/route.ts');
		const response = await route.GET(makeGetRequest('/', { siteName: 'missing' }));
		expect(response.status).toBe(404);
		expect(await response.json()).toMatchObject({ success: false });
	});

	it('returns on-site seo error branch when performOnSiteSEOAnalysis throws', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'getSiteConfig').mockResolvedValue({ name: 'test', url: 'https://example.com' } as any);
		const admin = await import('@pixelated-tech/components/adminserver');
		vi.spyOn(admin, 'performOnSiteSEOAnalysis').mockRejectedValue(new Error('analysis fail'));
		const route = await importModule('src/app/api/site-health/on-site-seo/route.ts');
		const response = await route.GET(makeGetRequest('/', { siteName: 'test' }));
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({ success: false });
	});

	it('returns google analytics route success branch with configured credentials', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'getFullPixelatedConfig').mockReturnValue({ google: { client_id: 'g-id', client_secret: 'g-secret', refresh_token: 'refresh' }, googleAnalytics: { serviceAccountKey: 'key' } });
		const route = await importModule('src/app/api/site-health/google-analytics/route.ts');
		const response = await route.GET(makeGetRequest('/', { siteName: 'brianwhaley' }));
		expect(response.status).toBe(200);
	});

	it('returns google search console route success branch with configured credentials', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'getFullPixelatedConfig').mockReturnValue({ google: { client_id: 'g-id', client_secret: 'g-secret', refresh_token: 'refresh' }, googleSearchConsole: { serviceAccountKey: 'key' } });
		const route = await importModule('src/app/api/site-health/google-search-console/route.ts');
		const response = await route.GET(makeGetRequest('/', { siteName: 'brianwhaley' }));
		expect(response.status).toBe(200);
	});

	it('returns github route success branch for existing site', async () => {
		const route = await importModule('src/app/api/site-health/github/route.ts');
		const response = await route.GET(makeGetRequest('/', { siteName: 'brianwhaley' }));
		expect(response.status).toBe(200);
	});

	it('returns cloudwatch route success branch for valid site', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'getSiteConfig').mockResolvedValue({ name: 'brianwhaley', healthCheckId: 'hc-123', url: 'https://example.com' } as any);
		const route = await importModule('src/app/api/site-health/cloudwatch/route.ts');
		const response = await route.GET(makeGetRequest('/', { siteName: 'brianwhaley' }));
		expect(response.status).toBe(200);
	});

	it('returns uptime route success branch for valid site', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'getSiteConfig').mockResolvedValue({ name: 'brianwhaley', healthCheckId: 'hc-123', url: 'https://example.com' } as any);
		const route = await importModule('src/app/api/site-health/uptime/route.ts');
		const response = await route.GET(makeGetRequest('/', { siteName: 'brianwhaley' }));
		expect(response.status).toBe(200);
	});

	it('returns deploy route success branch when local host and valid site config exist', async () => {
		const server = await import('@pixelated-tech/components/server');
		vi.spyOn(server, 'getSiteConfig').mockResolvedValue({ name: 'brianwhaley', localPath: '/repo', remote: 'repo' } as any);
		const admin = await import('@pixelated-tech/components/adminserver');
		vi.spyOn(admin, 'executeDeployment').mockResolvedValue({ success: true, environments: { prod: 'ok' } });
		const route = await importModule('src/app/api/deploy/route.ts');
		const request = new Request('http://localhost/api/deploy', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', host: 'localhost' },
			body: JSON.stringify({ site: 'brianwhaley', environments: ['prod'], versionType: 'patch', commitMessage: 'ok' }),
		});
		const response = await route.POST({ request } as any);
		expect(response.status).toBe(200);
	});

	it('returns pagebuilder route import response for delete route', async () => {
		const route = await importModule('src/app/api/pagebuilder/delete/route.ts');
		const response = await route.DELETE(new Request('http://localhost?name=test', { method: 'DELETE' }));
		expect(response.status).toBe(200);
	});

	it('returns contentful content-types route success branch after credentials are provided', async () => {
		const route = await importModule('src/app/api/contentful/content-types/route.ts');
		const response = await route.POST(makeJsonRequest('http://localhost', { spaceId: 'space', accessToken: 'token' }));
		expect(response.status).toBe(200);
	});

	it('returns all api files as Response objects when imported', async () => {
		const files = [
			'src/app/api/axe-core/route.ts',
			'src/app/api/contentful/content-types/route.ts',
			'src/app/api/contentful/migrate/route.ts',
			'src/app/api/contentful/validate/route.ts',
			'src/app/api/pagebuilder/delete/route.ts',
			'src/app/api/pagebuilder/list/route.ts',
			'src/app/api/pagebuilder/load/route.ts',
			'src/app/api/pagebuilder/save/route.ts',
			'src/app/api/site-health/axe-core/route.ts',
			'src/app/api/site-health/cloudwatch/route.ts',
			'src/app/api/site-health/core-web-vitals/route.ts',
			'src/app/api/site-health/github/route.ts',
			'src/app/api/site-health/google-analytics/route.ts',
			'src/app/api/site-health/google-search-console/route.ts',
			'src/app/api/site-health/on-site-seo/route.ts',
			'src/app/api/site-health/security/route.ts',
			'src/app/api/site-health/uptime/route.ts',
		];
		for (const file of files) {
			const importedModule = await importModule(file);
			expect(importedModule).toBeTruthy();
			if (typeof module.GET === 'function') {
				const response = await module.GET(makeRequest());
				expect(response).toBeInstanceOf(Response);
			}
			if (typeof module.POST === 'function') {
				const arg = file.includes('/deploy/route.ts')
					? { request: makeRequest({ test: true }) }
					: makeRequest({ test: true });
				const response = await module.POST(arg);
				expect(response).toBeInstanceOf(Response);
			}
			if (typeof module.DELETE === 'function') {
				const url = new URL('http://localhost' + (file.includes('/pagebuilder/delete/route.ts') ? '?name=test' : ''));
				const response = await module.DELETE(new Request(url.href));
				expect(response).toBeInstanceOf(Response);
			}
		}
	});
});
