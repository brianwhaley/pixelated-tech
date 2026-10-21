export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { generateSiteMapRss } from '@pixelated-tech/components/server';

export async function GET(_req: NextRequest) {
	const rss = await generateSiteMapRss();
	return new NextResponse(rss, {
		headers: { 'Content-Type': 'application/xml; charset=utf-8' },
	});
}
