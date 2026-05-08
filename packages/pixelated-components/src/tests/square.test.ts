import { describe, it, expect, vi, beforeEach } from 'vitest';
import { captureSquarePayment, buildSquareOrderBody, buildSquarePaymentBody, createSquareOrder, SquarePaymentError } from '../components/shoppingcart/square';
import type { CheckoutType } from '../components/shoppingcart/shoppingcart.functions';
import { createMockConfig } from '../test/config.mock';
import { squareOrderCheckoutData } from '../test/test-data';

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
				phone: '1234567890',
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
			buyer_phone_number: '1234567890',
			statement_description_identifier: 'ThreeMusesCart',
		});
		expect(body.billing_address).toMatchObject({
			address_line_1: '123 Test Lane',
			locality: 'Testville',
			administrative_district_level_1: 'NY',
			postal_code: '10001',
			country: 'US',
		});
		expect(body.billing_address).not.toHaveProperty('address_line_2');
		expect(body.shipping_address).toMatchObject({
			address_line_1: '123 Test Lane',
			locality: 'Testville',
			administrative_district_level_1: 'NY',
			postal_code: '10001',
			country: 'US',
		});
	});

	it('builds a Square order body with cart items, registration data, shipping, handling, and taxes', () => {
		const checkoutData = {
			...(squareOrderCheckoutData as CheckoutType),
			subtotal_discount: 10,
			total: 105.78,
			shippingTo: {
				...((squareOrderCheckoutData as CheckoutType).shippingTo),
				child_name: 'Grace Sturkie',
				child_birthdate: '2017-10-21',
			},
		} as CheckoutType;

		const body = buildSquareOrderBody(checkoutData, 'order-idempotency-key');

		expect(body).toMatchObject({
			idempotency_key: 'order-idempotency-key',
			order: {
				location_id: 'test-location-id',
				line_items: [
					{
						name: 'Sewing Class',
						quantity: '2',
						base_price_money: {
							amount: 5000,
							currency: 'USD',
						},
						note: 'Beginner class',
					},
					{
						name: 'registration-data',
						quantity: '1',
						base_price_money: {
							amount: 0,
							currency: 'USD',
						},
					},
				],
				discounts: [
					{
						uid: 'SUBTOTAL_DISCOUNT',
						name: 'Subtotal discount',
						scope: 'ORDER',
						amount_money: {
							amount: 1000,
							currency: 'USD',
						},
					},
				],
			},
		});

		expect(body.order.service_charges).toEqual([
			{
				name: 'Shipping',
				amount_money: {
					amount: 500,
					currency: 'USD',
				},
				calculation_phase: 'TOTAL_PHASE',
			},
			{
				name: 'Handling',
				amount_money: {
					amount: 300,
					currency: 'USD',
				},
				calculation_phase: 'TOTAL_PHASE',
			},
		]);
		expect(body.order.taxes).toEqual([
			{
				name: 'Sales Tax',
				percentage: '6.675',
				scope: 'ORDER',
			},
		]);
		expect(body.order.fulfillments).toHaveLength(1);
		expect(body.order.line_items[1].note).toContain('Brian T Whaley');
		expect(body.order.discounts).toHaveLength(1);
		expect(body.order.line_items[1].note).toContain('child_name');
		expect(body.order.line_items[1].note).toContain('child_birthdate');
	});

	it('omits shipment fulfillment when all items are marked non-shippable', () => {
		const checkoutData = {
			...(squareOrderCheckoutData as CheckoutType),
			items: [
				{
					...(squareOrderCheckoutData.items[0] as any),
					itemIsShippable: false,
				},
			],
			shippingTo: {
				...((squareOrderCheckoutData as CheckoutType).shippingTo),
				phone: '1234567890',
			},
		} as CheckoutType;

		const body = buildSquareOrderBody(checkoutData, 'order-idempotency-key');

		expect(body.order.fulfillments).toBeUndefined();
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
			retries: 0,
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

	it('includes order_id when capturing a Square payment', async () => {
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

		const expectedResponse = { payment: { id: 'sq-ordered' } };
		mockSmartFetch.mockResolvedValue(expectedResponse);

		const result = await captureSquarePayment('source-ordered', checkoutData, 'idem-ordered', 'order-123');

		expect(mockSmartFetch).toHaveBeenCalledWith('https://connect.squareup.com/v2/payments', expect.objectContaining({
			requestInit: expect.objectContaining({
				body: expect.stringContaining('"order_id":"order-123"'),
			}),
		}));
		expect(result).toEqual(expectedResponse);
	});

	it('calls smartFetch with Square orders URL and returns response', async () => {
		const checkoutData = {
			items: [],
			subtotal: 20,
			subtotal_discount: 0,
			shippingTo: {
				name: 'Order User',
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

		const expectedResponse = { order: { id: 'order-123' } };
		mockSmartFetch.mockResolvedValue(expectedResponse);

		const result = await createSquareOrder(checkoutData, 'order-idem-123');

		expect(mockSmartFetch).toHaveBeenCalledWith('https://connect.squareup.com/v2/orders', expect.objectContaining({
			responseType: 'json',
			requestInit: expect.objectContaining({
				method: 'POST',
				body: expect.stringContaining('"idempotency_key":"order-idem-123"'),
			}),
		}));
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
			retries: 0,
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

	it('throws a typed SquarePaymentError when Square rejects the payment', async () => {
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

		mockSmartFetch.mockRejectedValue(new Error('[smartFetch] connect.squareup.com: HTTP 400 Bad Request: {"errors":[{"code":"CVV_FAILURE","detail":"Authorization error: \'CVV_FAILURE\'","category":"PAYMENT_METHOD_ERROR"}]}'));

		const capturePromise = captureSquarePayment('source-fail', checkoutData, 'idem-fail');
		await expect(capturePromise).rejects.toBeInstanceOf(SquarePaymentError);
		await expect(capturePromise).rejects.toMatchObject({
			name: 'SquarePaymentError',
			code: 'CVV_FAILURE',
			userMessage: 'Card verification failed. Please check the CVV and try again.',
		});
	});

	it('uses the route error message when Square capture returns a top-level error payload', async () => {
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

		mockSmartFetch.mockRejectedValue(new Error('[smartFetch] unknown: HTTP 500 Internal Server Error: {"error":"Please re-enter your card details and try again."}'));

		const capturePromise = captureSquarePayment('source-fail', checkoutData, 'idem-fail');
		await expect(capturePromise).rejects.toBeInstanceOf(SquarePaymentError);
		await expect(capturePromise).rejects.toMatchObject({
			name: 'SquarePaymentError',
			code: 'SQUARE_PAYMENT_FAILED',
			userMessage: 'Please re-enter your card details and try again.',
		});
	});
});
