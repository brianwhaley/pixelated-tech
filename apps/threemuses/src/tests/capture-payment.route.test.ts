import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/capture-payment/route';
import * as server from '@pixelated-tech/components/server';

vi.mock('@pixelated-tech/components/server', () => ({
	createSquareOrderAndCapturePayment: vi.fn(async () => ({
		success: true,
		orderResponse: { order: { id: 'order-123', total_money: { amount: 2500, currency: 'USD' } } },
	})),
}));

describe('Capture payment API route', () => {
	beforeEach(() => {
		vi.mocked(server.createSquareOrderAndCapturePayment).mockClear();
	});

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
		expect(body).toEqual({
			success: true,
			orderResponse: {
				order: {
					id: 'order-123',
					total_money: { amount: 2500, currency: 'USD' },
				},
			},
		});
	});

	it('passes validated inputs into the Square orchestration helper', async () => {
		const orchestrationSpy = vi.mocked(server.createSquareOrderAndCapturePayment);

		await POST({ json: async () => ({ sourceId: 'abc', checkoutData: { total: 1, foo: 'bar' } }) } as any);

		expect(orchestrationSpy).toHaveBeenCalledTimes(1);
		expect(orchestrationSpy).toHaveBeenCalledWith('abc', { total: 1, foo: 'bar' });
	});

});
