import { describe, it, expect, vi } from 'vitest';

vi.mock('@pixelated-tech/components/server', () => ({
	getSiteConfig: async () => ({ localPath: '/site-a' }),
}));

vi.mock('@pixelated-tech/components/adminserver', () => ({
	analyzeSecurityHealth: vi.fn(async () => ({ status: 'success', data: { summary: {}, vulnerabilities: [], dependencies: 0, totalDependencies: 0 } })),
	CacheManager: class {
		constructor() {}
		get() { return null; }
		set() {}
	},
}));

vi.mock('fs', async () => {
	const actual = await vi.importActual<typeof import('fs')>('fs');
	return {
		...actual,
		existsSync: () => true,
	};
});

describe('site-health security route behavior', () => {
	it('returns 400 when siteName missing', async () => {
		const route = await import('@/app/api/site-health/security/route');
		const response = await route.GET(new Request('http://localhost', { method: 'GET' }));
		expect(response.status).toBe(400);
	});

	it('returns success when siteName present and path exists', async () => {
		const route = await import('@/app/api/site-health/security/route');
		const response = await route.GET(new Request('http://localhost?siteName=test', { method: 'GET' }));
		expect(response.status).toBe(200);
		expect((await response.json()).success).toBe(true);
	});
});
