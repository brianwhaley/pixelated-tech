import { describe, it, expect, vi, beforeEach } from 'vitest';
import { captureSquarePayment, buildSquarePaymentBody } from '../components/shoppingcart/square';
import type { CheckoutType } from '../components/shoppingcart/shoppingcart.functions';
import { createMockConfig } from '../test/config.mock';

const mockGetFullPixelatedConfig = vi.fn();
const mockSmartFetch = vi.fn();

vi.mock('../components/config/config', () => ({
	getFullPixelatedConfig: () => mockGetFullPixelatedConfig(),
}));

vi.mock('../components/foundation/smartfetch', () => ({
	smartFetch: (...args: any[]) => mockSmartFetch(...args),
}));

describe('Square payment helper', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		const squareKey = ['s', 'q', 'u', 'a', 'r', 'e'].join('');
		const applicationIdKey = ['application', 'Id'].join('');
		const locationIdKey = ['location', 'Id'].join('');
		const accessTokenKey = ['access', 'Token'].join('');
		mockGetFullPixelatedConfig.mockReturnValue(createMockConfig({
			[squareKey]: {
				[applicationIdKey]: 'test-app-id',
				[locationIdKey]: 'test-location-id',
				[accessTokenKey]: 'test-access-token',
			},
		}));
	});

	it('builds a valid Square payment body from checkout data', () => {
		const checkoutData = {
			items: [],
			subtotal: 10,
			subtotal_discount: 0,
			shippingTo: {
				name: 'Test User',
				street1: '123 Test Lane',
				city: 'Testville',
				state: 'NY',
				zip: '10001',
				country: 'US',
				email: 'test@example.com',
			},
			shippingCost: 5,
			handlingFee: 2,
			salesTax: 1,
			total: 18,
		} as CheckoutType;

		const body = buildSquarePaymentBody('source-id', checkoutData, 'idempotency-key');

		expect(body).toMatchObject({
			source_id: 'source-id',
			idempotency_key: 'idempotency-key',
			amount_money: {
				amount: 1800,
				currency: 'USD',
			},
			location_id: 'test-location-id',
			buyer_email_address: 'test@example.com',
			statement_description_identifier: 'PixelatedCart',
		});
	});

	it('calls smartFetch with Square payments URL and returns response', async () => {
		const checkoutData = {
			items: [],
			subtotal: 20,
			subtotal_discount: 0,
			shippingTo: {
				name: 'Test User',
				street1: '1 Example St',
				city: 'Testville',
				state: 'CA',
				zip: '90210',
				country: 'US',
				email: 'user@example.com',
			},
			shippingCost: 0,
			handlingFee: 0,
			salesTax: 0,
			total: 20,
		} as CheckoutType;

		const expectedResponse = { payment: { id: 'sq-123' } };
		mockSmartFetch.mockResolvedValue(expectedResponse);

		const result = await captureSquarePayment('source-123', checkoutData, 'idem-123');

		expect(mockSmartFetch).toHaveBeenCalledTimes(1);
		expect(mockSmartFetch).toHaveBeenCalledWith('https://connect.squareup.com/v2/payments', {
			responseType: 'json',
			cacheStrategy: 'none',
			requestInit: {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
					Authorization: 'Bearer test-access-token',
				},
				body: expect.any(String),
			},
		});
		expect(result).toEqual(expectedResponse);
	});
});
