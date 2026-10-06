import { NextResponse } from 'next/server';
import { deleteContentfulPage, getFullPixelatedConfig } from '@pixelated-tech/components/server';

/**
 * DELETE /api/pagebuilder/delete?name={pageName}
 * Deletes a page from Contentful
 */
export async function DELETE(request: Request) {
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

	const result = await deleteContentfulPage(name, config);
	return NextResponse.json(result);
}
