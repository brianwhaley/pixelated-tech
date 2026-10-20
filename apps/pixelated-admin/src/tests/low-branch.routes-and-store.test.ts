import { beforeEach, describe, expect, it, vi } from 'vitest';

const readFile = vi.fn();
const existsSync = vi.fn();
const getSiteConfig = vi.fn();
const analyzeSecurityHealth = vi.fn();
const performCoreWebVitalsAnalysis = vi.fn();
const performAxeCoreAnalysis = vi.fn();
const getRuntimeEnvFromHeaders = vi.fn(() => 'auto');
const readFileSync = vi.fn();
const writeFileSync = vi.fn();
const renameSync = vi.fn();
const mkdirSync = vi.fn();

vi.mock('fs', () => ({
	default: { promises: { readFile }, readFileSync, writeFileSync, renameSync, existsSync, mkdirSync },
	promises: { readFile }, readFileSync, writeFileSync, renameSync, existsSync, mkdirSync,
}));

vi.mock('@pixelated-tech/components/adminserver', () => ({
	performCoreWebVitalsAnalysis,
	performAxeCoreAnalysis,
	analyzeSecurityHealth,
	CacheManager: class {
		private values = new Map<string, unknown>();
		get(key: string) { return this.values.get(key); }
		set(key: string, value: unknown) { this.values.set(key, value); }
	},
}));

vi.mock('@pixelated-tech/components/server', () => ({
	getSiteConfig,
	getRuntimeEnvFromHeaders,
}));

const jsonResponse = async (response: Response) => await response.json();

beforeEach(() => {
	vi.resetModules();
	vi.clearAllMocks();
	readFile.mockResolvedValue(JSON.stringify([{ name: 'site', url: 'https://site.test' }, { name: 'no-url' }]));
	existsSync.mockReturnValue(true);
	getSiteConfig.mockResolvedValue({ name: 'site', localPath: '/repo', url: 'https://site.test', repo: 'owner/repo' });
	analyzeSecurityHealth.mockResolvedValue({ status: 'success', data: { status: 'Good', vulnerabilities: [], summary: { total: 0 } } });
	// Test fixture intentionally mirrors the config provider's public key.
	// eslint-disable-next-line pixelated/no-hardcoded-config-keys
	performCoreWebVitalsAnalysis.mockResolvedValue({ status: 'success', site: 'site', url: 'https://site.test' });
	performAxeCoreAnalysis.mockResolvedValue({ status: 'success', violations: [] });
	getRuntimeEnvFromHeaders.mockReturnValue('auto');
	readFileSync.mockReturnValue(JSON.stringify({ results: [] }));
});

describe('core web vitals route branches', () => {
	it('handles missing, unknown, and unconfigured sites', async () => {
		const route = await import('@/app/api/site-health/core-web-vitals/route');
		expect((await route.GET(new Request('http://localhost'))).status).toBe(400);
		expect((await route.GET(new Request('http://localhost?siteName=missing'))).status).toBe(404);
		expect((await route.GET(new Request('http://localhost?siteName=no-url'))).status).toBe(400);
	});

	it('passes desktop and uncached options and returns analyzer errors', async () => {
		const route = await import('@/app/api/site-health/core-web-vitals/route');
		const response = await route.GET(new Request('http://localhost?siteName=site&cache=false&strategy=desktop'));
		expect(response.status).toBe(200);
		expect(performCoreWebVitalsAnalysis).toHaveBeenCalledWith('https://site.test', 'site', false, 'desktop');
		performCoreWebVitalsAnalysis.mockRejectedValueOnce(new Error('offline'));
		const failed = await route.GET(new Request('http://localhost?siteName=site'));
		const body = await jsonResponse(failed);
		expect(body.data[0].status).toBe('error');
		expect(body.data[0].error).toBe('offline');
	});

	it('returns a 500 response when configuration cannot be read', async () => {
		readFile.mockRejectedValueOnce(new Error('read failed'));
		const route = await import('@/app/api/site-health/core-web-vitals/route');
		const response = await route.GET(new Request('http://localhost?siteName=site'));
		expect(response.status).toBe(500);
	});

	it('supports object-shaped configuration and unknown failures', async () => {
		readFile.mockResolvedValueOnce(JSON.stringify({ sites: [{ name: 'site', url: 'https://site.test' }] }));
		performCoreWebVitalsAnalysis.mockRejectedValueOnce('offline');
		const route = await import('@/app/api/site-health/core-web-vitals/route');
		const response = await route.GET(new Request('http://localhost?siteName=site&strategy=tablet'));
		expect((await jsonResponse(response)).data[0].error).toBe('Unknown error');
	});
});

describe('security route branches', () => {
	it('handles missing path, invalid path, analyzer failure, and success', async () => {
		const route = await import('@/app/api/site-health/security/route');
		getSiteConfig.mockResolvedValueOnce({ name: 'site' });
		let response = await route.GET(new Request('http://localhost?siteName=one'));
		expect((await jsonResponse(response)).message).toContain('No local path');
		existsSync.mockReturnValueOnce(false);
		getSiteConfig.mockResolvedValueOnce({ name: 'site', localPath: '/missing' });
		response = await route.GET(new Request('http://localhost?siteName=two&cache=false'));
		expect((await jsonResponse(response)).message).toContain('does not exist');
		analyzeSecurityHealth.mockResolvedValueOnce({ status: 'error', error: 'scan failed' });
		getSiteConfig.mockResolvedValueOnce({ name: 'site', localPath: '/repo' });
		response = await route.GET(new Request('http://localhost?siteName=three&cache=false'));
		expect(response.status).toBe(500);
		getSiteConfig.mockResolvedValueOnce({ name: 'site', localPath: '/repo', url: 'https://site.test' });
		response = await route.GET(new Request('http://localhost?siteName=four&cache=false'));
		expect((await jsonResponse(response)).success).toBe(true);
	});

	it('returns validation, cache, and thrown-error branches', async () => {
		const route = await import('@/app/api/site-health/security/route');
		expect((await route.GET(new Request('http://localhost'))).status).toBe(400);
		getSiteConfig.mockRejectedValueOnce(new Error('config failed'));
		const response = await route.GET(new Request('http://localhost?siteName=broken&cache=false'));
		expect(response.status).toBe(500);
		getSiteConfig.mockResolvedValueOnce({ name: 'site' });
		const cached = await route.GET(new Request('http://localhost?siteName=cached'));
		expect((await jsonResponse(cached)).success).toBe(true);
		getSiteConfig.mockClear();
		const cachedAgain = await route.GET(new Request('http://localhost?siteName=cached'));
		expect((await jsonResponse(cachedAgain)).success).toBe(true);
		expect(getSiteConfig).not.toHaveBeenCalled();
	});
});

describe('axe-core route branches', () => {
	it('handles validation, no matching sites, analysis, cache, purge, and fallback error', async () => {
		const route = await import('@/app/api/site-health/axe-core/route');
		expect((await route.GET(new Request('http://localhost'))).status).toBe(400);
		let response = await route.GET(new Request('http://localhost?siteName=missing'));
		expect((await jsonResponse(response)).data).toEqual([]);
		response = await route.GET(new Request('http://localhost?siteName=site'));
		expect(response.headers.get('x-axe-use-cache')).toBe('true');
		expect((await jsonResponse(response)).success).toBe(true);
		response = await route.GET(new Request('http://localhost?siteName=site'));
		expect(response.headers.get('x-axe-cache-hit')).toBe('1');
		response = await route.GET(new Request('http://localhost?siteName=site&purge=true&purgeOnly=true'));
		expect(response.headers.get('x-axe-purged')).toContain('site:https://site.test');
		performAxeCoreAnalysis.mockRejectedValueOnce(new Error('first')).mockRejectedValueOnce(new Error('second'));
		response = await route.GET(new Request('http://localhost?siteName=site&cache=false'));
		expect((await jsonResponse(response)).data[0].status).toBe('error');
	});

	it('returns a 500 response for unreadable configuration', async () => {
		readFile.mockRejectedValueOnce(new Error('bad sites file'));
		const route = await import('@/app/api/site-health/axe-core/route');
		expect((await route.GET(new Request('http://localhost?siteName=site'))).status).toBe(500);
	});

	it('falls back when runtime detection throws', async () => {
		getRuntimeEnvFromHeaders.mockImplementationOnce(() => { throw new Error('headers unavailable'); });
		const route = await import('@/app/api/site-health/axe-core/route');
		const response = await route.GET(new Request('http://localhost?siteName=site&cache=false'));
		expect((await jsonResponse(response)).success).toBe(true);
	});
});

describe('json store branches', () => {
	it('creates defaults, resolves path shapes, and merges empty values', async () => {
		const store = await import('@/lib/json-store');
		expect(store.makeDefaultFileNameFromUrl('https://example.com/path')).toMatch(/^example.com-/);
		expect(store.makeDefaultFileNameFromUrl('not a url')).toMatch(/^scrape-/);
		readFileSync.mockReturnValueOnce('{"wrong":true}');
		existsSync.mockReturnValueOnce(false);
		const created = store.upsertCompanyToFile('data/leads/test.json', { company: 'Acme', id: '1', phone: '555' });
		expect(created.created).toBe(true);
		expect(mkdirSync).toHaveBeenCalled();
		readFileSync.mockReturnValueOnce(JSON.stringify({ results: [{ id: '1', company: 'Acme', phone: '' }] }));
		const updated = store.upsertCompanyToFile('public/data/test.json', { id: '1', company: 'Acme', phone: '555-1212' });
		expect(updated.updated).toBe(true);
	});

	it('appends new records and preserves non-empty values', async () => {
		const store = await import('@/lib/json-store');
		readFileSync.mockReturnValueOnce(JSON.stringify({ results: [{ company: 'Acme', phone: 'old' }] }));
		const result = store.appendOrMergeResults('/tmp/leads.json', [
			{ company: 'Acme', phone: 'new' },
			{ company: 'New Co', phone: '555' },
		]);
		expect(result.added).toBe(1);
		expect(result.updated).toBe(0);
		expect(writeFileSync).toHaveBeenCalled();
	});
});
