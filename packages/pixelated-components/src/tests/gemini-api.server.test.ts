import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../components/foundation/smartfetch', () => ({
	smartFetch: vi.fn()
}));

vi.mock('../components/config/config', () => ({
	getFullPixelatedConfig: vi.fn(() => ({}))
}));

import { smartFetch } from '../components/foundation/smartfetch';
import { getFullPixelatedConfig } from '../components/config/config';
import { generateAiRecommendations } from '../components/integrations/gemini-api.server';
import { parsePaLMResponse, inferBusinessType, parseGeminiResponse } from '../components/integrations/gemini-api.functions';

const mockSiteInfo: any = {
	name: 'Test Site',
	description: 'Test Description',
	address: {
		addressLocality: 'Austin',
		addressRegion: 'TX',
		postalCode: '78701'
	}
};

const request = {
	route: { name: 'Home', path: '/', title: 'Home', keywords: ['test'], description: 'Test page' },
	siteInfo: mockSiteInfo
};

describe('gemini-api.server', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should export generateAiRecommendations function', () => {
		expect(typeof generateAiRecommendations).toBe('function');
	});

	it('should parse a valid Gemini response successfully', async () => {
		vi.mocked(smartFetch).mockResolvedValueOnce({
			candidates: [
				{
					content: {
						parts: [
							{
								text: '{"title":"Recommended Title","keywords":["seo","local"],"description":"A sample recommendation."}'
							}
						]
					}
				}
			]
		});

		const result = await generateAiRecommendations(request, 'test-key');

		expect(result.title).toBe('Recommended Title');
		expect(result.keywords).toEqual(['seo', 'local']);
		expect(result.description).toBe('A sample recommendation.');
	});

	it('should return an error when Gemini response is invalid', async () => {
		vi.mocked(smartFetch).mockResolvedValueOnce({ candidates: [] });

		const result = await generateAiRecommendations(request, 'test-key');

		expect(result.error).toContain('Failed to parse AI recommendations');
	});

	it('should call smartFetch with the Gemini generateContent endpoint', async () => {
		vi.mocked(smartFetch).mockResolvedValueOnce({
			candidates: [
				{
					content: {
						parts: [
							{ text: '{"title":"Test","keywords":[],"description":"OK"}' }
						]
					}
				}
			]
		});

		await generateAiRecommendations(request, 'test-key');

		expect((smartFetch as any).mock.calls[0][0]).toContain('v1beta/models/gemini-2.5-flash:generateContent');
		expect((smartFetch as any).mock.calls[0][0]).toContain('key=test-key');
	});

	it('should return an error if no API key is configured', async () => {
		vi.mocked(getFullPixelatedConfig).mockReturnValueOnce({});
		const result = await generateAiRecommendations(request);
		expect(result.error).toContain('Google Gemini API key not configured');
	});

	it('should return an error when response is truncated by MAX_TOKENS', async () => {
		vi.mocked(smartFetch).mockResolvedValueOnce({
			candidates: [
				{
					finishReason: 'MAX_TOKENS',
					content: {
						parts: [
							{ text: '{"title":"Truncated","keywords":[],"description":"Partial"}' }
						]
					}
				}
			]
		});

		const result = await generateAiRecommendations(request, 'test-key');
		expect(result.error).toContain('truncated due to token limits');
	});

	it('should parse Gemini response wrapped in markdown fences', async () => {
		vi.mocked(smartFetch).mockResolvedValueOnce({
			candidates: [
				{
					content: {
						parts: [
							{ text: '```json\n{"title":"Recommended Title","keywords":["seo","local"],"description":"A sample recommendation."}\n```' }
						]
					}
				}
			]
		});

		const result = await generateAiRecommendations(request, 'test-key');
		expect(result.title).toBe('Recommended Title');
		expect(result.keywords).toEqual(['seo','local']);
		expect(result.description).toBe('A sample recommendation.');
	});

	it('should throw if Gemini response has no candidates', () => {
		expect(() => parseGeminiResponse({ candidates: [] })).toThrow('No candidates in Gemini API response');
	});

	it('should throw if Gemini response has no content parts', () => {
		expect(() => parseGeminiResponse({ candidates: [{ content: {} }] })).toThrow('No content parts in Gemini API response');
	});

	it('should throw if Gemini response text is empty', () => {
		expect(() => parseGeminiResponse({ candidates: [{ content: { parts: [{ text: '' }] } }] })).toThrow('No text content in Gemini API response');
	});

	it('should return general business when description contains no known keywords', () => {
		expect(inferBusinessType({ name: '', description: 'A local service provider for everything' } as any)).toBe('general business');
	});

	it('parses PaLM-formatted output fallback', () => {
		const result = parsePaLMResponse({
			candidates: [
				{ output: '{"title":"PaLM Title","keywords":["palm"],"description":"Fallback response."}' }
			]
		});

		expect(result.title).toBe('PaLM Title');
		expect(result.keywords).toEqual(['palm']);
		expect(result.description).toBe('Fallback response.');
	});

	it('returns error object when PaLM output is invalid', () => {
		const result = parsePaLMResponse({
			candidates: [
				{ output: 'not json' }
			]
		});

		expect(result.error).toBe('Failed to parse AI recommendations');
	});

	it('infers business type from description keywords', () => {
		expect(inferBusinessType({ name: '', description: 'The best real estate agency' } as any)).toBe('real estate');
		expect(inferBusinessType({ name: '', description: 'A great restaurant serving food' } as any)).toBe('restaurant');
		expect(inferBusinessType({ name: '', description: 'Legal services and law advice' } as any)).toBe('legal services');
		expect(inferBusinessType({ name: '', description: 'Health and medical care' } as any)).toBe('healthcare');
		expect(inferBusinessType({ name: '', description: 'Retail store with local products' } as any)).toBe('retail');
		expect(inferBusinessType({ name: '', description: 'A consulting partner' } as any)).toBe('consulting');
	});
});
