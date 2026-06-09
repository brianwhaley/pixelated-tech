import type { RouteType, SiteInfo } from '../config/config.types';

export interface GeminiRecommendationRequest {
  route: RouteType;
  siteInfo: SiteInfo;
  baseUrl?: string;
}

export interface GeminiRecommendationResponse {
  title?: string;
  keywords?: string[];
  description?: string;
  error?: string;
}

// Debug logging: set to true to inspect raw Gemini API responses locally
const debug = false;

/**
 * Parse the response from Google Gemini API
 */
export function parseGeminiResponse(data: any): GeminiRecommendationResponse {
	try {
		if (debug) console.log('Gemini API raw response:', JSON.stringify(data, null, 2));

		// Check if we have candidates
		if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
			throw new Error('No candidates in Gemini API response');
		}

		const candidate = data.candidates[0];

		// Check if response was truncated due to token limits
		if (candidate.finishReason === 'MAX_TOKENS') {
			throw new Error('AI response was truncated due to token limits. Please try again or use a shorter prompt.');
		}

		if (!candidate.content || !candidate.content.parts || !Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
			throw new Error('No content parts in Gemini API response');
		}

		const text = candidate.content.parts[0].text;
		if (debug) console.log('Gemini API response text:', text);

		if (!text) {
			throw new Error('No text content in Gemini API response');
		}

		// Remove markdown code block markers if present
		let jsonText = text.trim();
		if (jsonText.startsWith('```json')) {
			jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
		} else if (jsonText.startsWith('```')) {
			jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
		}

		if (debug) console.log('Cleaned JSON text:', jsonText);

		// The text should be JSON, try to parse it
		const parsedResponse = JSON.parse(jsonText);
		if (debug) console.log('Parsed JSON response:', parsedResponse);

		// Validate the expected structure
		if (typeof parsedResponse !== 'object' || parsedResponse === null) {
			throw new Error('Parsed response is not a valid object');
		}

		return {
			title: parsedResponse.title || undefined,
			keywords: Array.isArray(parsedResponse.keywords) ? parsedResponse.keywords : undefined,
			description: parsedResponse.description || undefined
		};

	} catch (error) {
		console.error('Error parsing Gemini API response:', error);
		console.error('Raw response data:', JSON.stringify(data, null, 2));
		const errorMessage = error instanceof Error ? error.message : String(error);
		throw new Error(`Failed to parse AI recommendations: ${errorMessage}`);
	}
}

/**
 * Parse the PaLM API response and extract recommendations
 */
export function parsePaLMResponse(data: any): GeminiRecommendationResponse {
	try {
		let text = data.candidates?.[0]?.content?.parts?.[0]?.text;

		if (!text) {
			text = data.candidates?.[0]?.output;
		}

		if (!text) {
			throw new Error('No response text from AI API');
		}

		const jsonMatch = text.match(/\{[\s\S]*\}/);
		if (!jsonMatch) {
			throw new Error('No JSON found in AI response');
		}

		const parsed = JSON.parse(jsonMatch[0]);

		return {
			title: parsed.title,
			keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
			description: parsed.description
		};
	} catch (error) {
		console.error('Error parsing PaLM API response:', error);
		return {
			error: 'Failed to parse AI recommendations'
		};
	}
}

/**
 * Infer business type from site information
 */
export function inferBusinessType(siteInfo: SiteInfo): string {
	const description = (siteInfo.description || '').toLowerCase();

	if (description.includes('restaurant') || description.includes('food')) return 'restaurant';
	if (description.includes('real estate') || description.includes('property')) return 'real estate';
	if (description.includes('law') || description.includes('legal')) return 'legal services';
	if (description.includes('medical') || description.includes('health')) return 'healthcare';
	if (description.includes('consulting') || description.includes('consultant')) return 'consulting';
	if (description.includes('retail') || description.includes('store')) return 'retail';

	return 'general business';
}
