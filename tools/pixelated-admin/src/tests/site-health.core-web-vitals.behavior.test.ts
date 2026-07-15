import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@pixelated-tech/components/adminserver', () => ({
	performCoreWebVitalsAnalysis: vi.fn(async () => {
		const key = 'site';
		return { [key]: 'test', url: 'https://example.com', status: 'success', metrics: {}, scores: {}, categories: {}, timestamp: new Date().toISOString() };
	}),
}));

vi.mock('fs', async () => {
	const actual = await vi.importActual<typeof import('fs')>('fs');
	return {
		...actual,
		promises: {
			...actual.promises,
			readFile: vi.fn(async (_path: string, _encoding?: string) => JSON.stringify([{ name: 'test', url: 'https://example.com' }])),
		},
	};
});

describe('site-health core web vitals route behavior', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it('returns 400 when siteName missing', async () => {
		const route = await import('@/app/api/site-health/core-web-vitals/route');
		const response = await route.GET(new Request('http://localhost', { method: 'GET' }));
		expect(response.status).toBe(400);
	});

	it('returns 200 when valid siteName present', async () => {
		const route = await import('@/app/api/site-health/core-web-vitals/route');
		const response = await route.GET(new Request('http://localhost?siteName=test', { method: 'GET' }));
		expect(response.status).toBe(200);
		expect((await response.json()).success).toBe(true);
	});
});
