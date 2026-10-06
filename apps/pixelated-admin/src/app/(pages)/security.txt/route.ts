import type { NextRequest } from 'next/server';
import { createWellKnownResponse, getFullPixelatedConfig } from '@pixelated-tech/components/server';

export async function GET(req: NextRequest) {
	const pixelatedConfig = getFullPixelatedConfig() || {};
	return createWellKnownResponse('security', req, { siteConfig: pixelatedConfig });
}
