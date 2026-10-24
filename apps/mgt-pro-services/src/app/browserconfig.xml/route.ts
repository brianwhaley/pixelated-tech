import type { NextRequest } from 'next/server';
import { BrowserConfigXML } from '@pixelated-tech/components/server';

export async function GET(req: NextRequest) {
	return BrowserConfigXML({req});
}
