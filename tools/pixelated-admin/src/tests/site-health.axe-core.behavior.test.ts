import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@pixelated-tech/components/adminserver', () => ({
	performAxeCoreAnalysis: vi.fn(async () => {
		const key = 'site';
		return { [key]: 'test', status: 'success', data: {}, metrics: [], timestamp: new Date().toISOString() };
	}),
}));

vi.mock('@pixelated-tech/components/server', () => ({
	getRuntimeEnvFromHeaders: () => 'local',
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

describe('site-health axe-core route behavior', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it('returns 400 when siteName missing', async () => {
		const route = await import('@/app/api/site-health/axe-core/route');
		const response = await route.GET(new Request('http://localhost', { method: 'GET' }));
		expect(response.status).toBe(400);
	});

	it('returns success when siteName present', async () => {
		const route = await import('@/app/api/site-health/axe-core/route');
		const response = await route.GET(new Request('http://localhost?siteName=test', { method: 'GET' }));
		expect(response.status).toBe(200);
		const json = await response.json();
		expect(json.success).toBe(true);
		expect(json.data).toBeInstanceOf(Array);
	});
});
