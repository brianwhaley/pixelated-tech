import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('fs/promises', async (importOriginal) => {
	const actual = await importOriginal<typeof import('fs/promises')>();
	const mockedReadFile = vi.fn();
	return {
		...actual,
		readFile: mockedReadFile,
		default: { ...actual.default, readFile: mockedReadFile },
	};
});
vi.mock('../components/config/config', () => ({
	getFullPixelatedConfig: vi.fn(),
}));
vi.mock('../components/foundation/smartfetch', () => ({
	smartFetch: vi.fn(),
}));
vi.mock('../components/admin/sites/sites.integration', () => ({
	getSiteConfig: vi.fn(),
}));
vi.mock('../components/integrations/wordpress.functions', () => ({
	createWordPressDraft: vi.fn(),
	updateWordPressDraft: vi.fn(),
	uploadWordPressMedia: vi.fn(),
}));
vi.mock('../components/integrations/wordpress.server', () => ({
	getWordPressFeedLinks: vi.fn(),
}));
vi.mock('../components/integrations/magnific.server', () => ({
	findMagnificStockImage: vi.fn(),
	prepareMagnificStockImage: vi.fn(),
}));
vi.mock('../components/integrations/gemini.search.server', async (importOriginal) => ({
	...(await importOriginal<typeof import('../components/integrations/gemini.search.server')>()),
	googleSearchWithGeminiGrounding: vi.fn(),
}));

const { getFullPixelatedConfig } = await import('../components/config/config');
const { readFile } = await import('fs/promises');
const { smartFetch } = await import('../components/foundation/smartfetch');
const { getSiteConfig } = await import('../components/admin/sites/sites.integration');
const { createWordPressDraft, updateWordPressDraft, uploadWordPressMedia } = await import('../components/integrations/wordpress.functions');
const { getWordPressFeedLinks } = await import('../components/integrations/wordpress.server');
const { findMagnificStockImage, prepareMagnificStockImage } = await import('../components/integrations/magnific.server');
const { googleSearchWithGeminiGrounding } = await import('../components/integrations/gemini.search.server');
const { generateBlogPostsFromCalendar } = await import('../components/admin/blog/blog-generator.server');

const mockGetFullPixelatedConfig = vi.mocked(getFullPixelatedConfig);
const mockReadFile = vi.mocked(readFile);
const mockSmartFetch = vi.mocked(smartFetch);
const mockGetSiteConfig = vi.mocked(getSiteConfig);
const mockCreateWordPressDraft = vi.mocked(createWordPressDraft);
const mockGetWordPressFeedLinks = vi.mocked(getWordPressFeedLinks);
const mockUpdateWordPressDraft = vi.mocked(updateWordPressDraft);
const mockUploadWordPressMedia = vi.mocked(uploadWordPressMedia);
const mockFindMagnificStockImage = vi.mocked(findMagnificStockImage);
const mockPrepareMagnificStockImage = vi.mocked(prepareMagnificStockImage);
const mockGoogleSearchWithGeminiGrounding = vi.mocked(googleSearchWithGeminiGrounding);

function geminiArticle(article: string, metrics?: Record<string, number>, image?: { imageBrief: string; imageSearchTerms: string[]; imageAltText: string }) {
	return JSON.stringify({
		article,
		selfAssessment: {
			passed: true,
			metrics: metrics || {},
			failures: [],
		},
		...(image || {}),
	});
}

const calendar = {
	blogCalendarConfig: {
		criteria: {
			subjectiveCriteria: ['Use examples'],
			objectiveCriteria: { minimumWords: 2, maximumWords: 4 },
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
		mockGetSiteConfig.mockResolvedValue({ blog_url: 'https://blog.example.com' });
		mockReadFile.mockResolvedValue('');
		mockGetWordPressFeedLinks.mockResolvedValue([]);
		mockGoogleSearchWithGeminiGrounding.mockResolvedValue([]);
		mockGetFullPixelatedConfig.mockReturnValue({
			integrations: {
				googleGemini: { api_key: 'gemini-key' },
				wordpress: { site: 'blog.example.com', apiToken: 'wp-token', baseURL: 'https://wp.example/' },
			},
		});
	});

	it('generates the requested number of blank calendar topics sequentially', async () => {
		mockSmartFetch.mockResolvedValue({ candidates: [{ content: { parts: [{ text: geminiArticle('one two') }] } }] });
		mockCreateWordPressDraft.mockResolvedValue({ ID: 101, status: 'draft' });

		const result = await generateBlogPostsFromCalendar(calendar, new FormData());

		expect(result.results).toEqual([
			{ calendarId: 1, title: 'First topic', status: 'draft', wordpressPostId: 101, imageStatus: 'not-found' },
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

	it('normalizes require_minimum calendar criteria into the Gemini prompt', async () => {
		const configuredCalendar = {
			...calendar,
			blogCalendarConfig: {
				criteria: {
					subjectiveCriteria: [],
					objectiveCriteria: {
						require_minimum_words: 800,
						require_maximum_words: 1200,
						require_minimum_blog_links: 3,
						require_minimum_site_links: 2,
						require_minimum_external_links: 4,
					},
				},
			},
		};
		mockSmartFetch.mockResolvedValueOnce({ candidates: [{ content: { parts: [{ text: geminiArticle('one two') }] } }] });
		mockCreateWordPressDraft.mockResolvedValue({ ID: 101, status: 'draft' });

		await generateBlogPostsFromCalendar(configuredCalendar, new FormData());

		const prompt = JSON.parse(String(mockSmartFetch.mock.calls[0][1]?.requestInit?.body)).contents[0].parts[0].text;
		expect(prompt).toContain('between 800 and 1200 words');
		expect(prompt).toContain('at least 3 relevant blog links');
		expect(prompt).toContain('at least 2 relevant site links');
		expect(prompt).toContain('at least 4 relevant external links');
	});

	it('sends a generated article to WordPress when its configured criteria pass', async () => {
		mockSmartFetch.mockResolvedValueOnce({ candidates: [{ content: { parts: [{ text: geminiArticle('one two') }] } }] });
		mockCreateWordPressDraft.mockResolvedValue({ ID: 101, status: 'draft' });

		const result = await generateBlogPostsFromCalendar(calendar, new FormData());

		expect(result.results[0]).toMatchObject({ calendarId: 1, status: 'draft', wordpressPostId: 101 });
		expect(mockCreateWordPressDraft).toHaveBeenCalledOnce();
	});

	it('sends the target publish date at 10am while keeping the post as a draft', async () => {
		const datedCalendar = {
			...calendar,
			blogCalendar: calendar.blogCalendar.map((entry) => entry.id === 1 ? { ...entry, targetPublishDate: '2026-10-13' } : entry),
		};
		mockSmartFetch.mockResolvedValueOnce({ candidates: [{ content: { parts: [{ text: geminiArticle('one two') }] } }] });
		mockCreateWordPressDraft.mockResolvedValue({ ID: 101, status: 'draft' });

		await generateBlogPostsFromCalendar(datedCalendar, new FormData());

		expect(mockCreateWordPressDraft).toHaveBeenCalledWith(expect.objectContaining({
			date: '2026-10-13T10:00:00',
		}));
	});

	it('normalizes bare external URLs before storing the generated article', async () => {
		mockSmartFetch.mockResolvedValueOnce({ candidates: [{ content: { parts: [{ text: geminiArticle('Source: [https://www.sba.gov/].') }] } }] });
		mockCreateWordPressDraft.mockResolvedValue({ ID: 101, status: 'draft' });

		await generateBlogPostsFromCalendar(calendar, new FormData());

		expect(mockCreateWordPressDraft).toHaveBeenCalledWith(expect.objectContaining({
			content: 'Source: [https://www.sba.gov/](https://www.sba.gov/).',
		}));
	});

	it('updates an existing WordPress draft instead of creating a duplicate', async () => {
		const existingCalendar = {
			...calendar,
			blogCalendar: calendar.blogCalendar.map((entry) => entry.id === 1 ? { ...entry, wordpressPostId: 501 } : entry),
		};
		mockSmartFetch.mockResolvedValueOnce({ candidates: [{ content: { parts: [{ text: geminiArticle('one two') }] } }] });
		mockUpdateWordPressDraft.mockResolvedValue({ ID: 501, status: 'draft' });

		const result = await generateBlogPostsFromCalendar(existingCalendar, new FormData());

		expect(mockCreateWordPressDraft).not.toHaveBeenCalled();
		expect(mockUpdateWordPressDraft).toHaveBeenCalledWith(501, expect.objectContaining({
			title: 'First topic',
			content: 'one two',
		}));
		expect(result.results[0]).toMatchObject({ wordpressPostId: 501, status: 'draft' });
	});

	it('matches a selected draft by title when the calendar has no WordPress ID', async () => {
		const formData = new FormData();
		formData.set('operation', 'update');
		formData.set('draftIds', '501');
		formData.set('updateMode', 'both');
		mockSmartFetch
			.mockResolvedValueOnce({ posts: [{ ID: 501, title: 'First topic' }] })
			.mockResolvedValueOnce({ candidates: [{ content: { parts: [{ text: geminiArticle('one two') }] } }] });
		mockUpdateWordPressDraft.mockResolvedValue({ ID: 501, status: 'draft' });

		const result = await generateBlogPostsFromCalendar(calendar, formData);

		expect(mockCreateWordPressDraft).not.toHaveBeenCalled();
		expect(mockUpdateWordPressDraft).toHaveBeenCalledWith(501, expect.objectContaining({ title: 'First topic' }));
		expect(result.calendar.blogCalendar).toContainEqual(expect.objectContaining({ id: 1, wordpressPostId: 501 }));
	});

	it('persists image metadata when updating a legacy draft with no prior image fields', async () => {
		const legacyCalendar = {
			...calendar,
			blogCalendar: [{ ...calendar.blogCalendar[0], wordpressPostId: 501 }],
		};
		const formData = new FormData();
		formData.set('operation', 'update');
		formData.set('draftIds', '501');
		formData.set('updateMode', 'image');
		mockGetFullPixelatedConfig.mockReturnValue({
			integrations: {
				googleGemini: { api_key: 'gemini-key' },
				magnific: { apiKey: 'magnific-key' },
				cloudinary: { product_env: 'test-cloud' },
				wordpress: { site: 'blog.example.com', apiToken: 'wp-token', baseURL: 'https://wp.example/' },
			},
		});
		mockSmartFetch
			.mockResolvedValueOnce({ posts: [{ ID: 501, title: 'First topic' }] })
			.mockResolvedValueOnce({ candidates: [{ content: { parts: [{ text: geminiArticle('one two', undefined, {
				imageBrief: 'A realistic basement waterproofing photograph',
				imageSearchTerms: ['basement waterproofing'],
				imageAltText: 'A dry basement protected from water damage',
			}) }] } }] });
		mockFindMagnificStockImage.mockResolvedValue({
			id: 'resource-7',
			title: 'Dry basement',
			sourceUrl: 'https://stock.example/image.jpg',
			detailUrl: 'https://stock.example/image',
			licenseUrl: 'https://stock.example/license',
			provider: 'Stock Provider',
		});
		mockPrepareMagnificStockImage.mockResolvedValue({
			id: 'resource-7',
			title: 'Dry basement',
			sourceUrl: 'https://stock.example/image.jpg',
			detailUrl: 'https://stock.example/image',
			licenseUrl: 'https://stock.example/license',
			provider: 'Stock Provider',
			buffer: Buffer.from('webp'),
			mimeType: 'image/webp',
			width: 1200,
			height: 800,
		});
		mockUploadWordPressMedia.mockResolvedValue({ media: [{ ID: 707, URL: 'https://wp.example/image.webp', mime_type: 'image/webp' }] });
		mockUpdateWordPressDraft.mockResolvedValue({ ID: 501, status: 'draft' });

		const result = await generateBlogPostsFromCalendar(legacyCalendar, formData);
		const updatedEntry = result.calendar.blogCalendar[0];

		expect(updatedEntry).toMatchObject({
			wordpressPostId: 501,
			imageStatus: 'selected',
			imageBrief: 'A realistic basement waterproofing photograph',
			imageSearchTerms: ['basement waterproofing'],
			wordpressMediaId: 707,
			magnificImage: {
				id: 'resource-7',
				title: 'Dry basement',
				detailUrl: 'https://stock.example/image',
				licenseUrl: 'https://stock.example/license',
				provider: 'Stock Provider',
			},
		});
		expect(mockUpdateWordPressDraft).toHaveBeenCalledWith(501, expect.objectContaining({ featuredImageId: 707 }));
	});

	it('uploads a selected stock image and attaches it to the draft', async () => {
		mockGetFullPixelatedConfig.mockReturnValue({
			integrations: {
				googleGemini: { api_key: 'gemini-key' },
				magnific: { apiKey: 'magnific-key' },
				cloudinary: { product_env: 'test-cloud' },
				wordpress: { site: 'blog.example.com', apiToken: 'wp-token', baseURL: 'https://wp.example/' },
			},
		});
		mockSmartFetch.mockResolvedValueOnce({ candidates: [{ content: { parts: [{ text: geminiArticle('one two', undefined, {
			imageBrief: 'A realistic basement waterproofing photograph',
			imageSearchTerms: ['basement waterproofing'],
			imageAltText: 'A dry basement protected from water damage',
		}) }] } }] });
		mockFindMagnificStockImage.mockResolvedValue({ id: 'resource-7', title: 'Dry basement', sourceUrl: 'https://stock.example/image.jpg', detailUrl: 'https://stock.example/image', licenseUrl: 'https://stock.example/license', provider: 'Stock Provider' });
		mockPrepareMagnificStockImage.mockResolvedValue({
			id: 'resource-7', title: 'Dry basement', sourceUrl: 'https://stock.example/image.jpg', detailUrl: 'https://stock.example/image', licenseUrl: 'https://stock.example/license', provider: 'Stock Provider',
			buffer: Buffer.from('webp'), mimeType: 'image/webp', width: 1200, height: 800,
		});
		mockUploadWordPressMedia.mockResolvedValue({ media: [{ ID: 707, URL: 'https://wp.example/image.webp', mime_type: 'image/webp' }] });
		mockCreateWordPressDraft.mockResolvedValue({ ID: 101, status: 'draft' });

		const result = await generateBlogPostsFromCalendar(calendar, new FormData());

		expect(mockFindMagnificStockImage).toHaveBeenCalledWith('magnific-key', {
			title: 'First topic',
			imageBrief: 'A realistic basement waterproofing photograph',
			searchTerms: ['basement waterproofing'],
		});
		expect(mockUploadWordPressMedia).toHaveBeenCalledWith(expect.objectContaining({
			filename: 'blog-1.webp',
			mimeType: 'image/webp',
			altText: 'A dry basement protected from water damage',
			caption: 'Dry basement',
			description: 'Featured stock photograph for "First topic".',
		}));
		expect(mockCreateWordPressDraft).toHaveBeenCalledWith(expect.objectContaining({ featuredImageId: 707 }));
		expect(result.calendar.blogCalendar[0]).toMatchObject({ imageStatus: 'selected', wordpressMediaId: 707, magnificImage: expect.objectContaining({ id: 'resource-7', detailUrl: 'https://stock.example/image' }) });
	});

	it('creates a draft without media when Magnific has no suitable stock match', async () => {
		mockGetFullPixelatedConfig.mockReturnValue({
			integrations: {
				googleGemini: { api_key: 'gemini-key' },
				magnific: { apiKey: 'magnific-key' },
				wordpress: { site: 'blog.example.com', apiToken: 'wp-token', baseURL: 'https://wp.example/' },
			},
		});
		mockSmartFetch.mockResolvedValueOnce({ candidates: [{ content: { parts: [{ text: geminiArticle('one two', undefined, { imageBrief: 'A stock photograph', imageSearchTerms: ['stock photo'], imageAltText: 'A stock photograph' }) }] } }] });
		mockFindMagnificStockImage.mockResolvedValue(null);
		mockCreateWordPressDraft.mockResolvedValue({ ID: 101, status: 'draft' });

		const result = await generateBlogPostsFromCalendar(calendar, new FormData());

		expect(mockPrepareMagnificStockImage).not.toHaveBeenCalled();
		expect(mockUploadWordPressMedia).not.toHaveBeenCalled();
		expect(mockCreateWordPressDraft).toHaveBeenCalledWith(expect.not.objectContaining({ featuredImageId: expect.anything() }));
		expect(result.results[0]).toMatchObject({ status: 'draft', imageStatus: 'not-found' });
	});

	it('uses fallback image terms when Gemini returns no image search terms', async () => {
		mockGetFullPixelatedConfig.mockReturnValue({
			integrations: {
				googleGemini: { api_key: 'gemini-key' },
				magnific: { apiKey: 'magnific-key' },
				wordpress: { site: 'blog.example.com', apiToken: 'wp-token', baseURL: 'https://wp.example/' },
			},
		});
		mockSmartFetch.mockResolvedValueOnce({ candidates: [{ content: { parts: [{ text: geminiArticle('one two', undefined, { imageBrief: 'A stock photograph', imageSearchTerms: [], imageAltText: 'A stock photograph' }) }] } }] });
		mockFindMagnificStockImage.mockResolvedValue(null);
		mockCreateWordPressDraft.mockResolvedValue({ ID: 101, status: 'draft' });

		await generateBlogPostsFromCalendar(calendar, new FormData());

		expect(mockFindMagnificStockImage).toHaveBeenCalledWith('magnific-key', {
			title: 'First topic',
			imageBrief: 'A stock photograph',
			searchTerms: ['First topic', 'A stock photograph'],
		});
	});

	it('aggregates Gemini token usage for the generation run', async () => {
		mockSmartFetch
			.mockResolvedValueOnce({
				usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 40, totalTokenCount: 140 },
				candidates: [{ content: { parts: [{ text: geminiArticle('one two') }] } }],
			})
			.mockResolvedValueOnce({
				usageMetadata: { promptTokenCount: 200, candidatesTokenCount: 60, totalTokenCount: 260, thoughtsTokenCount: 10, cachedContentTokenCount: 5 },
				candidates: [{ content: { parts: [{ text: geminiArticle('three four') }] } }],
			});
		mockCreateWordPressDraft.mockResolvedValue({ ID: 101, status: 'draft' });

		const formData = new FormData();
		formData.set('count', '2');
		const result = await generateBlogPostsFromCalendar(calendar, formData);

		expect(result.usage).toEqual({
			model: 'gemini-2.5-flash',
			requestCount: 2,
			promptTokenCount: 300,
			candidatesTokenCount: 100,
			totalTokenCount: 400,
			thoughtsTokenCount: 10,
			cachedContentTokenCount: 5,
		});
	});

	it('fetches the configured site blog-link catalog once and includes it in every Gemini prompt when it exceeds five posts', async () => {
		mockGetSiteConfig.mockResolvedValue({
			blog_url: 'https://www.thethreemusesofbluffton.com',
			blogRss: 'https://www.thethreemusesofbluffton.com/feed/',
		});
		mockGetWordPressFeedLinks.mockResolvedValue(Array.from({ length: 6 }, (_, index) => ({
			title: index === 0 ? 'Creative Workshops in Bluffton' : `Published post ${index + 1}`,
			url: index === 0
				? 'https://www.thethreemusesofbluffton.com/blog/creative-workshops/'
				: `https://www.thethreemusesofbluffton.com/blog/published-post-${index + 1}/`,
		})));
		mockSmartFetch
			.mockResolvedValueOnce({ candidates: [{ content: { parts: [{ text: geminiArticle('one two') }] } }] })
			.mockResolvedValueOnce({ candidates: [{ content: { parts: [{ text: geminiArticle('three four') }] } }] });
		mockCreateWordPressDraft.mockResolvedValue({ ID: 101, status: 'draft' });

		const formData = new FormData();
		formData.set('siteName', 'threemuses');
		formData.set('count', '2');
		const result = await generateBlogPostsFromCalendar(calendar, formData);

		expect(result.results).toHaveLength(2);
		expect(mockGetWordPressFeedLinks).toHaveBeenCalledOnce();
		expect(mockGetWordPressFeedLinks).toHaveBeenCalledWith('https://www.thethreemusesofbluffton.com/feed/', 100);
		const prompts = mockSmartFetch.mock.calls.map((call) => JSON.parse(String(call[1]?.requestInit?.body)).contents[0].parts[0].text);
		expect(prompts).toHaveLength(2);
		for (const prompt of prompts) {
			expect(prompt).toContain('Use the exact title and exact URL from the array');
			expect(prompt).toContain('https://www.thethreemusesofbluffton.com/blog/creative-workshops/');
		}
	});

	it('omits a blog-link catalog of five or fewer posts from every Gemini prompt', async () => {
		mockGetSiteConfig.mockResolvedValue({
			blog_url: 'https://www.thethreemusesofbluffton.com',
			blogRss: 'https://www.thethreemusesofbluffton.com/feed/',
		});
		mockGetWordPressFeedLinks.mockResolvedValue(Array.from({ length: 5 }, (_, index) => ({
			title: `Published post ${index + 1}`,
			url: `https://www.thethreemusesofbluffton.com/blog/published-post-${index + 1}/`,
		})));
		mockSmartFetch.mockResolvedValueOnce({ candidates: [{ content: { parts: [{ text: geminiArticle('one two') }] } }] });
		mockCreateWordPressDraft.mockResolvedValue({ ID: 101, status: 'draft' });

		const formData = new FormData();
		formData.set('siteName', 'threemuses');
		formData.set('count', '1');
		await generateBlogPostsFromCalendar(calendar, formData);

		const prompt = JSON.parse(String(mockSmartFetch.mock.calls[0][1]?.requestInit?.body)).contents[0].parts[0].text;
		expect(prompt).toContain('Blog-link rules: No published-post array was provided');
		expect(prompt).not.toContain('Published post 1');
	});

	it('uses the SimpleMenu route criteria for the site-link catalog', async () => {
		mockGetSiteConfig.mockResolvedValue({
			blog_url: 'https://www.thethreemusesofbluffton.com',
			localPath: '/site/threemuses',
		});
		mockReadFile.mockResolvedValue(JSON.stringify({
			siteInfo: { url: 'https://www.thethreemusesofbluffton.com' },
			routes: [
				{ name: 'Home', path: '/' },
				{ name: 'About', path: '/about' },
				{ name: 'Services', routes: [{ name: 'Cleaning', path: '/services/cleaning' }] },
				{ name: 'Hidden page', path: '/hidden', hidden: true },
			],
		}));
		mockSmartFetch.mockResolvedValueOnce({ candidates: [{ content: { parts: [{ text: geminiArticle('one two') }] } }] });
		mockCreateWordPressDraft.mockResolvedValue({ ID: 101, status: 'draft' });

		const formData = new FormData();
		formData.set('siteName', 'threemuses');
		formData.set('count', '1');
		await generateBlogPostsFromCalendar(calendar, formData);

		const prompt = JSON.parse(String(mockSmartFetch.mock.calls[0][1]?.requestInit?.body)).contents[0].parts[0].text;
		expect(prompt).toContain('Site-link rules: You may link only to pages');
		expect(prompt).toContain('https://www.thethreemusesofbluffton.com/');
		expect(prompt).toContain('https://www.thethreemusesofbluffton.com/about');
		expect(prompt).toContain('https://www.thethreemusesofbluffton.com/hidden');
		expect(prompt).not.toContain('/services/cleaning');
	});

	it('prefetches Google results before creating a draft and supplies exact sources to Gemini', async () => {
		mockGetFullPixelatedConfig.mockReturnValue({
			integrations: {
				google: { api_key: 'google-key' },
				googleGemini: { api_key: 'gemini-key' },
				wordpress: { site: 'blog.example.com', apiToken: 'wp-token', baseURL: 'https://wp.example/' },
			},
		});
		mockSmartFetch
			.mockResolvedValueOnce({ candidates: [{ content: { parts: [{ text: geminiArticle('one two') }] } }] });
		mockGoogleSearchWithGeminiGrounding.mockResolvedValueOnce([{ title: 'SBA guidance', url: 'https://www.sba.gov/article', snippet: 'Official small business guidance.' }]);
		mockCreateWordPressDraft.mockResolvedValue({ ID: 101, status: 'draft' });

		await generateBlogPostsFromCalendar(calendar, new FormData());

		expect(mockGoogleSearchWithGeminiGrounding).toHaveBeenCalledWith({ apiKey: 'gemini-key', criteria: ['First topic First note'], count: 10, debug: false });
		const prompt = JSON.parse(String(mockSmartFetch.mock.calls[0][1]?.requestInit?.body)).contents[0].parts[0].text;
		expect(prompt).toContain('link only to exact URLs in the following Google search-result array');
		expect(prompt).toContain('https://www.sba.gov/article');
		expect(mockCreateWordPressDraft).toHaveBeenCalledOnce();
	});

	it('uses the same Google source prefetch for content updates', async () => {
		mockGetFullPixelatedConfig.mockReturnValue({
			integrations: {
				google: { api_key: 'google-key' },
				googleGemini: { api_key: 'gemini-key' },
				wordpress: { site: 'blog.example.com', apiToken: 'wp-token', baseURL: 'https://wp.example/' },
			},
		});
		const formData = new FormData();
		formData.set('operation', 'update');
		formData.set('draftIds', '501');
		formData.set('updateMode', 'content');
		mockSmartFetch
			.mockResolvedValueOnce({ posts: [{ ID: 501, title: 'First topic' }] })
			.mockResolvedValueOnce({ candidates: [{ content: { parts: [{ text: geminiArticle('updated article') }] } }] });
		mockGoogleSearchWithGeminiGrounding.mockResolvedValueOnce([{ title: 'EPA guidance', url: 'https://www.epa.gov/article', snippet: 'Official environmental guidance.' }]);
		mockUpdateWordPressDraft.mockResolvedValue({ ID: 501, status: 'draft' });

		await generateBlogPostsFromCalendar(calendar, formData);

		expect(mockGoogleSearchWithGeminiGrounding).toHaveBeenCalledWith({ apiKey: 'gemini-key', criteria: ['First topic First note'], count: 10, debug: false });
		const prompt = JSON.parse(String(mockSmartFetch.mock.calls[1][1]?.requestInit?.body)).contents[0].parts[0].text;
		expect(prompt).toContain('https://www.epa.gov/article');
		expect(mockUpdateWordPressDraft).toHaveBeenCalledWith(501, expect.objectContaining({ content: 'updated article' }));
	});

	it('preserves renamed objective keys in the prompt and normalizes them locally', async () => {
		const snakeCaseCalendar = {
			...calendar,
			blogCalendarConfig: {
				criteria: {
					subjectiveCriteria: ['Use examples'],
					objectiveCriteria: {
						minimum_words: 2,
						maximum_words: 4,
						require_wordpress_blocks: false,
					},
				},
			},
		};
		mockSmartFetch.mockResolvedValueOnce({ candidates: [{ content: { parts: [{ text: geminiArticle('one two') }] } }] });
		mockCreateWordPressDraft.mockResolvedValue({ ID: 101, status: 'draft' });

		const result = await generateBlogPostsFromCalendar(snakeCaseCalendar, new FormData());

		expect(result.results[0].status).toBe('draft');
		const requestBody = JSON.parse(String(mockSmartFetch.mock.calls[0][1]?.requestInit?.body));
		const prompt = requestBody.contents[0].parts[0].text;
		expect(prompt).toContain('1. minimum_words: 2');
		expect(prompt).toContain('2. maximum_words: 4');
		expect(prompt).not.toContain('minimumWords');
	});

	it('accepts a fenced JSON response while using Google Search grounding', async () => {
		mockSmartFetch.mockResolvedValueOnce({ candidates: [{ content: { parts: [{ text: `Here is the article:\n\`\`\`json\n${geminiArticle('one two')}\n\`\`\`` }] } }] });
		mockCreateWordPressDraft.mockResolvedValue({ ID: 101, status: 'draft' });

		const result = await generateBlogPostsFromCalendar(calendar, new FormData());

		expect(result.results[0].status).toBe('draft');
		expect(mockSmartFetch.mock.calls[0][1]).toMatchObject({ timeout: 120000, retries: 0 });
		const requestBody = JSON.parse(String(mockSmartFetch.mock.calls[0][1]?.requestInit?.body));
		expect(requestBody).not.toHaveProperty('tools');
		expect(requestBody.generationConfig.responseMimeType).toBe('application/json');
		expect(requestBody.generationConfig.responseSchema).toEqual(expect.objectContaining({ type: 'OBJECT' }));
		expect(requestBody.contents[0].parts[0].text).toContain('Respond ONLY with raw JSON, starting with { and ending with }.');
		expect(requestBody.contents[0].parts[0].text).toContain('Do NOT wrap the response in markdown code blocks like ```json ... ```.');
	});

	it('creates a draft when the generated article meets configured criteria', async () => {
		mockSmartFetch.mockResolvedValueOnce({ candidates: [{ content: { parts: [{ text: geminiArticle('one two') }] } }] });
		mockCreateWordPressDraft.mockResolvedValue({ ID: 101, status: 'draft' });

		const result = await generateBlogPostsFromCalendar(calendar, new FormData());

		expect(result.results[0]).toMatchObject({ calendarId: 1, status: 'draft', wordpressPostId: 101 });
		expect(mockSmartFetch).toHaveBeenCalledTimes(1);
		expect(mockCreateWordPressDraft).toHaveBeenCalledOnce();
	});

});