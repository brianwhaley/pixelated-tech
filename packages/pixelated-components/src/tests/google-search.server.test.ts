import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../components/foundation/smartfetch', () => ({
	smartFetch: vi.fn(),
}));

const { smartFetch } = await import('../components/foundation/smartfetch');
const { googleSearchWithGeminiGrounding } = await import('../components/integrations/gemini.search.server');
const mockSmartFetch = vi.mocked(smartFetch);
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const capturedGeminiGroundingResponse = {
	candidates: [{
		content: {
			parts: [{
				text: 'Grounded research identifies official guidance and current standards.',
			}],
		},
		finishReason: 'STOP',
		citationMetadata: {
			citationSources: [{ uri: 'https://source-one.example' }],
		},
		groundingMetadata: {
			searchEntryPoint: { renderedContent: '<div>Search</div>' },
			groundingSupports: [{ groundingChunkIndices: [0] }],
			groundingChunks: [
				{ web: { title: 'Grounded source one', uri: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/source-one' } },
				{ web: { title: 'Grounded source two', uri: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/source-two' } },
			],
		},
	}],
};

describe('googleSearchWithGeminiGrounding', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mockFetch.mockReset();
	});

	it('joins criteria, limits the requested result count, and normalizes valid results', async () => {
		mockSmartFetch.mockResolvedValue({
			candidates: [{
				content: { parts: [{ text: 'Use official guidance and current standards when evaluating basement waterproofing projects.' }] },
				groundingMetadata: { groundingChunks: [{ web: { title: 'Official guidance', uri: 'https://example.com/guidance' } }] },
			}],
		});

		const results = await googleSearchWithGeminiGrounding({
			apiKey: 'api-key',
			criteria: ['Basement waterproofing', 'South Carolina'],
			count: 25,
		});

		const requestUrl = new URL(String(mockSmartFetch.mock.calls[0][0]));
		expect(requestUrl.pathname).toContain('gemini-2.5-flash:generateContent');
		const requestBody = JSON.parse(String(mockSmartFetch.mock.calls[0][1]?.requestInit?.body));
		expect(requestBody.contents[0].parts[0].text).toContain('Basement waterproofing South Carolina');
		expect(requestBody.tools).toEqual([{ googleSearch: {} }]);
		expect(requestBody.generationConfig).toEqual({ temperature: 0.2 });
		expect(requestBody.contents[0].parts[0].text).toContain('Summarize 3 key findings in original words');
		expect(requestBody.contents[0].parts[0].text).toContain('Do not quote or reproduce source text');
		expect(results).toEqual([{ title: 'Official guidance', url: 'https://example.com/guidance', snippet: 'Use official guidance and current standards when evaluating basement waterproofing projects.' }]);
	});

	it('returns no results without usable search configuration', async () => {
		await expect(googleSearchWithGeminiGrounding({ apiKey: ' ', criteria: 'topic' })).resolves.toEqual([]);
		expect(mockSmartFetch).not.toHaveBeenCalled();
	});

	it('returns no results when the search request fails', async () => {
		mockSmartFetch.mockRejectedValue(new Error('Search unavailable'));

		await expect(googleSearchWithGeminiGrounding({ apiKey: 'api-key', criteria: 'topic' })).resolves.toEqual([]);
	});

	it('accepts the debug option without changing the result contract', async () => {
		mockSmartFetch.mockResolvedValue({ candidates: [{ content: { parts: [{ text: 'No grounded sources were found.' }] }, groundingMetadata: { groundingChunks: [] } }] });

		await expect(googleSearchWithGeminiGrounding({ apiKey: 'api-key', criteria: 'topic', debug: true })).resolves.toEqual([]);
	});

	it('falls back to verified grounding sources when structured output is unavailable', async () => {
		mockSmartFetch.mockResolvedValue({
			candidates: [{ content: { parts: [{ text: 'Search completed.' }] }, groundingMetadata: { groundingChunks: [{ web: { title: 'Official guidance', uri: 'https://example.com/guidance' } }] } }],
		});

		await expect(googleSearchWithGeminiGrounding({ apiKey: 'api-key', criteria: 'topic' })).resolves.toEqual([{ title: 'Official guidance', url: 'https://example.com/guidance', snippet: 'Search completed.' }]);
	});

	it('parses a captured Gemini grounding response with multiple sources', async () => {
		mockSmartFetch.mockResolvedValue(capturedGeminiGroundingResponse);
		mockFetch.mockImplementation(async (sourceUrl: string) => ({
			headers: {
				get: () => sourceUrl.endsWith('source-one') ? 'https://source-one.example/article' : 'https://source-two.example/article',
			},
		}));

		await expect(googleSearchWithGeminiGrounding({ apiKey: 'api-key', criteria: 'home maintenance' })).resolves.toEqual([
			{ title: 'Grounded source one', url: 'https://source-one.example/article', snippet: 'Grounded research identifies official guidance and current standards.' },
			{ title: 'Grounded source two', url: 'https://source-two.example/article', snippet: 'Grounded research identifies official guidance and current standards.' },
		]);
		expect(mockFetch).toHaveBeenCalledTimes(2);
	});

	it('omits unresolved grounding redirects instead of returning Vertex URLs', async () => {
		mockSmartFetch.mockResolvedValue({ candidates: [{ content: { parts: [{ text: 'Summary.' }] }, groundingMetadata: { groundingChunks: [{ web: { title: 'Unavailable source', uri: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/missing' } }] } }] });
		mockFetch.mockResolvedValue({ headers: { get: () => null } });

		await expect(googleSearchWithGeminiGrounding({ apiKey: 'api-key', criteria: 'topic' })).resolves.toEqual([]);
	});

	it('returns no results when Gemini returns no candidates or metadata', async () => {
		for (const response of [{}, { candidates: [] }, { candidates: [{ content: { parts: [{ text: 'No sources.' }] } }] }]) {
			mockSmartFetch.mockResolvedValueOnce(response);
			await expect(googleSearchWithGeminiGrounding({ apiKey: 'api-key', criteria: 'topic' })).resolves.toEqual([]);
		}
	});

	it('does not retry a RECITATION response', async () => {
		mockSmartFetch.mockResolvedValue({ candidates: [{ finishReason: 'RECITATION', content: { parts: [] }, groundingMetadata: { groundingChunks: [] } }] });

		await expect(googleSearchWithGeminiGrounding({ apiKey: 'api-key', criteria: 'topic' })).resolves.toEqual([]);
		expect(mockSmartFetch).toHaveBeenCalledTimes(1);
	});

	it('ignores malformed grounding chunks and keeps valid sources', async () => {
		mockSmartFetch.mockResolvedValue({
			candidates: [{
				content: { parts: [{ text: 'Search completed.' }] },
				groundingMetadata: {
					groundingChunks: [
						{},
						{ web: { title: '', uri: 'https://example.com/missing-title' } },
						{ web: { title: 'Invalid URL', uri: 'not-a-url' } },
						{ web: { title: 'Valid source', uri: 'https://example.com/valid' } },
					],
				},
			}],
		});

		await expect(googleSearchWithGeminiGrounding({ apiKey: 'api-key', criteria: 'topic' })).resolves.toEqual([{ title: 'Valid source', url: 'https://example.com/valid', snippet: 'Search completed.' }]);
	});

	it('uses response text as context while returning only grounded URLs', async () => {
		mockSmartFetch.mockResolvedValue({
			candidates: [{
				content: { parts: [
					{ text: 'Grounded research supports regular inspections.' },
					{ text: ' Use current local guidance.' },
				] },
				groundingMetadata: { groundingChunks: [{ web: { title: 'Grounded title', uri: 'https://example.com/grounded' } }] },
			}],
		});

		await expect(googleSearchWithGeminiGrounding({ apiKey: 'api-key', criteria: 'topic' })).resolves.toEqual([{ title: 'Grounded title', url: 'https://example.com/grounded', snippet: 'Grounded research supports regular inspections. Use current local guidance.' }]);
	});

	it('uses an empty snippet when Gemini returns no summary text', async () => {
		mockSmartFetch.mockResolvedValue({ candidates: [{ content: { parts: [] }, groundingMetadata: { groundingChunks: [{ web: { title: 'First source', uri: 'https://example.com/first' } }] } }] });

		await expect(googleSearchWithGeminiGrounding({ apiKey: 'api-key', criteria: 'topic' })).resolves.toEqual([{ title: 'First source', url: 'https://example.com/first', snippet: '' }]);
	});

	it('normalizes lower, fractional, negative, and oversized counts', async () => {
		mockSmartFetch.mockResolvedValue({
			candidates: [{ content: { parts: [{ text: 'Search completed.' }] }, groundingMetadata: { groundingChunks: [
				{ web: { title: 'One', uri: 'https://example.com/one' } },
				{ web: { title: 'Two', uri: 'https://example.com/two' } },
			] } }],
		});

		await expect(googleSearchWithGeminiGrounding({ apiKey: 'api-key', criteria: 'topic', count: 0 })).resolves.toHaveLength(1);
		await expect(googleSearchWithGeminiGrounding({ apiKey: 'api-key', criteria: 'topic', count: -2 })).resolves.toHaveLength(1);
		await expect(googleSearchWithGeminiGrounding({ apiKey: 'api-key', criteria: 'topic', count: 1.9 })).resolves.toHaveLength(1);
		await expect(googleSearchWithGeminiGrounding({ apiKey: 'api-key', criteria: 'topic', count: 99 })).resolves.toHaveLength(2);
	});

	it('logs raw response diagnostics without changing the debug result contract', async () => {
		const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => undefined);
		mockSmartFetch.mockResolvedValue(capturedGeminiGroundingResponse);
		mockFetch.mockImplementation(async (sourceUrl: string) => ({
			headers: {
				get: () => sourceUrl.endsWith('source-one') ? 'https://source-one.example/article' : 'https://source-two.example/article',
			},
		}));

		try {
			const results = await googleSearchWithGeminiGrounding({ apiKey: 'api-key', criteria: 'topic', debug: true });
			expect(results).toHaveLength(2);
			const diagnosticCall = consoleInfo.mock.calls.find(([message]) => message === '[google-search-gemini] Raw response diagnostics');
			expect(diagnosticCall).toBeDefined();
			expect(JSON.parse(String(diagnosticCall?.[1]))).toMatchObject({
				candidateCount: 1,
				finishReason: 'STOP',
				textPartCount: 1,
				groundingChunkCount: 2,
				searchEntryPointPresent: true,
				groundingSupportsCount: 1,
				citationSourceCount: 1,
			});
		} finally {
			consoleInfo.mockRestore();
		}
	});
});