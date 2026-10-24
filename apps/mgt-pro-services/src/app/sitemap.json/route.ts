export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { generateSitemapJson } from '@pixelated-tech/components/server';

export async function GET(_req: NextRequest) {
	const sitemapJson = await generateSitemapJson();
	return NextResponse.json(sitemapJson, {
		status: 200,
	});
}
