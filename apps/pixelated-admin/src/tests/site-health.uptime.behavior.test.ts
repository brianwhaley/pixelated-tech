import { describe, it, expect, vi } from 'vitest';

vi.mock('@pixelated-tech/components/server', () => ({
	getSiteConfig: async () => ({ healthCheckId: 'hc-123', url: 'https://example.com' }),
}));

vi.mock('@pixelated-tech/components/adminserver', () => ({
	checkUptimeHealth: async () => ({ success: true, data: { status: 'up' } }),
	CacheManager: class {
		constructor() {}
		get() { return null; }
		set() {}
	},
}));

describe('site-health uptime route behavior', () => {
	it('returns 400 when siteName missing', async () => {
		const route = await import('@/app/api/site-health/uptime/route');
		const response = await route.GET(new Request('http://localhost', { method: 'GET' }));
		expect(response.status).toBe(400);
	});

	it('returns success when siteName present and healthCheckId configured', async () => {
		const route = await import('@/app/api/site-health/uptime/route');
		const response = await route.GET(new Request('http://localhost?siteName=test', { method: 'GET' }));
		expect(response.status).toBe(200);
		expect((await response.json()).success).toBe(true);
	});
});
