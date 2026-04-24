import type { NextRequest } from 'next/server';
import { createWellKnownResponse } from '@pixelated-tech/components/server';
import siteConfig from '../../data/siteconfig.json';

export async function GET(req: NextRequest) {
	return createWellKnownResponse('humans', req, { siteConfig });
}
