'use server';

import { headers } from 'next/headers';
// import { getFullPixelatedConfig } from '../config/config';
import { getOriginFromHeaders } from '../foundation/sitemap';

export async function isUnderConstruction(): Promise<boolean> {
	let underConstruction = true; 
	const envValue = process.env.UNDER_CONSTRUCTION;
	if (String(envValue || '').trim().toLowerCase() !== 'true') { underConstruction = false; }
	const hdrs = await headers();
	const requestOrigin = getOriginFromHeaders(hdrs as any)?.toLowerCase() || '';
	if (!requestOrigin) { return false; }
	if (
		requestOrigin.includes('localhost') ||
		requestOrigin.includes('127.0.0.1') ||
		requestOrigin.includes('amplifyapp.com')
	) {
		underConstruction = false;
	}
	/* const pixelatedConfig = getFullPixelatedConfig() as any;
	const siteUrl = String(pixelatedConfig?.siteInfo?.url || '').trim();
	if (!siteUrl) { return false; }
	if (requestOrigin.toLowerCase() !== siteUrl.toLowerCase()) { underConstruction = false; } */
	return underConstruction;
}
