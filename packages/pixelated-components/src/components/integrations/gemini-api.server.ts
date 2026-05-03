import type { RouteType, SiteInfoType } from '../config/siteconfig.types';
import { smartFetch } from '../foundation/smartfetch';
import { buildUrl } from '../foundation/urlbuilder';
import { getFullPixelatedConfig } from '../config/config';
import { parseGeminiResponse, type GeminiRecommendationRequest, type GeminiRecommendationResponse } from './gemini-api.functions';

// Debug logging: set to true to inspect raw Gemini API responses locally
const debug = false;




function buildRecommendationPrompt(request: GeminiRecommendationRequest): string {
	const { route, siteInfo } = request;

	// Extract location information
	const address = siteInfo.address;
	const locationInfo = address 
		? `${address.addressLocality || ''}, ${address.addressRegion || ''} ${address.postalCode || ''}`.trim() 
		: '';

	if (debug) {
		console.log('AI Recommendations - Location Info:', {
			businessName: siteInfo.name,
			address: address,
			builtLocationInfo: locationInfo
		});
	}

	return `Generate SEO recommendations for this specific page for this specific business in this specific location as JSON:

Business: ${siteInfo.name || 'Unknown'} - ${siteInfo.description || 'Not provided'}
${locationInfo ? `Location (use ONLY this location, not any other cities): ${locationInfo}` : ''}
Route: ${route.name || route.path || '/'}
Current: Title="${route.title || ''}", Keywords="${Array.isArray(route.keywords) ? route.keywords.join(', ') : route.keywords || ''}", Description="${route.description || ''}"

IMPORTANT: Use ONLY the location specified above. Do NOT substitute or use any other nearby cities or locations you might know about.

Return only this JSON:
{
  "title": "50-60 char optimized title using business name and provided location only",
  "keywords": ["relevant", "keywords", "for", "this", "page", "including", "provided", "location-based", "terms"],
  "description": "150-160 char meta description including the business name and provided location only"
}`;
}

/**
 * Generate AI recommendations for SEO using Google Gemini API
 */
export async function generateAiRecommendations(
	request: GeminiRecommendationRequest,
	apiKey?: string
): Promise<GeminiRecommendationResponse> {
	try {
		// Use provided API key or get from config
		const finalApiKey = apiKey || getFullPixelatedConfig()?.googleGemini?.api_key;
		if (!finalApiKey) {
			throw new Error('Google Gemini API key not configured');
		}

		// Build the prompt using the shared function
		const prompt = buildRecommendationPrompt(request);

		// Make request to Google Gemini API using buildUrl for consistent URL construction
		// smartFetch returns parsed data directly and throws on errors
		const url = buildUrl({
			baseUrl: 'https://generativelanguage.googleapis.com',
			pathSegments: ['v1beta', 'models', 'gemini-2.5-flash:generateContent'],
			params: { key: finalApiKey },
		});
		const response = await smartFetch(url, {
			requestInit: {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					contents: [{
						parts: [{
							text: prompt
						}]
					}],
					generationConfig: {
						temperature: 0.7,
						maxOutputTokens: 4096,
						topP: 0.95,
						topK: 40
					}
				})
			}
		});

		// smartFetch returns parsed data directly, so response is already the JSON data
		// Parse the Gemini API response
		return parseGeminiResponse(response);

	} catch (error) {
		console.error('AI API error:', error);
		return {
			error: error instanceof Error ? error.message : 'Unknown error occurred'
		};
	}
}
