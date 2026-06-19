import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getLiveWordPressPosts, getJetpackStats, getLiveBillingStats } from '../components/integrations/wordpress.jetpack.server';
import { getWordPressItems } from '../components/integrations/wordpress.functions';
import { smartFetch } from '../components/foundation/smartfetch';

// Mock the dependencies
vi.mock('../components/integrations/wordpress.functions', () => ({
	getWordPressItems: vi.fn()
}));

vi.mock('../components/foundation/smartfetch', () => ({
	smartFetch: vi.fn()
}));

describe('WordPress & Jetpack Billing Stats Integration', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	describe('getLiveWordPressPosts', () => {
		it('should fetch and filter WordPress posts correctly by selected month', async () => {
			const mockPosts = [
				{ title: 'Post 1', URL: 'http://test.com/1', date: '2026-06-15T12:00:00.000Z' },
				{ title: 'Post 2', URL: 'http://test.com/2', date: '2026-05-15T12:00:00.000Z' }, // different month
				{ title: 'Post 3', URL: 'http://test.com/3', date: '2026-06-01T10:00:00.000Z' }
			];

			vi.mocked(getWordPressItems).mockResolvedValue(mockPosts as any);

			const results = await getLiveWordPressPosts('manningmetalworks', '2026-06');

			expect(results).toHaveLength(2);
			expect(results[0].title).toBe('Post 1');
			expect(results[1].title).toBe('Post 3');
			expect(results[0].views).toBe(0);
		});

		it('should return empty array on failure', async () => {
			vi.mocked(getWordPressItems).mockRejectedValue(new Error('API Error'));

			const results = await getLiveWordPressPosts('manningmetalworks', '2026-06');
			expect(results).toEqual([]);
		});
	});

	describe('getJetpackStats', () => {
		it('should return empty stats with simulated=false when no apiToken is provided', async () => {
			const result = await getJetpackStats('manningmetalworks', '2026-06', undefined);
			expect(result.simulated).toBe(false);
			expect(result.postViews).toEqual({});
			expect(result.socialReferrers.every(r => r.clicks === 0)).toBe(true);
		});

		it('should return empty Jetpack stats when the integration is currently disabled', async () => {
			const mockViewsResponse = {
				data: [
					{ URL: 'http://test.com/1', views: '250' },
					{ URL: 'http://test.com/3', views: '150' }
				]
			};

			const mockReferrersResponse = {
				data: [
					{ name: 'Facebook', views: '80' },
					{ name: 'LinkedIn.com', views: '45' },
					{ name: 't.co', views: '12' },
					{ name: 'Instagram', views: '110' },
					{ name: 'threads.net', views: '5' }
				]
			};

			// First call is views, second is referrers
			vi.mocked(smartFetch)
				.mockResolvedValueOnce(mockViewsResponse)
				.mockResolvedValueOnce(mockReferrersResponse);

			const result = await getJetpackStats('manningmetalworks', '2026-06', 'valid-token');

			expect(result.simulated).toBe(false);
			expect(result.postViews).toEqual({});
			expect(result.socialReferrers.every(r => r.clicks === 0)).toBe(true);
		});

		it('should fall back gracefully to empty structures on API error', async () => {
			vi.mocked(smartFetch).mockRejectedValue(new Error('Network Error'));

			const result = await getJetpackStats('manningmetalworks', '2026-06', 'valid-token');
			expect(result.simulated).toBe(false);
			expect(result.postViews).toEqual({});
		});
	});

	describe('getLiveBillingStats', () => {
		it('should orchestrate and combine posts and stats correctly', async () => {
			const mockPosts = [
				{ title: 'Post 1', URL: 'http://test.com/1', date: '2026-06-15T12:00:00.000Z' }
			];

			vi.mocked(getWordPressItems).mockResolvedValue(mockPosts as any);

			const mockViewsResponse = {
				data: [
					{ URL: 'http://test.com/1', views: '320' }
				]
			};
			const mockReferrersResponse = { data: [] };

			vi.mocked(smartFetch)
				.mockResolvedValueOnce(mockViewsResponse)
				.mockResolvedValueOnce(mockReferrersResponse);

			const result = await getLiveBillingStats('manningmetalworks', '2026-06', 'token');

			expect(result.posts).toHaveLength(1);
			expect(result.posts[0].title).toBe('Post 1');
		expect(result.posts[0].views).toBe(0);
		expect(result.simulated).toBe(false);
		expect(result.socialReferrers.every(r => r.clicks === 0)).toBe(true);
		});
	});
});
