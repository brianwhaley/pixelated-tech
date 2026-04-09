import { generateAiRecommendations, GeminiRecommendationRequest, GeminiRecommendationResponse, getFullPixelatedConfig } from '@pixelated-tech/components/server';

export async function POST(request: Request): Promise<Response> {
	try {
		const body: GeminiRecommendationRequest = await request.json();
		const config = getFullPixelatedConfig();
		// Try multiple possible key locations
		const apiKey = config?.google?.api_key;

		if (!apiKey) {
			return Response.json(
				{
					success: false,
					error: 'Google Gemini API key not configured'
				},
				{ status: 500 }
			);
		}

		const result = await generateAiRecommendations(body, apiKey);
		
		// Check if there was an error in the result
		if (result.error) {
			return Response.json({
				success: false,
				error: result.error
			});
		}

		return Response.json({
			success: true,
			data: result
		});
	} catch (error) {
		console.error('AI recommendations API error:', error);
		return Response.json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error occurred'
			} as GeminiRecommendationResponse,
			{ status: 500 }
		);
	}
}
