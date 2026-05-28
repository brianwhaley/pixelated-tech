'use server';

import { getFullPixelatedConfig } from '../config/config';
import { smartFetch } from '../foundation/smartfetch';
import { buildUrl } from '../foundation/urlbuilder';
import { FALLBACK_GOOGLE_FONTS, type GoogleFont, type GoogleFontsResponse } from './google.fonts';

// Cache for Google Fonts data
let fontsCache: GoogleFont[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours



/**
 * Fetches the list of all available Google Fonts from the Google Fonts API.
 * Requires a google.api_key in pixelated.config.json.
 */
export async function fetchGoogleFonts(): Promise<GoogleFont[]> {
	if (fontsCache && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
		return fontsCache;
	}

	let apiKey: string | undefined;
	try {
		const cfg = getFullPixelatedConfig();
		apiKey = cfg?.google?.api_key;
	} catch (error) {
		console.warn('Error retrieving Google Fonts config:', error);
		return [];
	}

	if (!apiKey) {
		console.warn('google.api_key not set in pixelated.config.json; returning empty fonts list');
		return [];
	}

	try {
		const url = buildUrl({
			baseUrl: 'https://www.googleapis.com',
			pathSegments: ['webfonts', 'v1', 'webfonts'],
			params: { key: apiKey, sort: 'popularity' }
		});

		const data: GoogleFontsResponse = await smartFetch(url);
		fontsCache = data.items;
		cacheTimestamp = Date.now();
		return data.items;
	} catch (error) {
		console.error('Failed to fetch Google Fonts:', error);
		return [];
	}
}



/**
 * Clears the server-side cache of Google Fonts.
 */
export async function clearGoogleFontsCache() {
	fontsCache = null;
	cacheTimestamp = 0;
}




/**
 * Returns a list of font options formatted for UI usage (e.g. selectors).
 * Falls back to a predefined list if the API fetch fails or is not configured.
 */
export async function getFontOptions(): Promise<Array<{value: string, label: string, category: string}>> {
	let fonts = await fetchGoogleFonts();
	
	if (!fonts || fonts.length === 0) {
		fonts = FALLBACK_GOOGLE_FONTS;
	}

	return fonts
		.sort((a: GoogleFont, b: GoogleFont) => a.family.localeCompare(b.family))
		.map((font: GoogleFont) => ({
			value: font.family,
			label: `${font.family} (${font.category})`,
			category: font.category
		}));
}
