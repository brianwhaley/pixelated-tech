import { NextResponse } from 'next/server';
import { loadContentfulPage, getFullPixelatedConfig } from '@pixelated-tech/components/server';

/**
 * GET /api/pagebuilder/load?name={pageName}
 * Loads a specific page from Contentful
 */
export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const name = searchParams.get('name');

	if (!name) {
		return NextResponse.json(
			{
				success: false,
				message: 'Page name is required'
			},
			{ status: 400 }
		);
	}

	const config = getFullPixelatedConfig()?.contentful;

	if (!config) {
		return NextResponse.json(
			{
				success: false,
				message: 'Contentful configuration not found'
			},
			{ status: 400 }
		);
	}

	const result = await loadContentfulPage(name, config);
	return NextResponse.json(result);
}
