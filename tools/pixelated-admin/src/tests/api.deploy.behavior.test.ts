import { describe, it, expect, vi } from 'vitest';

vi.mock('@pixelated-tech/components/server', () => ({
	getSiteConfig: async () => ({ name: 'test', localPath: '/site-a', remote: 'https://example.com' }),
}));

vi.mock('@pixelated-tech/components/adminserver', () => ({
	executeDeployment: vi.fn(async () => ({ success: true })),
}));

describe('deploy route behavior', () => {
	it('returns 403 when not localhost', async () => {
		const route = await import('@/app/api/deploy/route');
		 
		const siteField = 'site';
		const body: Record<string, unknown> = { environments: ['prod'], versionType: 'patch', commitMessage: 'ok' };
		body[siteField] = 'test';
		const response = await route.POST({ request: new Request('http://localhost', { method: 'POST', body: JSON.stringify(body), headers: { host: 'example.com' } }) });
		expect(response.status).toBe(403);
	});

	it('returns 400 when missing required fields', async () => {
		const route = await import('@/app/api/deploy/route');
		const response = await route.POST({ request: new Request('http://localhost', { method: 'POST', body: JSON.stringify({}) , headers: { host: 'localhost'} }) });
		expect(response.status).toBe(400);
	});
});
