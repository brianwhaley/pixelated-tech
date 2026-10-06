import { NextResponse } from 'next/server';
import { saveContentfulPage, getFullPixelatedConfig } from '@pixelated-tech/components/server';

/**
 * POST /api/pagebuilder/save
 * Saves a page to Contentful
 *
 * Body:
 * {
 *   name: string;
 *   data: PageData;
 * }
 */
export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { name, data } = body;

		if (!name || !data) {
			return NextResponse.json(
				{
					success: false,
					message: 'Name and data are required'
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

		const result = await saveContentfulPage(name, data, config);
		return NextResponse.json(result);
	} catch (error) {
		return NextResponse.json(
			{
				success: false,
				message: `Invalid request: ${error}`
			},
			{ status: 400 }
		);
	}
}
