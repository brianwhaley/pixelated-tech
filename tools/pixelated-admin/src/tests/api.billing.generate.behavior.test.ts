import { describe, it, expect, vi } from 'vitest';

vi.mock('@pixelated-tech/components/adminserver', () => ({
	generateInvoicePdfsForSites: vi.fn(async (sites: any[], billingMonth: string, previewOnly: boolean) => sites.map(site => ({ site, billingMonth, previewOnly, success: true }))),
}));

describe('billing generate route behavior', () => {
	it('returns 400 when sites or billingMonth missing', async () => {
		const route = await import('@/app/api/billing/generate/route');
		const response = await route.POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ sites: [] }) }));
		expect(response.status).toBe(400);
		expect((await response.json()).success).toBe(false);
	});

	it('returns success when valid payload provided', async () => {
		const route = await import('@/app/api/billing/generate/route');
		const response = await route.POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ sites: [{ name: 'test' }], billingMonth: '2024-07', previewOnly: true }) }));
		expect(response.status).toBe(200);
		expect((await response.json()).success).toBe(true);
	});
});
