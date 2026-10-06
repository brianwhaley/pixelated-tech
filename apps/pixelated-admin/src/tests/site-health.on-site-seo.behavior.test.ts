import { describe, it, expect, vi } from 'vitest';

vi.mock('@pixelated-tech/components/server', () => ({
	getSiteConfig: async () => ({ url: 'https://example.com' }),
}));

vi.mock('@pixelated-tech/components/adminserver', () => ({
	performOnSiteSEOAnalysis: vi.fn(async () => ({ status: 'success', data: {} })),
	CacheManager: class {
		constructor() {}
		get() { return null; }
		set() {}
	},
}));

vi.mock('../../../lib/route-utils', () => ({
	createErrorResponse: (siteName: string, message: string) => ({ success: false, error: message, site: siteName }),
}));

describe('site-health on-site-seo route behavior', () => {
	it('returns 400 when siteName missing', async () => {
		const route = await import('@/app/api/site-health/on-site-seo/route');
		const response = await route.GET(new Request('http://localhost', { method: 'GET' }));
		expect(response.status).toBe(400);
	});

	it('returns success when siteName present', async () => {
		const route = await import('@/app/api/site-health/on-site-seo/route');
		const response = await route.GET(new Request('http://localhost?siteName=test', { method: 'GET' }));
		expect(response.status).toBe(200);
		expect((await response.json()).success).toBe(true);
	});
});
