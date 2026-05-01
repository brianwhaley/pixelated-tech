import { describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/capture-payment/route';

vi.mock('@pixelated-tech/components', () => ({
	captureSquarePayment: vi.fn(async () => ({ success: true })),
}));

describe('Capture payment API route', () => {
	it('returns 400 when sourceId or checkoutData is missing', async () => {
		const result = await POST({ json: async () => ({}) } as any);
		expect(result.status).toBe(400);
		const body = await result.json();
		expect(body).toEqual({ error: 'sourceId and checkoutData are required' });
	});

	it('returns success when payment capture succeeds', async () => {
		const result = await POST({ json: async () => ({ sourceId: 'abc', checkoutData: { foo: 'bar' } }) } as any);
		expect(result.status).toBe(200);
		const body = await result.json();
		expect(body).toEqual({ success: true });
	});
});
