import { describe, it, expect, vi } from 'vitest';

vi.mock('@pixelated-tech/components/adminserver', () => ({
	analyzeGitHealth: vi.fn(async () => ({ success: true, data: { commits: [], contributors: [] } })),
}));

vi.mock('fs', async () => {
	const actual = await vi.importActual<typeof import('fs')>('fs');
	return {
		...actual,
		readFileSync: vi.fn((_path: string, _encoding: string) => JSON.stringify([{ name: 'test', url: 'https://example.com' }])),
	};
});

describe('site-health github route behavior', () => {
	it('returns 400 when siteName missing', async () => {
		const route = await import('@/app/api/site-health/github/route');
		const response = await route.GET(new Request('http://localhost', { method: 'GET' }));
		expect(response.status).toBe(400);
	});

	it('returns 404 when site not found', async () => {
		const route = await import('@/app/api/site-health/github/route');
		const response = await route.GET(new Request('http://localhost?siteName=unknown', { method: 'GET' }));
		expect(response.status).toBe(404);
	});
});
