import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../components/foundation/smartfetch', () => ({
	smartFetch: vi.fn(),
}));

const { smartFetch } = await import('../components/foundation/smartfetch');
const { getWordPressFeedLinks } = await import('../components/integrations/wordpress.server');
const mockSmartFetch = vi.mocked(smartFetch);

describe('WordPress Feed Server Functions', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('returns unique post titles and URLs and reuses the one-week cache', async () => {
		mockSmartFetch.mockResolvedValueOnce([
			{ title: { rendered: 'First &amp; Best' }, link: 'https://pixelated.test/first/' },
			{ title: { rendered: 'Duplicate' }, link: 'https://pixelated.test/first/' },
			{ title: { rendered: 'Second' }, link: 'https://pixelated.test/second/' },
		]);

		const firstResult = await getWordPressFeedLinks('https://pixelated.test/feed/');
		const secondResult = await getWordPressFeedLinks('https://pixelated.test/feed/');

		expect(firstResult).toEqual([
			{ title: 'First & Best', url: 'https://pixelated.test/first/' },
			{ title: 'Second', url: 'https://pixelated.test/second/' },
		]);
		expect(secondResult).toEqual(firstResult);
		expect(mockSmartFetch).toHaveBeenCalledOnce();
		expect(mockSmartFetch).toHaveBeenCalledWith('https://pixelated.test/wp-json/wp/v2/posts?per_page=100&_fields=title%2Clink', expect.objectContaining({
			responseType: 'json',
			nextCache: { revalidate: 60 * 60 * 24 * 7 },
		}));
	});

	it('limits the returned catalog', async () => {
		mockSmartFetch.mockResolvedValueOnce([
			{ title: { rendered: 'First' }, link: 'https://pixelated.test/first/' },
			{ title: { rendered: 'Second' }, link: 'https://pixelated.test/second/' },
		]);

		await expect(getWordPressFeedLinks('https://pixelated.test/atom/', 1)).resolves.toEqual([
			{ title: 'First', url: 'https://pixelated.test/first/' },
		]);
	});
});