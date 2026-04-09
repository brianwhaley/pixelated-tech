import { NextResponse } from 'next/server';
import { listContentfulPages, getFullPixelatedConfig } from '@pixelated-tech/components/server';

/**
 * GET /api/pagebuilder/list
 * Lists all saved pages from Contentful
 */
export async function GET() {
	const config = getFullPixelatedConfig()?.contentful;

	if (!config) {
		return NextResponse.json(
			{
				success: false,
				pages: [],
				message: 'Contentful configuration not found'
			},
			{ status: 400 }
		);
	}

	const result = await listContentfulPages(config);
	return NextResponse.json(result);
}
