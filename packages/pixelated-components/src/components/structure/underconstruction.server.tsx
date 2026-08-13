'use server';

import { headers } from 'next/headers';
import { getFullPixelatedConfig } from '../config/config';
import { getOriginFromHeaders } from '../foundation/sitemap';

const debug = true;

export async function isUnderConstruction(): Promise<boolean> {
	let underConstruction = true; 
	const envValue = process.env.UNDER_CONSTRUCTION;
	if (debug) console.log("UNDER_CONSTRUCTION env var=",envValue);
	if (String(envValue || '').trim().toLowerCase() !== 'true') { underConstruction = false; }
	const hdrs = await headers();
	const requestOrigin = getOriginFromHeaders(hdrs as any)?.toLowerCase() || '';
	if (debug) console.log("requestOrigin=",requestOrigin);
	if (!requestOrigin) { return false; }
	if (
		requestOrigin.includes('localhost') ||
		requestOrigin.includes('127.0.0.1') ||
		requestOrigin.includes('amplifyapp.com')
	) {
		underConstruction = false;
	}
	const pixelatedConfig = getFullPixelatedConfig() as any;
	const siteUrl = String(pixelatedConfig?.siteInfo?.url || '').trim();
	if (debug) console.log("siteUrl=", siteUrl);
	if (!siteUrl) { return false; }
	// return requestOrigin.toLowerCase() === siteUrl.toLowerCase();
	if (debug) console.log("underConstruction=",underConstruction);
	return underConstruction;
}
