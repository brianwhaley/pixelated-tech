import { describe, it, expect, vi, beforeEach } from 'vitest';
import { captureSquarePayment, buildSquareOrderBody, buildSquarePaymentBody, buildSquarePaymentBodyWithOrder, createSquareOrder, createSquareOrderAndCapturePayment, getSquareConfig, getSquareStoreItems, getSquareStoreItemById, getSquareEventItems, getSquareEventItemById, SquareEventWrapper, clearSquareStoreCache } from '../components/shoppingcart/square.server';
import { SquarePaymentError, getSquarePaymentErrorMessage, getSquareStorePriceRanges, matchesSquareStorePriceRange, buildSquareStoreFilters } from '../components/shoppingcart/square';
import type { CheckoutType } from '../components/shoppingcart/shoppingcart.functions';
import { createMockConfig, deepClone, makeCheckoutData } from '../test/test-utils';
import { squareOrderCheckoutData, squareCatalogResponseWithRelatedObjects, squareCatalogResponseNoRelatedObjects, squareCatalogResponseNestedVariation, squareCatalogResponseById, squareEventCatalogObjects, pixelatedConfig } from '../test/test-data';

const mockGetFullPixelatedConfig = vi.fn();
const mockSmartFetch = vi.fn();

const squareAttributeDefinitionsResponse = {
	objects: [
		{
			type: 'CUSTOM_ATTRIBUTE_DEFINITION',
			id: '2WLTHCMSPDG36KKBW4V6JNWS',
			custom_attribute_definition_data: {
				name: 'isShippable',
				type: 'SELECTION',
				selection_config: {
					allowed_selections: [
						{ uid: 'LWSS2L5WIQFZE3SVNEYZQGWP', name: 'False' },
						{ uid: 'E43GQBXQMATRUT5RGHHACITB', name: 'True' },
					],
				},
			},
		},
	],
};

vi.mock('../components/config/config', () => ({
	getFullPixelatedConfig: () => mockGetFullPixelatedConfig(),
}));

vi.mock('../components/foundation/smartfetch', () => ({
	smartFetch: (...args: any[]) => mockSmartFetch(...args),
}));


// Local helper used only by these tests — keep it inside the test file to avoid
// exporting fixture-coupling from shared test-utils.
function makeCheckoutData(overrides: Partial<any> = {}) {
	const base = deepClone(squareOrderCheckoutData as any);
	return { ...base, ...overrides } as any;
}


describe('Square payment helper', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSmartFetch.mockReset();
		clearSquareStoreCache();
		mockGetFullPixelatedConfig.mockReturnValue(createMockConfig({ integrations: { square: pixelatedConfig.integrations.square, shoppingcart: { taxRate: 0.06675 } } }));
	});


	it('builds a valid Square payment body from checkout data', () => {
		const checkoutData = makeCheckoutData({
			items: [],
			subtotal: 10,
			subtotal_discount: 0,
			shippingTo: { name: 'Test User', street1: '123 Test Lane', city: 'Testville', state: 'NY', zip: '10001', country: 'US', email: 'test@example.com', phone: '1234567890' },
			shippingCost: 5,
			handlingFee: 2,
			salesTax: 1,
			total: 18,
		});

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
		const checkoutData = makeCheckoutData({
			...(squareOrderCheckoutData as CheckoutType),
			subtotal_discount: 10,
			total: 105.78,
			shippingTo: { ...((squareOrderCheckoutData as CheckoutType).shippingTo), child_name: 'Grace Sturkie', child_birthdate: '2017-10-21' } as any,
		});

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
		const checkoutData = deepClone(squareOrderCheckoutData as CheckoutType);
		checkoutData.items = checkoutData.items.map((it: any) => ({ ...it, itemIsShippable: false }));

		const body = buildSquareOrderBody(checkoutData, 'order-idempotency-key');

		expect(body.order.fulfillments).toBeUndefined();
	});

	it('selects sandbox credentials when checkout email matches sandboxSquareEmails', async () => {
		const cfg = deepClone(pixelatedConfig.integrations.square);
		cfg.squareItemCategoryId = 'cat-1';
		mockGetFullPixelatedConfig.mockReturnValue(createMockConfig({ integrations: { square: cfg } }));

		const checkoutData = makeCheckoutData({ shippingTo: { ...(squareOrderCheckoutData as CheckoutType).shippingTo, email: 'sandbox@example.com' } });

		const body = buildSquarePaymentBody('source-123', checkoutData, 'idem-123');
		expect(body.location_id).toBe('sandbox-location-id');
	});

	it('calls smartFetch with Square payments URL and returns response', async () => {
		const checkoutData = squareOrderCheckoutData as CheckoutType;

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
		const checkoutData = squareOrderCheckoutData as CheckoutType;

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
		const checkoutData = squareOrderCheckoutData as CheckoutType;

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
		mockGetFullPixelatedConfig.mockReturnValue(createMockConfig({ integrations: { square: pixelatedConfig.integrations.square } }));

		const checkoutData = makeCheckoutData({ shippingTo: { ...(squareOrderCheckoutData as CheckoutType).shippingTo, email: 'sandbox@example.com' } });

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
		const custom = deepClone(pixelatedConfig.integrations.square);
		custom.squarePaymentsUrl = 'https://custom.squareup.com/v2/payments';
		mockGetFullPixelatedConfig.mockReturnValue(createMockConfig({ integrations: { square: custom } }));

		const checkoutData = squareOrderCheckoutData as CheckoutType;

		const expectedResponse = { payment: { id: 'sq-custom' } };
		mockSmartFetch.mockResolvedValue(expectedResponse);

		const result = await captureSquarePayment('source-custom', checkoutData, 'idem-custom');

		expect(mockSmartFetch).toHaveBeenCalledWith('https://custom.squareup.com/v2/payments', expect.any(Object));
		expect(result).toEqual(expectedResponse);
	});

	it('calls smartFetch with configured sandbox payments URL when provided', async () => {
		const custom = deepClone(pixelatedConfig.integrations.square);
		custom.sandboxSquarePaymentsUrl = 'https://custom.sandbox.squareup.com/v2/payments';
		mockGetFullPixelatedConfig.mockReturnValue(createMockConfig({ integrations: { square: custom } }));

		const checkoutData = makeCheckoutData({ shippingTo: { ...(squareOrderCheckoutData as CheckoutType).shippingTo, email: 'sandbox@example.com' } });

		const expectedResponse = { payment: { id: 'sq-sandbox-custom' } };
		mockSmartFetch.mockResolvedValue(expectedResponse);

		const result = await captureSquarePayment('source-sandbox-custom', checkoutData, 'idem-sandbox-custom');

		expect(mockSmartFetch).toHaveBeenCalledWith('https://custom.sandbox.squareup.com/v2/payments', expect.any(Object));
		expect(result).toEqual(expectedResponse);
	});

	it('throws a typed SquarePaymentError when Square rejects the payment', async () => {
		const checkoutData = squareOrderCheckoutData as CheckoutType;

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
		const checkoutData = squareOrderCheckoutData as CheckoutType;

		mockSmartFetch.mockRejectedValue(new Error('[smartFetch] unknown: HTTP 500 Internal Server Error: {"error":"Please re-enter your card details and try again."}'));

		const capturePromise = captureSquarePayment('source-fail', checkoutData, 'idem-fail');
		await expect(capturePromise).rejects.toBeInstanceOf(SquarePaymentError);
		await expect(capturePromise).rejects.toMatchObject({
			name: 'SquarePaymentError',
			code: 'SQUARE_PAYMENT_FAILED',
			userMessage: 'Please re-enter your card details and try again.',
		});
	});

	it('returns undefined for incomplete Square credentials', () => {
		mockGetFullPixelatedConfig.mockReturnValue(createMockConfig({ integrations: { square: { squareApplicationId: 'app', squareLocationId: 'loc' } } }));
		const credentials = getSquareConfig();
		expect(credentials).toBeUndefined();
	});

	it('selects sandbox credentials when square.environment is sandbox', () => {
		mockGetFullPixelatedConfig.mockReturnValue(createMockConfig({ integrations: { square: {
			environment: 'sandbox',
			sandboxSquareApplicationId: 'sandbox-app',
			sandboxSquareLocationId: 'sandbox-loc',
			sandboxSquareAccessToken: 'sandbox-token',
			sandboxSquarePaymentsUrl: 'https://custom.sandbox.squareup.com/v2/payments',
			squareApplicationId: 'prod-app',
			squareLocationId: 'prod-loc',
			squareAccessToken: 'prod-token',
		} } }));

		const credentials = getSquareConfig();

		expect(credentials).toMatchObject({
			applicationId: 'sandbox-app',
			locationId: 'sandbox-loc',
			accessToken: 'sandbox-token',
			paymentsUrl: 'https://custom.sandbox.squareup.com/v2/payments',
		});
	});

	it('builds a payment body without buyer email or phone when contact info is blank', () => {
		const checkoutData = makeCheckoutData({
			shippingTo: { name: 'Test User', street1: '123 Test Lane', city: 'Testville', state: 'NY', zip: '10001', country: 'US', email: '', phone: '' },
		});

		const body = buildSquarePaymentBodyWithOrder('source-no-contact', checkoutData, 'idem-no-contact');

		expect(body).not.toHaveProperty('buyer_email_address');
		expect(body).not.toHaveProperty('buyer_phone_number');
	});

	it('omits registration line item when no registration data exists', () => {
		const checkoutData = makeCheckoutData({
			subtotal_discount: 0,
			shippingTo: { name: 'Test User', street1: '123 Test Lane', city: 'Testville', state: 'NY', zip: '10001', country: 'US', email: 'test@example.com', phone: '1234567890' },
		});

		delete (checkoutData as any).shippingTo.child_name;
		delete (checkoutData as any).shippingTo.child_birthdate;

		const body = buildSquareOrderBody(checkoutData, 'order-no-registration');
		expect(body.order.line_items).toHaveLength((checkoutData.items || []).length);
		expect(body.order.line_items.some((item: any) => item.name === 'registration-data')).toBe(false);
	});

	it('omits service charges, taxes, and fulfillment when shipping and tax are disabled', () => {
		const cfg = deepClone(pixelatedConfig.integrations.square);
		mockGetFullPixelatedConfig.mockReturnValue(createMockConfig({ integrations: { square: cfg, shoppingcart: { taxRate: 0 } } }));

		const checkoutData = makeCheckoutData({
			shippingCost: 0,
			handlingFee: 0,
			subtotal_discount: 0,
			items: (squareOrderCheckoutData as CheckoutType).items.map((item: any) => ({ ...item, itemIsShippable: false })),
		});

		const body = buildSquareOrderBody(checkoutData, 'order-no-shipping');
		expect(body.order.service_charges).toBeUndefined();
		expect(body.order.taxes).toBeUndefined();
		expect(body.order.fulfillments).toBeUndefined();
	});

	it('creates a generic SquarePaymentError when response body JSON is malformed', async () => {
		const checkoutData = squareOrderCheckoutData as CheckoutType;
		mockSmartFetch.mockRejectedValue(new Error('[smartFetch] connect.squareup.com: HTTP 500 Internal Server Error: {invalid json'));

		await expect(captureSquarePayment('source-malformed', checkoutData, 'idem-malformed')).rejects.toMatchObject({
			name: 'SquarePaymentError',
			code: 'SQUARE_PAYMENT_FAILED',
			userMessage: 'Your payment could not be processed. Please try again.',
		});
	});

	it('creates an order and captures payment using the Square order id and total_money amount from the order response', async () => {
		const checkoutData = squareOrderCheckoutData as CheckoutType;
		const orderResponse = {
			order: {
				id: 'order-123',
				total_money: { amount: 12345 },
			},
		};
		const captureResponse = { payment: { id: 'sq-captured' } };

		mockSmartFetch.mockResolvedValueOnce(orderResponse);
		mockSmartFetch.mockResolvedValueOnce(captureResponse);

		const result = await createSquareOrderAndCapturePayment('source-captured', checkoutData);

		expect(mockSmartFetch).toHaveBeenNthCalledWith(1, expect.stringContaining('/v2/orders'), expect.any(Object));
		expect(mockSmartFetch).toHaveBeenNthCalledWith(2, expect.stringContaining('/v2/payments'), expect.objectContaining({
			requestInit: expect.objectContaining({
				body: expect.stringContaining('"order_id":"order-123"'),
			}),
		}));
		expect(result.orderResponse).toEqual(orderResponse);
		expect(result.payment).toEqual(captureResponse.payment);
	});

	it('creates an order and falls back to order_id when the order.id field is absent', async () => {
		const checkoutData = makeCheckoutData({ total: 42 });
		const orderResponse = {
			order_id: 'fallback-order-123',
		};
		const captureResponse = { payment: { id: 'sq-fallback' } };

		mockSmartFetch.mockResolvedValueOnce(orderResponse);
		mockSmartFetch.mockResolvedValueOnce(captureResponse);

		const result = await createSquareOrderAndCapturePayment('source-fallback', checkoutData);

		expect(mockSmartFetch).toHaveBeenNthCalledWith(2, expect.stringContaining('/v2/payments'), expect.objectContaining({
			requestInit: expect.objectContaining({
				body: expect.stringContaining('"order_id":"fallback-order-123"'),
				body: expect.stringContaining('"amount":4200'),
			}),
		}));
		expect(result.orderResponse).toEqual(orderResponse);
	});

	it('creates an order and falls back to order id from response.id when order_id and order.id are unavailable', async () => {
		const checkoutData = makeCheckoutData({ total: 53 });
		const orderResponse = {
			id: 'legacy-order-id',
		};
		const captureResponse = { payment: { id: 'sq-legacy' } };

		mockSmartFetch.mockResolvedValueOnce(orderResponse);
		mockSmartFetch.mockResolvedValueOnce(captureResponse);

		const result = await createSquareOrderAndCapturePayment('source-legacy', checkoutData);

		expect(mockSmartFetch).toHaveBeenNthCalledWith(2, expect.stringContaining('/v2/payments'), expect.objectContaining({
			requestInit: expect.objectContaining({
				body: expect.stringContaining('"order_id":"legacy-order-id"'),
				body: expect.stringContaining('"amount":5300'),
			}),
		}));
		expect(result.orderResponse).toEqual(orderResponse);
	});

	it('returns correct Square store price range labels and ignores invalid prices', () => {
		const items = [
			{ itemPrice: 10 },
			{ itemPrice: 25 },
			{ itemPrice: 1200 },
			{ itemPrice: NaN },
		] as any[];

		expect(getSquareStorePriceRanges(items)).toEqual(['Under $25', '$25 - $50', '$1000+']);
		expect(matchesSquareStorePriceRange(25, 'Under $25')).toBe(true);
		expect(matchesSquareStorePriceRange(NaN, 'Under $25')).toBe(false);
		expect(matchesSquareStorePriceRange(1000, '$1000+')).toBe(true);
		expect(matchesSquareStorePriceRange(1000, 'Invalid Range')).toBe(false);
	});

	it('builds square store filters from item categories only and ignores property filters', () => {
		const items = [
			{
				itemPrice: 25,
				categories: [{ id: 'cat-1', name: 'Boutique' }],
				properties: { Color: 'Blue', Empty: '' },
			},
			{
				itemPrice: 10,
				properties: { Material: 'Wool' },
			},
		] as any[];

		const filters = buildSquareStoreFilters(items);
		expect(filters).toEqual(expect.arrayContaining([
			{ name: 'Category', values: [{ value: 'cat-1', label: 'Boutique' }] },
		]));
		expect(filters.some((filter) => filter.name === 'Color')).toBe(false);
		expect(filters.some((filter) => filter.name === 'Material')).toBe(false);

		const priceRange = filters.find((filter) => filter.name === 'Price Range');
		expect(priceRange).toBeDefined();
		expect(priceRange?.values).toEqual(expect.arrayContaining([
			{ value: 'Under $25', label: 'Under $25' },
			{ value: '$25 - $50', label: '$25 - $50' },
		]));
	});

	it('returns empty price ranges when there are no valid item prices', () => {
		expect(getSquareStorePriceRanges([{ itemPrice: NaN }, { itemPrice: undefined } as any])).toEqual([]);
		expect(matchesSquareStorePriceRange(NaN, 'Under $25')).toBe(false);
		expect(matchesSquareStorePriceRange(1200, '$1000+')).toBe(true);
		expect(matchesSquareStorePriceRange(50, 'Invalid Range')).toBe(false);
	});

	it('builds no filters for blank categories and property values', () => {
		const items = [
			{
				itemPrice: 30,
				categories: [{ id: '', name: 'Boutique' }, { id: 'cat-2', name: '' }],
				properties: { Color: '', Material: '  ' },
			},
		] as any[];

		const filters = buildSquareStoreFilters(items);
		expect(filters).toEqual([{ name: 'Price Range', values: [{ value: '$25 - $50', label: '$25 - $50' }] }]);
	});

	it('creates a SquarePaymentError when Square returns a CARD_TOKEN_USED or GENERIC_DECLINE response', async () => {
		const checkoutData = squareOrderCheckoutData as CheckoutType;

		mockSmartFetch.mockRejectedValueOnce(new Error('[smartFetch] connect.squareup.com: HTTP 400 Bad Request: {"errors":[{"code":"CARD_TOKEN_USED","detail":"Authorization error: \'CARD_TOKEN_USED\'","category":"PAYMENT_METHOD_ERROR"}]}'));
		await expect(captureSquarePayment('source-card-used', checkoutData, 'idem-card-used')).rejects.toMatchObject({
			name: 'SquarePaymentError',
			code: 'CARD_TOKEN_USED',
			userMessage: 'Please re-enter your card details and try again.',
		});

		mockSmartFetch.mockRejectedValueOnce(new Error('[smartFetch] connect.squareup.com: HTTP 400 Bad Request: {"errors":[{"code":"GENERIC_DECLINE","detail":"Decline error","category":"PAYMENT_METHOD_ERROR"}]}'));
		await expect(captureSquarePayment('source-decline', checkoutData, 'idem-decline')).rejects.toMatchObject({
			name: 'SquarePaymentError',
			code: 'GENERIC_DECLINE',
			userMessage: 'Your card was declined. Please try a different card or contact your bank.',
		});
	});

	it('returns user-friendly Square error messages from SquarePaymentError and payload error fields', () => {
		expect(getSquarePaymentErrorMessage(new SquarePaymentError('X', 'User error message'))).toBe('User error message');
		expect(getSquarePaymentErrorMessage(new Error('[smartFetch] unknown: HTTP 500 Internal Server Error: {"error":"Please retry again."}'))).toBe('Please retry again.');
	});

	it('returns store items by direct ID, slug, and parsed id fallback', async () => {
		const cfg = deepClone(pixelatedConfig.integrations.square);
		mockGetFullPixelatedConfig.mockReturnValue(createMockConfig({ integrations: { square: cfg } }));

		const squareCatalogResponse = squareCatalogResponseById;

		const inventoryResponse = {
			counts: [
				{ catalog_object_id: 'var-123', quantity: '2' },
				{ catalog_object_id: 'var-456', quantity: '5' },
			],
		};

		mockSmartFetch.mockResolvedValueOnce(squareAttributeDefinitionsResponse);
		mockSmartFetch.mockResolvedValueOnce(squareCatalogResponse);
		mockSmartFetch.mockResolvedValueOnce(inventoryResponse);

		const response = await getSquareStoreItems();
		const direct = await getSquareStoreItemById('item-123');
		const slug = await getSquareStoreItemById('test-item');
		const parsed = await getSquareStoreItemById('test-123');

		expect(response.items).toHaveLength(2);
		expect(direct?.itemID).toBe('item-123');
		expect(slug?.itemURL).toContain('/test-item');
		expect(parsed?.itemID).toBe('123');
	});

	it('creates an order and captures payment using the Square order id and total_money amount from the order response', async () => {
		expect(getSquarePaymentErrorMessage(new SquarePaymentError('X', 'User error message'))).toBe('User error message');
		expect(getSquarePaymentErrorMessage(new Error('[smartFetch] error: {"error":"Please re-enter your card details and try again."}'))).toBe('Please re-enter your card details and try again.');
		expect(getSquarePaymentErrorMessage(new Error('Card verification failed. Please check the CVV and try again.'))).toBe('Card verification failed. Please check the CVV and try again.');
		expect(getSquarePaymentErrorMessage(new Error('Some other issue occurred'))).toBeUndefined();
	});

	it('throws when Square store configuration is missing', async () => {
		mockGetFullPixelatedConfig.mockReturnValue({});
		await expect(getSquareStoreItems()).rejects.toThrow('Square configuration is required for store items.');
	});

	it('throws when squareItemCategoryId is missing for store items', async () => {
		const cfg = deepClone(pixelatedConfig.integrations.square);
		delete cfg.squareItemCategoryId;
		mockGetFullPixelatedConfig.mockReturnValue(createMockConfig({ integrations: { square: cfg } }));
		await expect(getSquareStoreItems()).rejects.toThrow('square.squareItemCategoryId is required to fetch Square boutique items.');
	});

	it('fetches Square store items and returns filter metadata', async () => {
		const squareCatalogResponse = squareCatalogResponseWithRelatedObjects;
		const inventoryResponse = {
			counts: [
				{ catalog_object_id: 'var-1', quantity: '3' },
			],
		};

		mockGetFullPixelatedConfig.mockReturnValue(createMockConfig({ integrations: { square: pixelatedConfig.integrations.square } }));

		mockSmartFetch.mockResolvedValueOnce(squareAttributeDefinitionsResponse);
		mockSmartFetch.mockResolvedValueOnce(squareCatalogResponse);
		mockSmartFetch.mockResolvedValueOnce(inventoryResponse);

		const response = await getSquareStoreItems();

		expect(mockSmartFetch.mock.calls[1][0]).toContain('/v2/catalog/search-catalog-items');
		expect(mockSmartFetch.mock.calls[1][1]).toEqual(expect.objectContaining({
			responseType: 'json',
			requestInit: expect.objectContaining({
				method: 'POST',
				headers: expect.objectContaining({
					Authorization: 'Bearer test-access-token',
					'Square-Version': '2026-05-20',
				}),
				body: JSON.stringify({ category_ids: ['cat-1'], include_related_objects: true }),
			}),
		}));

		expect(response.items).toHaveLength(1);
		expect(response.items[0]).toMatchObject({
			itemID: 'item-1',
			itemTitle: 'Artisan Tray',
			itemImageURL: 'https://example.com/image.jpg',
			itemPrice: 45,
			itemInventory: 3,
			properties: { Color: 'White' },
			categoryPath: ['cat-1'],
		});
		expect(response.filters).toEqual(expect.arrayContaining([
			{ name: 'Category', values: [{ value: 'cat-1', label: 'Boutique' }] },
			{ name: 'Price Range', values: [{ value: '$25 - $50', label: '$25 - $50' }] },
		]));
		expect(response.filters.some((filter) => filter.name === 'Color')).toBe(false);
	});

	it('resolves raw Square selection UID values for isShippable as true', async () => {
		const squareCatalogResponse = deepClone(squareCatalogResponseWithRelatedObjects);
		const inventoryResponse = {
			counts: [
				{ catalog_object_id: 'var-1', quantity: '3' },
			],
		};

		const attributeDefinitionsResponse = {
			objects: [
				{
					type: 'CUSTOM_ATTRIBUTE_DEFINITION',
					id: '2WLTHCMSPDG36KKBW4V6JNWS',
					custom_attribute_definition_data: {
						name: 'isShippable',
						type: 'SELECTION',
						selection_config: {
							allowed_selections: [
								{ uid: 'LWSS2L5WIQFZE3SVNEYZQGWP', name: 'False' },
								{ uid: 'E43GQBXQMATRUT5RGHHACITB', name: 'True' },
							],
						},
					},
				},
			],
		};

		const itemObject = (squareCatalogResponse.objects || []).find((o: any) => o.type === 'ITEM' && o.id === 'item-1');
		if (itemObject?.item_data) {
			itemObject.item_data.is_shippable = 'E43GQBXQMATRUT5RGHHACITB';
		}

		mockGetFullPixelatedConfig.mockReturnValue(createMockConfig({ integrations: { square: pixelatedConfig.integrations.square } }));

		mockSmartFetch.mockResolvedValueOnce(attributeDefinitionsResponse);
		mockSmartFetch.mockResolvedValueOnce(squareCatalogResponse);
		mockSmartFetch.mockResolvedValueOnce(inventoryResponse);

		const response = await getSquareStoreItems();

		expect(response.items).toHaveLength(1);
		expect(response.items[0].itemIsShippable).toBe(true);
	});

	it('defaults itemIsShippable to false when no shippable flags are present', async () => {
		const squareCatalogResponse = deepClone(squareCatalogResponseWithRelatedObjects);
		const inventoryResponse = {
			counts: [
				{ catalog_object_id: 'var-1', quantity: '3' },
			],
		};

		const itemObject = (squareCatalogResponse.objects || []).find((o: any) => o.type === 'ITEM' && o.id === 'item-1');
		if (itemObject?.item_data) {
			itemObject.item_data.is_shippable = undefined;
			itemObject.item_data.custom_attribute_values = [];
		}

		mockGetFullPixelatedConfig.mockReturnValue(createMockConfig({ integrations: { square: pixelatedConfig.integrations.square } }));

		mockSmartFetch.mockResolvedValueOnce(squareAttributeDefinitionsResponse);
		mockSmartFetch.mockResolvedValueOnce(squareCatalogResponse);
		mockSmartFetch.mockResolvedValueOnce(inventoryResponse);

		const response = await getSquareStoreItems();

		expect(response.items).toHaveLength(1);
		expect(response.items[0].itemIsShippable).toBe(false);
	});

	it('resolves string values for isShippable to true', async () => {
		const squareCatalogResponse = deepClone(squareCatalogResponseWithRelatedObjects);
		const inventoryResponse = {
			counts: [
				{ catalog_object_id: 'var-1', quantity: '3' },
			],
		};

		const itemObject = (squareCatalogResponse.objects || []).find((o: any) => o.type === 'ITEM' && o.id === 'item-1');
		if (itemObject?.item_data) {
			itemObject.item_data.is_shippable = 'yes';
		}

		mockGetFullPixelatedConfig.mockReturnValue(createMockConfig({ integrations: { square: pixelatedConfig.integrations.square } }));

		mockSmartFetch.mockResolvedValueOnce(squareAttributeDefinitionsResponse);
		mockSmartFetch.mockResolvedValueOnce(squareCatalogResponse);
		mockSmartFetch.mockResolvedValueOnce(inventoryResponse);

		const response = await getSquareStoreItems();

		expect(response.items).toHaveLength(1);
		expect(response.items[0].itemIsShippable).toBe(true);
	});

	it('parses Square item weight from string values and keeps unit only when weight exists', async () => {
		const squareCatalogResponse = deepClone(squareCatalogResponseWithRelatedObjects);
		const inventoryResponse = {
			counts: [
				{ catalog_object_id: 'var-1', quantity: '3' },
			],
		};

		const variationObject = (squareCatalogResponse.objects || []).find((o: any) => o.type === 'ITEM_VARIATION' && o.id === 'var-1');
		if (variationObject?.item_variation_data) {
			variationObject.item_variation_data.item_weight = '1.25';
			variationObject.item_variation_data.item_weight_unit = 'lb';
		}

		mockGetFullPixelatedConfig.mockReturnValue(createMockConfig({ integrations: { square: pixelatedConfig.integrations.square } }));

		mockSmartFetch.mockResolvedValueOnce(squareAttributeDefinitionsResponse);
		mockSmartFetch.mockResolvedValueOnce(squareCatalogResponse);
		mockSmartFetch.mockResolvedValueOnce(inventoryResponse);

		const response = await getSquareStoreItems();

		expect(response.items).toHaveLength(1);
		expect(response.items[0].itemWeight).toBe(1.25);
		expect(response.items[0].itemWeightUnit).toBe('lb');
	});

	it('maps Square custom property weight into itemWeight and unit', async () => {
		const squareCatalogResponse = deepClone(squareCatalogResponseWithRelatedObjects);
		const inventoryResponse = {
			counts: [
				{ catalog_object_id: 'var-1', quantity: '3' },
			],
		};

		const itemObject = (squareCatalogResponse.objects || []).find((o: any) => o.type === 'ITEM' && o.id === 'item-1');
		if (itemObject?.item_data) {
			itemObject.item_data.custom_attribute_values = [
				{ name: 'Shippable Weight', string_value: '1.0' },
				{ name: 'Weight Unit', string_value: 'lb' },
			];
		}

		mockGetFullPixelatedConfig.mockReturnValue(createMockConfig({ integrations: { square: pixelatedConfig.integrations.square } }));

		mockSmartFetch.mockResolvedValueOnce(squareAttributeDefinitionsResponse);
		mockSmartFetch.mockResolvedValueOnce(squareCatalogResponse);
		mockSmartFetch.mockResolvedValueOnce(inventoryResponse);

		const response = await getSquareStoreItems();

		expect(response.items).toHaveLength(1);
		expect(response.items[0].itemWeight).toBe(1);
		expect(response.items[0].itemWeightUnit).toBe('lb');
	});

	it('supports multiple squareItemCategoryId values and requests all configured categories', async () => {
		const squareCatalogResponse = squareCatalogResponseWithRelatedObjects;
		const inventoryResponse = {
			counts: [
				{ catalog_object_id: 'var-1', quantity: '3' },
			],
		};

		const cfg = deepClone(pixelatedConfig.integrations.square);
		cfg.squareItemCategoryId = ['cat-1', 'cat-2'];
		mockGetFullPixelatedConfig.mockReturnValue(createMockConfig({ integrations: { square: cfg } }));

		mockSmartFetch.mockResolvedValueOnce(squareAttributeDefinitionsResponse);
		mockSmartFetch.mockResolvedValueOnce(squareCatalogResponse);
		mockSmartFetch.mockResolvedValueOnce(inventoryResponse);

		const response = await getSquareStoreItems();

		expect(mockSmartFetch.mock.calls[1][0]).toContain('/v2/catalog/search-catalog-items');
		expect(mockSmartFetch.mock.calls[1][1]).toEqual(expect.objectContaining({
			responseType: 'json',
			requestInit: expect.objectContaining({
				method: 'POST',
				headers: expect.objectContaining({
					Authorization: 'Bearer test-access-token',
					'Square-Version': '2026-05-20',
				}),
				body: JSON.stringify({ category_ids: ['cat-1', 'cat-2'], include_related_objects: true }),
			}),
		}));

		expect(response.items).toHaveLength(1);
	});

	it('collects all assigned categories for boutique items and builds multiple category filters', async () => {
		const squareCatalogResponse = deepClone(squareCatalogResponseWithRelatedObjects);
		// simulate item referencing an additional category that's not included in related_objects
		const itemObj = (squareCatalogResponse.objects || []).find((o: any) => o.type === 'ITEM' && o.id === 'item-1');
		if (itemObj && itemObj.item_data) {
			itemObj.item_data.categories = (itemObj.item_data.categories || []).concat([{ id: 'cat-2' }]);
		}
		const categoryListResponse = { objects: [{ type: 'CATEGORY', id: 'cat-2', category_data: { name: 'Featured' } }] };
		const inventoryResponse = { counts: [{ catalog_object_id: 'var-1', quantity: '5' }] };

		mockGetFullPixelatedConfig.mockReturnValue(createMockConfig({ integrations: { square: pixelatedConfig.integrations.square } }));

		mockSmartFetch.mockResolvedValueOnce(squareAttributeDefinitionsResponse);
		mockSmartFetch.mockResolvedValueOnce(squareCatalogResponse);
		mockSmartFetch.mockResolvedValueOnce(categoryListResponse);
		mockSmartFetch.mockResolvedValueOnce(inventoryResponse);

		const response = await getSquareStoreItems();

		// ensure inventory and catalog search were requested and response contains expected categories
		const calledUrls = mockSmartFetch.mock.calls.map((c: any) => String(c[0]));
		expect(calledUrls).toEqual(expect.arrayContaining([expect.stringContaining('/v2/catalog/search-catalog-items'), expect.stringContaining('/v2/inventory/batch-retrieve-counts')]));
		expect(response.items).toHaveLength(1);
		expect(response.items[0].categoryPath).toEqual(expect.arrayContaining(['cat-1', 'cat-2']));
		expect(response.items[0].categories).toEqual(expect.arrayContaining([
			{ id: 'cat-1', name: 'Boutique' },
			{ id: 'cat-2', name: 'Featured' },
		]));
		expect(response.filters).toEqual(expect.arrayContaining([
			{
				name: 'Category',
				values: expect.arrayContaining([
					{ value: 'cat-1', label: 'Boutique' },
					{ value: 'cat-2', label: 'Featured' },
				]),
			},
		]));
	});

	it('does not build category filters when category metadata lacks names', async () => {
		const squareCatalogResponse = deepClone(squareCatalogResponseWithRelatedObjects);
		// clear category names to simulate missing category metadata
		const categoryObj = squareCatalogResponse.objects.find((o: any) => o.type === 'CATEGORY' && o.id === 'cat-1');
		if (categoryObj) categoryObj.category_data = {};

		const inventoryResponse = {
			counts: [
				{ catalog_object_id: 'var-1', quantity: '3' },
			],
		};

		mockGetFullPixelatedConfig.mockReturnValue(createMockConfig({ integrations: { square: pixelatedConfig.integrations.square } }));

		mockSmartFetch.mockResolvedValueOnce(squareCatalogResponse);
		mockSmartFetch.mockResolvedValueOnce(inventoryResponse);

		const response = await getSquareStoreItems();

		expect(response.filters).not.toEqual(expect.arrayContaining([
			{ name: 'Category', values: [{ value: 'cat-1', label: 'Boutique' }] },
		]));
	});

	it('falls back to batch retrieving image objects when related_objects are missing', async () => {
		const squareCatalogResponse = squareCatalogResponseNoRelatedObjects;
		const categoryListResponse = {
			objects: [
				{ type: 'CATEGORY', id: 'cat-1', category_data: { name: 'Boutique' } },
			],
		};
		const imageBatchResponse = {
			objects: [
				{
					type: 'IMAGE',
					id: 'img-2',
					image_data: { url: 'https://example.com/batch-image.jpg' },
				},
			],
		};
		const inventoryResponse = {
			counts: [{ catalog_object_id: 'var-2', quantity: '2' }],
		};

		mockGetFullPixelatedConfig.mockReturnValue(createMockConfig({ integrations: { square: pixelatedConfig.integrations.square } }));

		mockSmartFetch.mockResolvedValueOnce(squareAttributeDefinitionsResponse);
		mockSmartFetch.mockResolvedValueOnce(squareCatalogResponse);
		mockSmartFetch.mockResolvedValueOnce(categoryListResponse);
		mockSmartFetch.mockResolvedValueOnce(imageBatchResponse);
		mockSmartFetch.mockResolvedValueOnce(inventoryResponse);

		const response = await getSquareStoreItems();

		const calledUrls = mockSmartFetch.mock.calls.map((c: any) => String(c[0]));
		expect(calledUrls).toEqual(expect.arrayContaining([expect.stringContaining('/v2/catalog/list?types=CATEGORY'), expect.stringContaining('/v2/catalog/batch-retrieve')]));
		expect(response.items).toHaveLength(1);
		expect(response.items[0]).toMatchObject({
			itemID: 'item-2',
			itemTitle: 'Batch Image Item',
			itemImageURL: 'https://example.com/batch-image.jpg',
			itemImageURLs: ['https://example.com/batch-image.jpg'],
			itemPrice: 25,
			itemInventory: 2,
			categoryPath: ['cat-1'],
		});
		expect(response.filters).toEqual(expect.arrayContaining([
			{ name: 'Category', values: [{ value: 'cat-1', label: 'Boutique' }] },
		]));
	});

	it('uses nested item_data.variations for store item pricing when no top-level item_variations are present', async () => {
		const squareCatalogResponse = squareCatalogResponseNestedVariation;
		const inventoryResponse = {
			counts: [{ catalog_object_id: 'var-2', quantity: '5' }],
		};

		const cfg2 = deepClone(pixelatedConfig.integrations.square);
		cfg2.squareItemCategoryId = 'cat-2';
		mockGetFullPixelatedConfig.mockReturnValue(createMockConfig({ integrations: { square: cfg2 } }));

		mockSmartFetch.mockResolvedValueOnce(squareAttributeDefinitionsResponse);
		mockSmartFetch.mockResolvedValueOnce(squareCatalogResponse);
		mockSmartFetch.mockResolvedValueOnce(inventoryResponse);

		const response = await getSquareStoreItems();

		expect(response.items).toHaveLength(1);
		expect(response.items[0].itemID).toBe('item-2');
		expect(response.items[0].itemPrice).toBe(25);
		expect(response.items[0].itemInventory).toBe(5);
		expect(response.items[0].categoryPath).toEqual(expect.arrayContaining(['cat-2']));
	});

	it('finds a single Square store item by id', async () => {
		const squareCatalogResponse = squareCatalogResponseWithRelatedObjects;
		const inventoryResponse = {
			counts: [{ catalog_object_id: 'var-1', quantity: '3' }],
		};

		mockGetFullPixelatedConfig.mockReturnValue(createMockConfig({ integrations: { square: pixelatedConfig.integrations.square } }));

		mockSmartFetch.mockResolvedValueOnce(squareAttributeDefinitionsResponse);
		mockSmartFetch.mockResolvedValueOnce(squareCatalogResponse);
		mockSmartFetch.mockResolvedValueOnce(inventoryResponse);

		const item = await getSquareStoreItemById('item-1');

		expect(item).toBeDefined();
		expect(item?.itemID).toBe('item-1');
		expect(item?.itemTitle).toBe('Artisan Tray');

		const slugItem = await getSquareStoreItemById('artisan-tray');
		expect(slugItem).toBeDefined();
		expect(slugItem?.itemID).toBe('item-1');
		expect(slugItem?.itemURL).toBe('/store/artisan-tray');
	});

	it('should fetch square event items and resolve event IDs and slugs', async () => {
		const cfg = deepClone(pixelatedConfig.integrations.square);
		mockGetFullPixelatedConfig.mockReturnValue(createMockConfig({ integrations: { square: cfg } }));

		const eventObjects = squareEventCatalogObjects;

		mockSmartFetch.mockResolvedValueOnce(squareAttributeDefinitionsResponse);
		mockSmartFetch.mockResolvedValueOnce({ objects: eventObjects, cursor: undefined });
		mockSmartFetch.mockResolvedValueOnce({ counts: [{ catalog_object_id: 'var-1', quantity: '2' }] });

		const response = await getSquareEventItems();
		expect(response).toHaveLength(1);
		expect(response[0].fields.id).toBe('item-1');
		expect(response[0].fields.status).toBe('open');
		expect(response[0].fields.carouselImages).toEqual([{ image: 'https://example.com/event.jpg' }]);

		const direct = await getSquareEventItemById('item-1');
		expect(direct).toBeDefined();
		expect(direct?.fields.title).toBe('Test Event');

		const slug = await getSquareEventItemById('test-event');
		expect(slug).toBeDefined();
		expect(slug?.fields.id).toBe('item-1');
	});

	it('should support SquareEventWrapper list and detail modes', async () => {
		const cfg = deepClone(pixelatedConfig.integrations.square);
		mockGetFullPixelatedConfig.mockReturnValue(createMockConfig({ integrations: { square: cfg } }));

		const eventObjects = squareEventCatalogObjects;

		mockSmartFetch.mockResolvedValueOnce(squareAttributeDefinitionsResponse);
		mockSmartFetch.mockResolvedValueOnce({ objects: eventObjects, cursor: undefined });
		mockSmartFetch.mockResolvedValueOnce({ counts: [{ catalog_object_id: 'var-1', quantity: '2' }] });

		const listResult = await SquareEventWrapper({ type: 'list' });
		expect(Array.isArray(listResult)).toBe(true);
		expect((listResult as any[])[0].fields.id).toBe('item-1');

		const detailResult = await SquareEventWrapper({ type: 'detail', eventId: 'item-1' });
		expect((detailResult as any)?.fields?.id).toBe('item-1');

		const missingResult = await SquareEventWrapper({ type: 'detail', eventId: 'missing-id' });
		expect(missingResult).toBeNull();
	});
});
