import { describe, it, expect, vi } from 'vitest';

vi.mock('@pixelated-tech/components/server', () => ({
	getSiteConfig: async () => ({ name: 'test', gscSiteUrl: 'https://example.com' }),
	getFullPixelatedConfig: () => {
		const google: any = {};
		google['client_id'] = 'g-id';
		google['client_secret'] = 'g-secret';
		google['refresh_token'] = 'refresh';
		return { integrations: { google, googleSearchConsole: { serviceAccountKey: 'key' } } };
	},
}));

vi.mock('@pixelated-tech/components/adminserver', () => ({
	getSearchConsoleData: vi.fn(async () => ({ success: true, data: { rows: [] } })),
}));

describe('site-health google search console route behavior', () => {
	it('returns 400 when siteName missing', async () => {
		const route = await import('@/app/api/site-health/google-search-console/route');
		const response = await route.GET(new Request('http://localhost', { method: 'GET' }));
		expect(response.status).toBe(400);
	});

	it('returns 200 with data when credentials configured', async () => {
		const route = await import('@/app/api/site-health/google-search-console/route');
		const response = await route.GET(new Request('http://localhost?siteName=test', { method: 'GET' }));
		expect(response.status).toBe(200);
		expect((await response.json()).success).toBe(true);
	});
});
