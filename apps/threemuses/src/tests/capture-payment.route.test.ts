import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/capture-payment/route';
import * as server from '@pixelated-tech/components/server';

vi.mock('@pixelated-tech/components/server', () => ({
	createSquareOrder: vi.fn(async () => ({ order: { id: 'order-123', total_money: { amount: 2500, currency: 'USD' } } })),
	captureSquarePayment: vi.fn(async () => ({ success: true })),
}));

describe('Capture payment API route', () => {
	beforeEach(() => {
		vi.mocked(server.createSquareOrder).mockClear();
		vi.mocked(server.captureSquarePayment).mockClear();
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

	it('passes the Square order total into the payment capture request', async () => {
		const createOrderSpy = vi.mocked(server.createSquareOrder);
		const capturePaymentSpy = vi.mocked(server.captureSquarePayment);

		await POST({ json: async () => ({ sourceId: 'abc', checkoutData: { total: 1, foo: 'bar' } }) } as any);

		expect(createOrderSpy).toHaveBeenCalledTimes(1);
		expect(capturePaymentSpy).toHaveBeenCalledWith('abc', { total: 1, foo: 'bar' }, expect.any(String), 'order-123', 25);
	});

	it('keeps checkout, order, and payment totals in sync', async () => {
		vi.mocked(server.createSquareOrder).mockResolvedValueOnce({
			order: {
				id: 'order-123',
				total_money: { amount: 2500, currency: 'USD' },
			},
		} as any);
		vi.mocked(server.captureSquarePayment).mockResolvedValueOnce({
			payment: {
				id: 'payment-123',
				amount_money: { amount: 2500, currency: 'USD' },
			},
		} as any);

		const checkoutData = { total: 25, foo: 'bar' };
		const result = await POST({ json: async () => ({ sourceId: 'abc', checkoutData }) } as any);
		const body = await result.json();

		expect(result.status).toBe(200);
		expect(vi.mocked(server.captureSquarePayment)).toHaveBeenCalledWith('abc', checkoutData, expect.any(String), 'order-123', 25);
		expect(body.orderResponse.order.total_money.amount).toBe(2500);
		expect(body.payment.amount_money.amount).toBe(2500);
		expect(body.orderResponse.order.total_money.amount).toBe(body.payment.amount_money.amount);
		expect(body.orderResponse.order.total_money.amount / 100).toBe(checkoutData.total);
	});
});
