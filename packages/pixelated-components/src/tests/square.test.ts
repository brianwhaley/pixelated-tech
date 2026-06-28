import { describe, it, expect, vi, beforeEach } from 'vitest';
import { captureSquarePayment, buildSquareOrderBody, buildSquarePaymentBody, createSquareOrder, SquarePaymentError, getSquareStoreItems, getSquareStoreItemById, clearSquareStoreCache } from '../components/shoppingcart/square';
import type { CheckoutType } from '../components/shoppingcart/shoppingcart.functions';
import { createMockConfig, deepClone, makeCheckoutData } from '../test/test-utils';
import { squareOrderCheckoutData, squareCatalogResponseWithRelatedObjects, squareCatalogResponseNoRelatedObjects, squareCatalogResponseNestedVariation, pixelatedConfig } from '../test/test-data';

const mockGetFullPixelatedConfig = vi.fn();
const mockSmartFetch = vi.fn();

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

		mockSmartFetch.mockResolvedValueOnce(squareCatalogResponse);
		mockSmartFetch.mockResolvedValueOnce(inventoryResponse);

		const response = await getSquareStoreItems();

		expect(mockSmartFetch.mock.calls[0][0]).toContain('/v2/catalog/search-catalog-items');
		expect(mockSmartFetch.mock.calls[0][1]).toEqual(expect.objectContaining({
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
			{ name: 'Color', values: [{ value: 'White', label: 'White' }] },
		]));
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
});
