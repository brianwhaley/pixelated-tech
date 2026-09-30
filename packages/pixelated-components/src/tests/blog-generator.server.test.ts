import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../components/config/config', () => ({
	getFullPixelatedConfig: vi.fn(),
}));
vi.mock('../components/foundation/smartfetch', () => ({
	smartFetch: vi.fn(),
}));
vi.mock('../components/integrations/wordpress.functions', () => ({
	createWordPressDraft: vi.fn(),
}));

const { getFullPixelatedConfig } = await import('../components/config/config');
const { smartFetch } = await import('../components/foundation/smartfetch');
const { createWordPressDraft } = await import('../components/integrations/wordpress.functions');
const { generateBlogPostsFromCalendar } = await import('../components/admin/blog/blog-generator.server');

const mockGetFullPixelatedConfig = vi.mocked(getFullPixelatedConfig);
const mockSmartFetch = vi.mocked(smartFetch);
const mockCreateWordPressDraft = vi.mocked(createWordPressDraft);

const calendar = {
	blogCalendarConfig: {
		criteria: {
			tone: 'Practical',
			contentRules: ['Use examples'],
			seoRules: ['Use headings'],
			articleLength: { minimumWords: 2, maximumWords: 4 },
		},
	},
	blogCalendar: [
		{ id: 1, targetPublishDate: '', title: 'First topic', notes: ['First note'], status: '' },
		{ id: 2, targetPublishDate: '', title: 'Published topic', notes: [], status: 'published' },
		{ id: 3, targetPublishDate: '', title: 'Second topic', notes: ['Second note'], status: '' },
	],
};

describe('generateBlogPostsFromCalendar', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mockGetFullPixelatedConfig.mockReturnValue({
			integrations: {
				googleGemini: { api_key: 'gemini-key' },
				wordpress: { site: 'blog.example.com', apiToken: 'wp-token', baseURL: 'https://wp.example/' },
			},
		});
	});

	it('generates the requested number of blank calendar topics sequentially', async () => {
		mockSmartFetch.mockResolvedValue({ candidates: [{ content: { parts: [{ text: 'one two' }] } }] });
		mockCreateWordPressDraft.mockResolvedValue({ ID: 101, status: 'draft' });

		const result = await generateBlogPostsFromCalendar(calendar, new FormData());

		expect(result.results).toEqual([
			{ calendarId: 1, title: 'First topic', status: 'draft', wordpressPostId: 101 },
		]);
		expect(result.calendar.blogCalendar[0].status).toBe('draft');
		expect(result.calendar.blogCalendar[0].wordpressPostId).toBe(101);
		expect(result.calendar.blogCalendar[2].status).toBe('');

		const formData = new FormData();
		formData.set('count', '2');
		const secondResult = await generateBlogPostsFromCalendar(calendar, formData);
		expect(secondResult.results).toHaveLength(2);
		expect(secondResult.results.every((item) => item.status === 'draft')).toBe(true);
	});

	it('sends the first generated article to WordPress without word-count validation', async () => {
		mockSmartFetch.mockResolvedValueOnce({ candidates: [{ content: { parts: [{ text: 'one' }] } }] });
		mockCreateWordPressDraft.mockResolvedValue({ ID: 101, status: 'draft' });

		const result = await generateBlogPostsFromCalendar(calendar, new FormData());

		expect(result.results[0]).toMatchObject({ calendarId: 1, status: 'draft', wordpressPostId: 101 });
		expect(mockCreateWordPressDraft).toHaveBeenCalledOnce();
	});

});