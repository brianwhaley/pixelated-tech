import { describe, it, expect, vi } from 'vitest';

vi.mock('@pixelated-tech/components/adminserver', () => ({
	dispatchInvoiceEmails: vi.fn(async (invoices: any[]) => [{ invoice: invoices[0], status: 'sent' }]),
}));

describe('billing email route behavior', () => {
	it('returns 400 when invoices missing', async () => {
		const route = await import('@/app/api/billing/email/route');
		const response = await route.POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify({}) }));
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ success: false });
	});

	it('returns success when invoices provided', async () => {
		const route = await import('@/app/api/billing/email/route');
		const response = await route.POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ invoices: [{ siteName: 'test', pdfPath: '/tmp/test.pdf', email: 'test@example.com' }] }) }));
		expect(response.status).toBe(200);
		expect((await response.json()).success).toBe(true);
	});
});
