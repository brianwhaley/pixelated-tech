import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEbayAppToken, getEbayItemsSearch } from '../components/shoppingcart/ebay.functions';
import { CacheManager } from '../components/foundation/cache-manager';
import { smartFetch } from '../components/foundation/smartfetch';
import { getFullPixelatedConfig } from '../components/config/config';
import { pixelatedConfig, mockEbayApiProps, ebayData } from '../test/test-data';

vi.mock('../components/foundation/cache-manager', () => {
	const store: Record<string, any> = {};
	return {
		CacheManager: class {
			static clearStore() {
				Object.keys(store).forEach(key => delete store[key]);
			}
			get(key: string) {
				return store[key];
			}
			set(key: string, value: any) {
				store[key] = value;
			}
			clear() {
				Object.keys(store).forEach(key => delete store[key]);
			}
		}
	};
});

vi.mock('../components/foundation/utilities', () => ({
	getDomain: vi.fn(() => 'example.com')
}));

vi.mock('../components/foundation/smartfetch', () => ({
	smartFetch: vi.fn()
}));

vi.mock('../components/foundation/urlbuilder', () => ({
	buildUrl: vi.fn((value: string) => value)
}));

vi.mock('../components/config/config', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../components/config/config')>();
	return {
		...actual,
		getFullPixelatedConfig: vi.fn()
	};
});

describe('ebay.functions module', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(CacheManager as any).clearStore?.();
		(vi.mocked(getFullPixelatedConfig) as unknown as ReturnType<typeof vi.fn>).mockReturnValue(pixelatedConfig);
	});

	it('should fetch eBay app token successfully', async () => {
		vi.mocked(smartFetch).mockResolvedValueOnce({ access_token: 'test-token' });

		const token = await getEbayAppToken({ apiProps: mockEbayApiProps });

		expect(token).toBe('test-token');
		expect(vi.mocked(smartFetch)).toHaveBeenCalled();
	});

	it('should return undefined when app token fetch fails', async () => {
		vi.mocked(smartFetch).mockRejectedValueOnce(new Error('Fetch failure'));

		const token = await getEbayAppToken({ apiProps: mockEbayApiProps });

		expect(token).toBeUndefined();
	});

	it('should handle getFullPixelatedConfig throwing without failing', async () => {
		(vi.mocked(getFullPixelatedConfig) as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
			throw new Error('bad config');
		});
		vi.mocked(smartFetch).mockResolvedValueOnce({ access_token: 'fallback-token' });

		const token = await getEbayAppToken({ apiProps: mockEbayApiProps as any });
		expect(token).toBe('fallback-token');
	});

	describe('getEbayItemsSearch', () => {
		it('should return search results when fetch succeeds', async () => {
			vi.mocked(smartFetch).mockResolvedValueOnce(ebayData.apiResponse);

			const result = await getEbayItemsSearch({ apiProps: mockEbayApiProps as any, token: 'test-token' });

			expect(result).toEqual(ebayData.apiResponse);
		});

		it('should use cached results on subsequent searches', async () => {
			vi.mocked(smartFetch).mockResolvedValueOnce(ebayData.apiResponse);

			const firstResult = await getEbayItemsSearch({ apiProps: mockEbayApiProps as any, token: 'test-token' });
			const secondResult = await getEbayItemsSearch({ apiProps: mockEbayApiProps as any, token: 'test-token' });

			expect(firstResult).toEqual(ebayData.apiResponse);
			expect(secondResult).toEqual(firstResult);
			expect(vi.mocked(smartFetch)).toHaveBeenCalledTimes(1);
		});

		it('should return undefined when search fetch fails', async () => {
			vi.mocked(smartFetch).mockRejectedValueOnce(new Error('Search failure'));

			const result = await getEbayItemsSearch({ apiProps: mockEbayApiProps as any, token: 'test-token' });

			expect(result).toBeUndefined();
		});
	});
});
