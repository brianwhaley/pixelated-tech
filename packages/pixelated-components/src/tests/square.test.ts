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
		const applicationIdKey = ['square', 'Application', 'Id'].join('');
		const locationIdKey = ['square', 'Location', 'Id'].join('');
		const accessTokenKey = ['square', 'Access', 'Token'].join('');
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

	it('selects sandbox credentials when checkout email matches sandboxSquareEmails', async () => {
		mockGetFullPixelatedConfig.mockReturnValue(createMockConfig({
			square: {
				squareApplicationId: 'prod-app-id',
				squareLocationId: 'prod-location-id',
				squareAccessToken: 'prod-access-token',
				squareAppSecret: 'prod-app-secret',
				sandboxSquareApplicationId: 'sandbox-app-id',
				sandboxSquareLocationId: 'sandbox-location-id',
				sandboxSquareAccessToken: 'sandbox-access-token',
				sandboxSquareAppSecret: 'sandbox-app-secret',
				sandboxSquareEmails: ['sandbox@example.com'],
			},
		}));

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
				email: 'sandbox@example.com',
			},
			shippingCost: 0,
			handlingFee: 0,
			salesTax: 0,
			total: 20,
		} as CheckoutType;

		const body = buildSquarePaymentBody('source-123', checkoutData, 'idem-123');
		expect(body.location_id).toBe('sandbox-location-id');
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

	it('calls smartFetch with Square sandbox payments URL when sandbox credentials are selected', async () => {
		mockGetFullPixelatedConfig.mockReturnValue(createMockConfig({
			square: {
				squareApplicationId: 'prod-app-id',
				squareLocationId: 'prod-location-id',
				squareAccessToken: 'prod-access-token',
				squareAppSecret: 'prod-app-secret',
				sandboxSquareApplicationId: 'sandbox-app-id',
				sandboxSquareLocationId: 'sandbox-location-id',
				sandboxSquareAccessToken: 'sandbox-access-token',
				sandboxSquareAppSecret: 'sandbox-app-secret',
				sandboxSquareEmails: ['sandbox@example.com'],
			},
		}));

		const checkoutData = {
			items: [],
			subtotal: 20,
			subtotal_discount: 0,
			shippingTo: {
				name: 'Sandbox User',
				street1: '1 Sandbox St',
				city: 'Testville',
				state: 'CA',
				zip: '90210',
				country: 'US',
				email: 'sandbox@example.com',
			},
			shippingCost: 0,
			handlingFee: 0,
			salesTax: 0,
			total: 20,
		} as CheckoutType;

		const expectedResponse = { payment: { id: 'sq-456' } };
		mockSmartFetch.mockResolvedValue(expectedResponse);

		const result = await captureSquarePayment('source-456', checkoutData, 'idem-456');

		expect(mockSmartFetch).toHaveBeenCalledTimes(1);
		expect(mockSmartFetch).toHaveBeenCalledWith('https://connect.squareupsandbox.com/v2/payments', {
			responseType: 'json',
			cacheStrategy: 'none',
			requestInit: {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
					Authorization: 'Bearer sandbox-access-token',
				},
				body: expect.any(String),
			},
		});
		expect(result).toEqual(expectedResponse);
	});

	it('calls smartFetch with configured production payments URL when provided', async () => {
		mockGetFullPixelatedConfig.mockReturnValue(createMockConfig({
			square: {
				squareApplicationId: 'prod-app-id',
				squareLocationId: 'prod-location-id',
				squareAccessToken: 'prod-access-token',
				squareAppSecret: 'prod-app-secret',
				sandboxSquareApplicationId: 'sandbox-app-id',
				sandboxSquareLocationId: 'sandbox-location-id',
				sandboxSquareAccessToken: 'sandbox-access-token',
				sandboxSquareAppSecret: 'sandbox-app-secret',
				squarePaymentsUrl: 'https://custom.squareup.com/v2/payments',
			},
		}));

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

		const expectedResponse = { payment: { id: 'sq-custom' } };
		mockSmartFetch.mockResolvedValue(expectedResponse);

		const result = await captureSquarePayment('source-custom', checkoutData, 'idem-custom');

		expect(mockSmartFetch).toHaveBeenCalledWith('https://custom.squareup.com/v2/payments', expect.any(Object));
		expect(result).toEqual(expectedResponse);
	});

	it('calls smartFetch with configured sandbox payments URL when provided', async () => {
		mockGetFullPixelatedConfig.mockReturnValue(createMockConfig({
			square: {
				squareApplicationId: 'prod-app-id',
				squareLocationId: 'prod-location-id',
				squareAccessToken: 'prod-access-token',
				squareAppSecret: 'prod-app-secret',
				sandboxSquareApplicationId: 'sandbox-app-id',
				sandboxSquareLocationId: 'sandbox-location-id',
				sandboxSquareAccessToken: 'sandbox-access-token',
				sandboxSquareAppSecret: 'sandbox-app-secret',
				sandboxSquareEmails: ['sandbox@example.com'],
				sandboxSquarePaymentsUrl: 'https://custom.sandbox.squareup.com/v2/payments',
			},
		}));

		const checkoutData = {
			items: [],
			subtotal: 20,
			subtotal_discount: 0,
			shippingTo: {
				name: 'Sandbox User',
				street1: '1 Sandbox St',
				city: 'Testville',
				state: 'CA',
				zip: '90210',
				country: 'US',
				email: 'sandbox@example.com',
			},
			shippingCost: 0,
			handlingFee: 0,
			salesTax: 0,
			total: 20,
		} as CheckoutType;

		const expectedResponse = { payment: { id: 'sq-sandbox-custom' } };
		mockSmartFetch.mockResolvedValue(expectedResponse);

		const result = await captureSquarePayment('source-sandbox-custom', checkoutData, 'idem-sandbox-custom');

		expect(mockSmartFetch).toHaveBeenCalledWith('https://custom.sandbox.squareup.com/v2/payments', expect.any(Object));
		expect(result).toEqual(expectedResponse);
	});
});
