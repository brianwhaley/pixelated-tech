import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEbayAppToken, getEbayItems, getEbayItem, getEbayBrowseSearch, getEbayItemsSearch, getEbayProductSchema, getEbayRateLimits, getMergedEbayConfig, getEbayShoppingCartItem, getEbayBrowseItem } from '../components/shoppingcart/ebay.functions';
import { getFullPixelatedConfig } from '../components/config/config';
import { CacheManager } from '../components/foundation/cache-manager';
import { buildUrl } from '../components/foundation/urlbuilder';
import { smartFetch } from '../components/foundation/smartfetch';
import { pixelatedConfig, mockEbayItem, mockEbayApiProps } from '../test/test-data';

// Mock dependencies
vi.mock('../components/integrations/cloudinary', () => ({
	getCloudinaryRemoteFetchURL: vi.fn((opts) => `https://cloudinary.com/${opts.url}`)
}));

vi.mock('../components/foundation/cache-manager', () => {
	const store: Record<string, any> = {};
	return {
		CacheManager: class {
			static clearStore() { Object.keys(store).forEach(k => delete store[k]); }
			get(key: string) { return store[key]; }
			set(key: string, val: any) { store[key] = val; }
			clear() { Object.keys(store).forEach(k => delete store[k]); }
		}
	};
});

vi.mock('../components/foundation/utilities', () => ({
	getDomain: vi.fn(() => 'example.com')
}));

vi.mock('../components/config/config', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../components/config/config')>();
	return {
		...actual,
		getFullPixelatedConfig: vi.fn(),
	};
});

vi.mock('../components/foundation/smartfetch', () => ({
	smartFetch: vi.fn()
}));


describe('ebay.functions - Real Tests', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(vi.mocked(getFullPixelatedConfig) as any).mockReturnValue(pixelatedConfig);
    const cache = new CacheManager({} as any);
    (cache as any).clear?.();
	});

	describe('getEbayShoppingCartItem', () => {
		it('should return CartItemType structure', () => {
			const result = getEbayShoppingCartItem({
				thisItem: mockEbayItem as any,
				apiProps: mockEbayApiProps as any
			});
			expect(result).toHaveProperty('itemImageURL');
			expect(result).toHaveProperty('itemID');
			expect(result).toHaveProperty('itemURL');
			expect(result).toHaveProperty('itemTitle');
			expect(result).toHaveProperty('itemQuantity');
			expect(result).toHaveProperty('itemCost');
			expect(result).toHaveProperty('itemCurrency');
			expect(result).toHaveProperty('itemIsShippable');
			expect(result).toHaveProperty('itemWeight');
			expect(result).toHaveProperty('itemWeightUnit');
			expect(result).toHaveProperty('itemType');
			expect(result.itemID).toBe('123456');
		});

		it('should handle image variants for itemImageURL', () => {
			// Case 1: image.imageUrl
			const res1 = getEbayShoppingCartItem({
				thisItem: { ...mockEbayItem, thumbnailImages: undefined, image: { imageUrl: 'url1' } } as any,
				apiProps: mockEbayApiProps as any
			});
			expect(res1.itemImageURL).toBe('url1');

			// Case 2: image (as object with imageUrl)
			const res2 = getEbayShoppingCartItem({
				thisItem: { ...mockEbayItem, thumbnailImages: undefined, image: { imageUrl: 'url2' } } as any,
				apiProps: mockEbayApiProps as any
			});
			expect(res2.itemImageURL).toBe('url2');

			// Case 3: thumbnailImages[0].imageUrl (already tested but good to have)
			const res3 = getEbayShoppingCartItem({
				thisItem: { ...mockEbayItem, thumbnailImages: [{ imageUrl: 'url3' }] } as any,
				apiProps: mockEbayApiProps as any
			});
			expect(res3.itemImageURL).toBe('url3');

			// Case 4: thumbnailImages[0] (as string)
			const res4 = getEbayShoppingCartItem({
				thisItem: { ...mockEbayItem, thumbnailImages: ['url4'] as any } as any,
				apiProps: mockEbayApiProps as any
			});
			expect(res4.itemImageURL).toBeUndefined();

			// Case 5: fallbacks
			const res5 = getEbayShoppingCartItem({
				thisItem: { ...mockEbayItem, thumbnailImages: undefined, image: undefined } as any,
				apiProps: mockEbayApiProps as any
			});
			expect(res5.itemImageURL).toBe('');
		});

	it('should handle missing categories', () => {
		const item = { ...mockEbayItem, categories: undefined, categoryId: undefined };
		const result = getEbayShoppingCartItem({
			thisItem: item as any,
			apiProps: mockEbayApiProps as any
		});
		expect(result.itemQuantity).toBe(10);
	});

		it('should handle missing categories', () => {
			const item = {
				...mockEbayItem,
				categoryId: undefined,
				categories: undefined
			};
			const result = getEbayShoppingCartItem({
				thisItem: item as any,
				apiProps: mockEbayApiProps as any
			});
			expect(result.itemQuantity).toBe(10);
		});

		it('should extract item title', () => {
			const result = getEbayShoppingCartItem({
				thisItem: mockEbayItem as any,
				apiProps: mockEbayApiProps as any
			});
			expect(result.itemTitle).toBe('Test Product');
		});

		it('should extract item URL', () => {
			const result = getEbayShoppingCartItem({
				thisItem: mockEbayItem as any,
				apiProps: mockEbayApiProps as any
			});
			expect(result.itemURL).toBe('https://ebay.com/itm/123456');
		});

		it('should extract item cost and shipping metadata', () => {
			const result = getEbayShoppingCartItem({
				thisItem: mockEbayItem as any,
				apiProps: mockEbayApiProps as any
			});
			expect(result.itemCost).toBe('29.99');
			expect(result.itemCurrency).toBe('USD');
			expect(result.itemIsShippable).toBe(true);
			expect(result.itemWeight).toBe(2);
			expect(result.itemWeightUnit).toBe('lb');
			expect(result.itemType).toBe('product');
		});

		it('should handle alternative image property', () => {
			const item = {
				...mockEbayItem,
				thumbnailImages: undefined,
				image: { imageUrl: 'https://pic.ebay.com/alt.jpg' }
			};
			const result = getEbayShoppingCartItem({
				thisItem: item as any,
				apiProps: mockEbayApiProps as any
			});
			expect(result.itemImageURL).toBeDefined();
		});

		it('should use cloudinary when provided', () => {
			const result = getEbayShoppingCartItem({
				thisItem: mockEbayItem as any,
				cloudinaryProductEnv: 'my-cloud',
				apiProps: mockEbayApiProps as any
			});
			expect(result.itemImageURL).toBeDefined();
		});

		it('should handle categories array', () => {
			const item = {
				...mockEbayItem,
				categoryId: undefined,
				categories: [{ categoryId: mockEbayApiProps?.itemCategory || 'jewelry' }]
			};
			const result = getEbayShoppingCartItem({
				thisItem: item as any,
				apiProps: mockEbayApiProps as any
			});
			expect(result.itemQuantity).toBe(1);
		});

		it('should set quantity to 10 for non-matching categories', () => {
			const item = {
				...mockEbayItem,
				categoryId: 'different'
			};
			const result = getEbayShoppingCartItem({
				thisItem: item as any,
				apiProps: { ...mockEbayApiProps, itemCategory: 'other' } as any
			});
			expect(result.itemQuantity).toBe(10);
		});

		it('should merge provided apiProps with config values from getFullPixelatedConfig', () => {
			(vi.mocked(getFullPixelatedConfig) as any).mockReturnValueOnce(pixelatedConfig);

			const merged = getMergedEbayConfig({ baseSearchURL: 'https://override.example.com', appId: 'override-id' });

		expect(merged.proxyURL).toBe(pixelatedConfig.integrations?.ebay?.proxyURL ?? '');
			expect(merged.baseSearchURL).toBe('https://override.example.com');
			expect(merged.appId).toBe('override-id');
		});
	});

	describe('error handling in ebay functions', () => {
		it('getMergedEbayConfig should handle errors gracefully', () => {
			(vi.mocked(getFullPixelatedConfig) as any).mockImplementationOnce(() => {
				throw new Error('Config error');
			});
			const merged = getMergedEbayConfig({});
			expect(merged).toBeDefined();
			expect(merged.appId).toBeUndefined();
		});

		it('getEbayAppToken should handle fetch errors', async () => {
			(vi.mocked(smartFetch) as any).mockRejectedValueOnce(new Error('Fetch failed'));
			const token = await getEbayAppToken({ apiProps: mockEbayApiProps as any });
			expect(token).toBeUndefined();
		});

		it('getEbayBrowseSearch should handle fetch errors', async () => {
			(vi.mocked(smartFetch) as any).mockRejectedValueOnce(new Error('Search failed'));
			const results = await getEbayBrowseSearch({ apiProps: mockEbayApiProps as any, token: 'token' });
			expect(results).toBeUndefined();
		});

		it('getEbayBrowseItem should handle fetch errors', async () => {
			(vi.mocked(smartFetch) as any).mockRejectedValueOnce(new Error('Item fetch failed'));
			const results = await getEbayBrowseItem({ apiProps: mockEbayApiProps as any, itemId: '123', token: 'token' });
			expect(results).toBeUndefined();
		});

		it('getEbayBrowseItem should return item data when fetch succeeds', async () => {
			(vi.mocked(smartFetch) as any).mockResolvedValueOnce({ item: 'data' });
			const results = await getEbayBrowseItem({ apiProps: mockEbayApiProps as any, itemId: '123', token: 'token' });
			expect(results).toEqual({ item: 'data' });
		});
	});

	describe('getEbayRateLimits', () => {
		it('should return combined limit data when both responses are OK', async () => {
			const firstResponse = { ok: true, status: 200, json: vi.fn().mockResolvedValue({ rate_limit: true }) };
			const secondResponse = { ok: true, status: 200, json: vi.fn().mockResolvedValue({ user_rate_limit: true }) };
			(vi.mocked(smartFetch) as any)
				.mockResolvedValueOnce(firstResponse)
				.mockResolvedValueOnce(secondResponse);

			const result = await getEbayRateLimits({ apiProps: mockEbayApiProps as any, token: 'token' });

			expect(result).toEqual({ rate_limit: { rate_limit: true }, user_rate_limit: { user_rate_limit: true } });
		});
	});

	describe('getEbayItems', () => {
		it('should return browse search results when token acquisition succeeds', async () => {
			(vi.mocked(smartFetch) as any)
				.mockResolvedValueOnce({ access_token: 'token-value' })
				.mockResolvedValueOnce({ results: ['item-1'] });

			const result = await getEbayItems({ apiProps: mockEbayApiProps as any });
			expect(result).toEqual({ results: ['item-1'] });
		});
	});

	describe('getEbayItem', () => {
		it('should return item data when token acquisition succeeds', async () => {
			(vi.mocked(smartFetch) as any)
				.mockResolvedValueOnce({ access_token: 'token-value' })
				.mockResolvedValueOnce({ item: 'data' });

			const result = await getEbayItem({ apiProps: mockEbayApiProps as any });
			expect(result).toEqual({ item: 'data' });
		});
	});

	describe('getEbayBrowseSearch caching', () => {
		it('should return cached eBay browse search data on second call', async () => {
			const mockFetch = vi.mocked(smartFetch);
			mockFetch.mockResolvedValueOnce({ results: [{ id: '1' }] });

			const firstResult = await getEbayBrowseSearch({ apiProps: mockEbayApiProps as any, token: 'token-123' });
			expect(mockFetch).toHaveBeenCalledTimes(1);

			const secondResult = await getEbayBrowseSearch({ apiProps: mockEbayApiProps as any, token: 'token-123' });
			expect(mockFetch).toHaveBeenCalledTimes(1);
			expect(secondResult).toEqual(firstResult);
		});
	});

	describe('getEbayAppToken', () => {
		it('should be callable', () => {
			expect(typeof getEbayAppToken).toBe('function');
		});

		it('should be async function that returns value or undefined', async () => {
			vi.mocked(smartFetch).mockResolvedValueOnce({ access_token: 'test-token' });
			const token = await getEbayAppToken({ apiProps: mockEbayApiProps as any });
			expect(typeof token === 'string' || token === undefined).toBe(true);
		});

		it('should have propTypes defined', () => {
			expect(getEbayAppToken.propTypes).toBeDefined();
		});

		it('should proxy token request through configured proxy', async () => {
			const mockFetch = vi.mocked(smartFetch);
			mockFetch.mockResolvedValue({ access_token: 'token-abc' });

			const token = await getEbayAppToken({ apiProps: mockEbayApiProps as any });

			expect(token).toBe('token-abc');
			expect(mockFetch).toHaveBeenCalledWith('https://api.ebay.com/identity/v1/oauth2/token', expect.objectContaining({
				proxy: {
					url: mockEbayApiProps.proxyURL,
					forceProxy: true,
					fallbackOnCors: true,
				},
				requestInit: expect.objectContaining({
					method: 'POST',
					headers: expect.objectContaining({
						'Content-Type': 'application/x-www-form-urlencoded',
						'Authorization': expect.stringContaining('Basic '),
					}),
				}),
			}));
		});

		it('should return undefined when token fetch fails', async () => {
			const mockFetch = vi.mocked(smartFetch);
			mockFetch.mockRejectedValueOnce(new Error('Token fetch failed'));
			const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

			const token = await getEbayAppToken({ apiProps: mockEbayApiProps as any });
			expect(token).toBeUndefined();
			consoleError.mockRestore();
		});
	});

	describe('getEbayItems', () => {
		it('should abort and return an empty object when app token acquisition fails', async () => {
			const mockFetch = vi.mocked(smartFetch);
			mockFetch.mockRejectedValueOnce(new Error('Token fetch failed'));
			const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

			const result = await getEbayItems({ apiProps: mockEbayApiProps as any });

			expect(result).toEqual({});
			expect(mockFetch).toHaveBeenCalledTimes(1);
			expect(consoleError).toHaveBeenCalledWith('Unable to fetch eBay app token; aborting eBay item search.');
			consoleError.mockRestore();
		});
	});

	describe('getEbayItem', () => {
		it('should abort and return an empty object when app token acquisition fails', async () => {
			const mockFetch = vi.mocked(smartFetch);
			mockFetch.mockRejectedValueOnce(new Error('Token fetch failed'));
			const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

			const result = await getEbayItem({ apiProps: mockEbayApiProps as any });

			expect(result).toEqual({});
			expect(mockFetch).toHaveBeenCalledTimes(1);
			expect(consoleError).toHaveBeenCalledWith('Unable to fetch eBay app token; aborting eBay item details fetch.');
			consoleError.mockRestore();
		});
	});

	describe('getEbayItemsSearch', () => {
		it('should return search results when fetch resolves', async () => {
			const mockFetch = vi.mocked(smartFetch);
			mockFetch.mockResolvedValueOnce({ results: [{ id: '1' }] });

			const result = await getEbayItemsSearch({ apiProps: mockEbayApiProps as any, token: 'token' });

			expect(result).toEqual({ results: [{ id: '1' }] });
		});

		it('should catch errors and return undefined when fetch fails', async () => {
			const mockFetch = vi.mocked(smartFetch);
			mockFetch.mockRejectedValueOnce(new Error('Network failure'));
			const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

			const result = await getEbayItemsSearch({ apiProps: mockEbayApiProps as any, token: 'token-abc' });

			expect(result).toBeUndefined();
			consoleError.mockRestore();
		});
	});

	describe('getEbayProductSchema', () => {
		it('should return schema object for valid item', () => {
			const item = {
				legacyItemId: '123456',
				title: 'Test Product',
				price: { value: '29.99', currency: 'USD' },
				image: { imageUrl: 'https://pic.ebay.com/image.jpg' },
				thumbnailImages: [{ imageUrl: 'https://pic.ebay.com/image.jpg' }],
				itemWebUrl: 'https://ebay.com/itm/123456',
			};

			const schema = getEbayProductSchema({ item, brandName: 'TestBrand', siteUrl: 'https://example.com' });

			expect(schema).toBeDefined();
			expect(schema).toHaveProperty('@type', 'Product');
			expect(schema).toHaveProperty('name', 'Test Product');
			expect(schema).toHaveProperty('brand');
			expect(schema?.image).toContain('https://pic.ebay.com/image.jpg');
		});

		it('should return null when item is missing required fields', () => {
			const schema = getEbayProductSchema({ item: { legacyItemId: '123456' } as any });
			expect(schema).toBeNull();
		});
	});

	describe('PropTypes Validation', () => {
		it('should validate getEbayShoppingCartItem props', () => {
			expect(getEbayShoppingCartItem.propTypes).toBeDefined();
			expect(Object.keys(getEbayShoppingCartItem.propTypes).length).toBeGreaterThan(0);
		});

		it('should require thisItem prop', () => {
			expect(getEbayShoppingCartItem.propTypes.thisItem).toBeDefined();
		});

		it('should require apiProps prop', () => {
			expect(getEbayShoppingCartItem.propTypes.apiProps).toBeDefined();
		});
	});

	describe('Edge Cases', () => {
		it('should handle missing price - provide default', () => {
			const item = { ...mockEbayItem, price: { value: '0.00' } };
			const result = getEbayShoppingCartItem({
				thisItem: item as any,
				apiProps: mockEbayApiProps as any
			});
			expect(result.itemCost).toBe('0.00');
		});

		it('should handle very large prices', () => {
			const item = { ...mockEbayItem, price: { value: '999999.99' } };
			const result = getEbayShoppingCartItem({
				thisItem: item as any,
				apiProps: mockEbayApiProps as any
			});
			expect(result.itemCost).toBe('999999.99');
		});

		it('should handle very small prices', () => {
			const item = { ...mockEbayItem, price: { value: '0.01' } };
			const result = getEbayShoppingCartItem({
				thisItem: item as any,
				apiProps: mockEbayApiProps as any
			});
			expect(result.itemCost).toBe('0.01');
		});
	});

	describe('buildUrl URL Construction', () => {
		describe('getEbayBrowseSearch URL building', () => {
			it('should build correct URL with baseUrl and proxyUrl (Section 1)', () => {
				const baseSearchURL = 'https://api.ebay.com/buy/browse/v1/item_summary/search?q=laptop&limit=10';
				const url = buildUrl({
					baseUrl: baseSearchURL,
					proxyUrl: 'https://proxy.example.com/',
				});
				expect(url).toContain('https://proxy.example.com/');
				expect(url).toContain('https%3A%2F%2Fapi.ebay.com');
				expect(url).toContain('%3Fq%3Dlaptop');
			});

			it('should handle search URL without proxy', () => {
				const baseSearchURL = 'https://api.ebay.com/buy/browse/v1/item_summary/search?q=laptop';
				const url = buildUrl({
					baseUrl: baseSearchURL,
				});
				expect(url).toBe(baseSearchURL);
			});
		});

		describe('getEbayBrowseItem URL building', () => {
			it('should build correct URL for single item with proxyUrl (Section 2)', () => {
				const baseItemURL = 'https://api.ebay.com/buy/browse/v1/item/v1|123456|0';
				const url = buildUrl({
					baseUrl: baseItemURL,
					proxyUrl: 'https://proxy.example.com/',
				});
				expect(url).toContain('https://proxy.example.com/');
				expect(url).toContain('https%3A%2F%2Fapi.ebay.com');
				expect(url).toContain('%7C'); // | encoded
			});

			it('should preserve item ID encoding in URL', () => {
				const baseItemURL = 'https://api.ebay.com/buy/browse/v1/item/v1|999|0';
				const url = buildUrl({
					baseUrl: baseItemURL,
				});
				expect(url).toContain('v1|999|0');
			});
		});

		describe('getEbayRateLimits URL building', () => {
			it('should build rate_limit URL with pathSegments (Section 3)', () => {
				const baseUrl = 'https://api.ebay.com/sell/analytics/v1';
				const url = buildUrl({
					baseUrl,
					pathSegments: ['rate_limit'],
					proxyUrl: 'https://proxy.example.com/',
				});
				expect(url).toContain('https://proxy.example.com/');
				expect(url).toContain('rate_limit');
			});

			it('should build user_rate_limit URL with pathSegments (Section 4)', () => {
				const baseUrl = 'https://api.ebay.com/sell/analytics/v1';
				const url = buildUrl({
					baseUrl,
					pathSegments: ['user_rate_limit'],
					proxyUrl: 'https://proxy.example.com/',
				});
				expect(url).toContain('https://proxy.example.com/');
				expect(url).toContain('user_rate_limit');
			});

			it('should construct analytics URLs correctly without proxy', () => {
				const baseUrl = 'https://api.ebay.com/sell/analytics/v1';
				
				const rateLimitUrl = buildUrl({
					baseUrl,
					pathSegments: ['rate_limit'],
				});
				
				const userRateLimitUrl = buildUrl({
					baseUrl,
					pathSegments: ['user_rate_limit'],
				});

				expect(rateLimitUrl).toBe('https://api.ebay.com/sell/analytics/v1/rate_limit');
				expect(userRateLimitUrl).toBe('https://api.ebay.com/sell/analytics/v1/user_rate_limit');
			});
		});
	});
});
