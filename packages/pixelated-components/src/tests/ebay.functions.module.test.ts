import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEbayAppToken, getEbayItemsSearch } from '../components/shoppingcart/ebay.functions';
import { CacheManager } from '../components/foundation/cache-manager';
import { smartFetch } from '../components/foundation/smartfetch';
import { getFullPixelatedConfig } from '../components/config/config';

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

vi.mock('../components/config/config', () => ({
	getFullPixelatedConfig: vi.fn()
}));

const mockApiProps = {
	proxyURL: 'https://proxy.example.com',
	baseTokenURL: '/oauth2/token',
	tokenScope: 'https://api.ebay.com/oauth/api_scope',
	baseSearchURL: 'https://api.ebay.com/buy/browse/v1/item_summary/search',
	qsSearchURL: '?q=watch',
	baseItemURL: 'https://api.ebay.com/buy/browse/v1/item/v1|123456|0',
	qsItemURL: '',
	baseAnalyticsURL: 'https://api.ebay.com/sell/analytics/v1',
	appId: 'test-app-id',
	appCertId: 'test-app-cert',
	globalId: 'EBAY-US',
	itemCategory: 'electronics'
};

describe('ebay.functions module', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(CacheManager as any).clearStore?.();
		(vi.mocked(getFullPixelatedConfig) as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
			global: { proxyUrl: 'https://proxy.example.com' }
		});
	});

	it('should fetch eBay app token successfully', async () => {
		vi.mocked(smartFetch).mockResolvedValueOnce({ access_token: 'test-token' });

		const token = await getEbayAppToken({ apiProps: mockApiProps });

		expect(token).toBe('test-token');
		expect(vi.mocked(smartFetch)).toHaveBeenCalled();
	});

	it('should return undefined when app token fetch fails', async () => {
		vi.mocked(smartFetch).mockRejectedValueOnce(new Error('Fetch failure'));

		const token = await getEbayAppToken({ apiProps: mockApiProps });

		expect(token).toBeUndefined();
	});

	it('should handle getFullPixelatedConfig throwing without failing', async () => {
		(vi.mocked(getFullPixelatedConfig) as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
			throw new Error('bad config');
		});
		vi.mocked(smartFetch).mockResolvedValueOnce({ access_token: 'fallback-token' });

		const token = await getEbayAppToken({ apiProps: mockApiProps });
		expect(token).toBe('fallback-token');
	});

	describe('getEbayItemsSearch', () => {
		it('should return search results when fetch succeeds', async () => {
			vi.mocked(smartFetch).mockResolvedValueOnce({ results: [{ id: '1' }] });

			const result = await getEbayItemsSearch({ apiProps: mockApiProps, token: 'test-token' });

			expect(result).toEqual({ results: [{ id: '1' }] });
		});

		it('should use cached results on subsequent searches', async () => {
			vi.mocked(smartFetch).mockResolvedValueOnce({ results: [{ id: 'cached' }] });

			const firstResult = await getEbayItemsSearch({ apiProps: mockApiProps, token: 'test-token' });
			const secondResult = await getEbayItemsSearch({ apiProps: mockApiProps, token: 'test-token' });

			expect(firstResult).toEqual({ results: [{ id: 'cached' }] });
			expect(secondResult).toEqual(firstResult);
			expect(vi.mocked(smartFetch)).toHaveBeenCalledTimes(1);
		});

		it('should return undefined when search fetch fails', async () => {
			vi.mocked(smartFetch).mockRejectedValueOnce(new Error('Search failure'));

			const result = await getEbayItemsSearch({ apiProps: mockApiProps, token: 'test-token' });

			expect(result).toBeUndefined();
		});
	});
});
