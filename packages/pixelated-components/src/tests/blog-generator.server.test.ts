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
const { measureBlogArticle, validateBlogArticle } = await import('../components/admin/blog/blog-generator.validation');

const mockGetFullPixelatedConfig = vi.mocked(getFullPixelatedConfig);
const mockSmartFetch = vi.mocked(smartFetch);
const mockCreateWordPressDraft = vi.mocked(createWordPressDraft);

function geminiArticle(article: string, metrics?: Record<string, number>) {
	return JSON.stringify({
		article,
		selfAssessment: {
			passed: true,
			metrics: metrics || {},
			failures: [],
		},
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

	it('sends a generated article to WordPress when its configured criteria pass', async () => {
		mockSmartFetch.mockResolvedValueOnce({ candidates: [{ content: { parts: [{ text: geminiArticle('one two') }] } }] });
		mockCreateWordPressDraft.mockResolvedValue({ ID: 101, status: 'draft' });

		const result = await generateBlogPostsFromCalendar(calendar, new FormData());

		expect(result.results[0]).toMatchObject({ calendarId: 1, status: 'draft', wordpressPostId: 101 });
		expect(mockCreateWordPressDraft).toHaveBeenCalledOnce();
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

	it('accepts a fenced JSON response and sends the response schema', async () => {
		mockSmartFetch.mockResolvedValueOnce({ candidates: [{ content: { parts: [{ text: `Here is the article:\n\`\`\`json\n${geminiArticle('one two')}\n\`\`\`` }] } }] });
		mockCreateWordPressDraft.mockResolvedValue({ ID: 101, status: 'draft' });

		const result = await generateBlogPostsFromCalendar(calendar, new FormData());

		expect(result.results[0].status).toBe('draft');
		expect(mockSmartFetch.mock.calls[0][1]).toMatchObject({ timeout: 120000, retries: 0 });
		const requestBody = JSON.parse(String(mockSmartFetch.mock.calls[0][1]?.requestInit?.body));
		expect(requestBody.generationConfig.responseMimeType).toBe('application/json');
		expect(requestBody.generationConfig.responseSchema).toMatchObject({
			type: 'OBJECT',
			properties: { article: { type: 'STRING' }, selfAssessment: { type: 'OBJECT' } },
		});
		expect(requestBody.generationConfig.responseSchema.properties.selfAssessment.properties.metrics.required).toEqual(expect.arrayContaining([
			'wordCount', 'paragraphsIncluded', 'bodyParagraphsIncluded', 'contentParagraphSentenceCounts',
			'introductionIncluded', 'conclusionIncluded',
			'callToActionIncluded', 'requiredCallToActionHeadingIncluded', 'requiredCallToActionLinkIncluded',
			'wordpressBlocksIncluded', 'objectiveCriteriaPassed', 'subjectiveCriteriaPassed',
		]));
	});

	it('creates a draft without criteria repair when the JSON article is valid', async () => {
		mockSmartFetch.mockResolvedValueOnce({ candidates: [{ content: { parts: [{ text: geminiArticle('too many words in this article') }] } }] });
		mockCreateWordPressDraft.mockResolvedValue({ ID: 101, status: 'draft' });

		const result = await generateBlogPostsFromCalendar(calendar, new FormData());

		expect(result.results[0]).toMatchObject({ calendarId: 1, status: 'draft', wordpressPostId: 101 });
		expect(mockSmartFetch).toHaveBeenCalledTimes(1);
		expect(mockCreateWordPressDraft).toHaveBeenCalledOnce();
		expect(mockCreateWordPressDraft.mock.calls[0][0].content).toBe('too many words in this article');
	});

	/*
	it('keeps the best candidate when a later repair is worse', async () => {
		mockSmartFetch
			.mockResolvedValueOnce({ candidates: [{ content: { parts: [{ text: geminiArticle('one two three four five') }] } }] })
			.mockResolvedValueOnce({ candidates: [{ content: { parts: [{ text: geminiArticle('one') }] } }] })
			.mockResolvedValueOnce({ candidates: [{ content: { parts: [{ text: geminiArticle('one') }] } }] });

		const result = await generateBlogPostsFromCalendar(calendar, new FormData());

		expect(result.results[0].status).toBe('failed');
		expect(result.results[0].error).toContain('maximum is 4');
		expect(result.results[0].error).not.toContain('minimum is 2');
		expect(mockCreateWordPressDraft).not.toHaveBeenCalled();
	});
	*/

	it('reports paragraph, sentence, CTA, and link failures together', () => {
		const errors = validateBlogArticle(
			'<p>Short.</p><p>Also short.</p><p><a href="#">Contact us</a></p>',
			{
				objectiveCriteria: {
					minimumWords: 20,
					requireIntroParagraph: true,
					requireConclusionParagraph: true,
					requireCallToAction: true,
					minimumBodyParagraphs: 3,
					minimumParagraphSentences: 2,
					minimumInternalLinks: 2,
					minimumExternalLinks: 1,
					requiredCallToActionLink: 'https://example.com/contact',
					requireWordPressBlocks: true,
					requiredCallToActionHeading: 'Call to Action',
				},
			},
			'example.com'
		);

		expect(errors).toEqual(expect.arrayContaining([
			'WordPress block markup is missing',
			'word count is 5; minimum is 20',
			'required call to action heading is missing: Call to Action',
			'body paragraph count is 0; minimum is 3',
			'content paragraph 1 has 1 sentences; minimum is 2',
			'content paragraph 2 has 1 sentences; minimum is 2',
			'internal link count is 0; minimum is 2',
			'external link count is 0; minimum is 1',
			'call to action is missing required link https://example.com/contact',
		]));
	});

	it('uses local metrics even when Gemini reports different values', async () => {
		mockSmartFetch.mockResolvedValueOnce({ candidates: [{ content: { parts: [{ text: geminiArticle('one two', {
			wordCount: 999,
			paragraphsIncluded: 99,
		}) }] } }] });
		mockCreateWordPressDraft.mockResolvedValue({ ID: 101, status: 'draft' });

		const result = await generateBlogPostsFromCalendar(calendar, new FormData());

		expect(result.results[0].status).toBe('draft');
		expect(measureBlogArticle('one two', 'blog.example.com')).toEqual({
			wordCount: 2,
			paragraphsIncluded: 0,
			bodyParagraphsIncluded: 0,
			contentParagraphSentenceCounts: [],
			introductionIncluded: false,
			conclusionIncluded: false,
			listBlocksIncluded: 0,
			listItemsIncluded: 0,
			h2HeadingsIncluded: 0,
			internalLinksIncluded: 0,
			externalLinksIncluded: 0,
			sentenceCount: 0,
			callToActionIncluded: false,
			requiredCallToActionHeadingIncluded: false,
			requiredCallToActionLinkIncluded: false,
			wordpressBlocksIncluded: false,
		});
	});

	it('accepts Gutenberg blocks, HTML links, and a separate CTA heading', () => {
		const article = [
			'<!-- wp:paragraph --><p>Introduction sentence. Another sentence.</p><!-- /wp:paragraph -->',
			'<!-- wp:paragraph --><p>Body sentence. Another sentence.</p><!-- /wp:paragraph -->',
			'<!-- wp:heading --><h2>Call to Action</h2><!-- /wp:heading -->',
			'<!-- wp:paragraph --><p>Sign up for an assessment. <a href="https://www.pixelated.tech/contact">Contact us</a>. <a href="https://source.example/fact">Source</a>.</p><!-- /wp:paragraph -->',
		].join('');

		expect(validateBlogArticle(article, {
			objectiveCriteria: {
				minimumWords: 1,
				maximumWords: 100,
				requireCallToAction: true,
				requireWordPressBlocks: true,
				requiredCallToActionHeading: 'Call to Action',
				minimumInternalLinks: 1,
				minimumExternalLinks: 1,
				requiredCallToActionLink: 'https://www.pixelated.tech/contact',
			},
		}, 'www.pixelated.tech')).toEqual([]);
	});

	it('reports missing measurable content requirements', () => {
		const errors = validateBlogArticle(
			'<!-- wp:paragraph --><p>This article explains the topic clearly.</p><!-- /wp:paragraph -->',
			{
				objectiveCriteria: {
					minimumWords: 20,
					requireIntroParagraph: true,
					requireConclusionParagraph: true,
					requireCallToAction: true,
					minimumBodyParagraphs: 1,
					minimumParagraphSentences: 2,
					minimumInternalLinks: 1,
					requireWordPressBlocks: true,
				},
			},
			'example.com'
		);

		expect(errors).toEqual(expect.arrayContaining([
			'word count is 6; minimum is 20',
			'body paragraph count is 0; minimum is 1',
			'content paragraph 1 has 1 sentences; minimum is 2',
			'call to action paragraph is missing',
			'internal link count is 0; minimum is 1',
		]));
	});

	it('accepts the measurable content requirements', () => {
		const article = [
			'<!-- wp:paragraph --><p>In short, a clear website helps customers understand what a business offers.</p><!-- /wp:paragraph -->',
			'<!-- wp:heading {"level":2} --><h2>Why this matters</h2><!-- /wp:heading -->',
			'<!-- wp:paragraph --><p>Pixelated Tech explains the approach with practical examples.</p><!-- /wp:paragraph -->',
			'<!-- wp:heading {"level":2} --><h2>Practical steps</h2><!-- /wp:heading -->',
			'<!-- wp:list --><ul><li>Start with a clear goal.</li></ul><!-- /wp:list -->',
		].join('');

		expect(validateBlogArticle(article, {
			objectiveCriteria: {
				minimumWords: 1,
				maximumWords: 100,
				requireWordPressBlocks: true,
			},
		}, 'example.com')).toEqual([]);
		expect(measureBlogArticle(article, 'example.com')).toMatchObject({
			paragraphsIncluded: 2,
			listBlocksIncluded: 1,
			listItemsIncluded: 1,
		});
	});

	it('creates a draft when configured content criteria fail', async () => {
		mockSmartFetch.mockResolvedValue({ candidates: [{ content: { parts: [{ text: geminiArticle('<p>one two</p>') }] } }] });
		mockCreateWordPressDraft.mockResolvedValue({ ID: 101, status: 'draft' });

		const strictCalendar = {
			...calendar,
			blogCalendarConfig: {
				criteria: {
					...calendar.blogCalendarConfig.criteria,
					objectiveCriteria: {
						...calendar.blogCalendarConfig.criteria.objectiveCriteria,
						requireIntroParagraph: true,
						requireConclusionParagraph: true,
						requireCallToAction: true,
						minimumBodyParagraphs: 1,
						minimumParagraphSentences: 2,
					},
				},
			},
		};
		const result = await generateBlogPostsFromCalendar(strictCalendar, new FormData());

		expect(result.results[0]).toMatchObject({ status: 'draft', wordpressPostId: 101 });
		expect(mockCreateWordPressDraft).toHaveBeenCalledOnce();
	});

});