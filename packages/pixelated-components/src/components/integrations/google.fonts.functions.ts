import { ALL_WEBSAFE_FONTS } from '../sitebuilder/config/fonts';

export interface GoogleFont {
  family: string;
  variants: string[];
  subsets: string[];
  version: string;
  lastModified: string;
  category: string;
  kind: string;
  menu: string;
  files: Record<string, string>;
}

export interface GoogleFontsResponse {
  kind: string;
  items: GoogleFont[];
}

export const FALLBACK_GOOGLE_FONTS: GoogleFont[] = [
	{ family: 'Cairo', category: 'sans-serif', variants: [], subsets: [], version: '', lastModified: '', kind: '', menu: '', files: {} },
	{ family: 'Crimson Text', category: 'serif', variants: [], subsets: [], version: '', lastModified: '', kind: '', menu: '', files: {} },
	{ family: 'Fira Sans', category: 'sans-serif', variants: [], subsets: [], version: '', lastModified: '', kind: '', menu: '', files: {} },
	{ family: 'Inter', category: 'sans-serif', variants: [], subsets: [], version: '', lastModified: '', kind: '', menu: '', files: {} },
	{ family: 'Lato', category: 'sans-serif', variants: [], subsets: [], version: '', lastModified: '', kind: '', menu: '', files: {} },
	{ family: 'Libre Baskerville', category: 'serif', variants: [], subsets: [], version: '', lastModified: '', kind: '', menu: '', files: {} },
	{ family: 'Lora', category: 'serif', variants: [], subsets: [], version: '', lastModified: '', kind: '', menu: '', files: {} },
	{ family: 'Merriweather', category: 'serif', variants: [], subsets: [], version: '', lastModified: '', kind: '', menu: '', files: {} },
	{ family: 'Montserrat', category: 'sans-serif', variants: [], subsets: [], version: '', lastModified: '', kind: '', menu: '', files: {} },
	{ family: 'Nunito', category: 'sans-serif', variants: [], subsets: [], version: '', lastModified: '', kind: '', menu: '', files: {} },
	{ family: 'Open Sans', category: 'sans-serif', variants: [], subsets: [], version: '', lastModified: '', kind: '', menu: '', files: {} },
	{ family: 'Oswald', category: 'sans-serif', variants: [], subsets: [], version: '', lastModified: '', kind: '', menu: '', files: {} },
	{ family: 'Playfair Display', category: 'serif', variants: [], subsets: [], version: '', lastModified: '', kind: '', menu: '', files: {} },
	{ family: 'Poppins', category: 'sans-serif', variants: [], subsets: [], version: '', lastModified: '', kind: '', menu: '', files: {} },
	{ family: 'PT Sans', category: 'sans-serif', variants: [], subsets: [], version: '', lastModified: '', kind: '', menu: '', files: {} },
	{ family: 'Raleway', category: 'sans-serif', variants: [], subsets: [], version: '', lastModified: '', kind: '', menu: '', files: {} },
	{ family: 'Roboto', category: 'sans-serif', variants: [], subsets: [], version: '', lastModified: '', kind: '', menu: '', files: {} },
	{ family: 'Source Sans Pro', category: 'sans-serif', variants: [], subsets: [], version: '', lastModified: '', kind: '', menu: '', files: {} },
	{ family: 'Ubuntu', category: 'sans-serif', variants: [], subsets: [], version: '', lastModified: '', kind: '', menu: '', files: {} },
	{ family: 'Work Sans', category: 'sans-serif', variants: [], subsets: [], version: '', lastModified: '', kind: '', menu: '', files: {} },
];

/**
 * Returns a list of font options from the fallback list, formatted for UI usage.
 */
export function getFontOptionsClient(): Array<{ value: string; label: string; category: string }> {
	return FALLBACK_GOOGLE_FONTS
		.sort((a: GoogleFont, b: GoogleFont) => a.family.localeCompare(b.family))
		.map((font: GoogleFont) => ({
			value: font.family,
			label: `${font.family} (${font.category})`,
			category: font.category,
		}));
}

export function encodeFontFamily(family: string): string {
	const clean = family.replace(/['"]/g, '').trim();
	if (clean.includes(':')) {
		const [name, params] = clean.split(':');
		return `${name.trim().replace(/\s+/g, '+')}:${params}`;
	}
	return clean.replace(/\s+/g, '+');
}

/**
 * Extracts Google Font families and their parameters from visualdesign configuration.
 * Prioritizes tokens with explicit import_family fields.
 */
export function extractGoogleFonts(visualdesign: Record<string, any>): string[] {
	const found: string[] = [];
	const tokens = Object.entries(visualdesign);

	for (const [key, token] of tokens) {
		const isObject = typeof token === 'object' && token !== null;

		if (isObject && token.import_family) {
			const family = token.import_family;
			const families = Array.isArray(family) ? family : [family];
			for (const f of families) {
				const clean = f.replace(/['"]/g, '').trim();
				found.push(token.import_params ? `${clean}:${token.import_params}` : clean);
			}
			continue;
		}

		const isFontKey = key === 'header-font' || key === 'body-font' || key.endsWith('-font') || key.endsWith('-primary');
		if (isFontKey) {
			const value = isObject ? token.value : token;
			if (typeof value === 'string' && value.length > 0) {
				const firstFont = value.split(',')[0].trim().replace(/['"]/g, '');
				if (firstFont && !ALL_WEBSAFE_FONTS.some(f => f.value === firstFont)) {
					const params = isObject ? token.import_params : null;
					found.push(params ? `${firstFont}:${params}` : firstFont);
				}
			}
		}
	}

	return [...new Set(found)];
}

/**
 * Returns the URL for Google Fonts.
 * Note: Consolidates multiple fonts into one URL using the pipe separator.
 */
export function generateGoogleFontsUrl(fonts: string[]): string {
	if (!fonts.length) return '';

	const fontParams = [...new Set(fonts)]
		.filter(f => f.trim().length > 0)
		.map(encodeFontFamily)
		.join('|');

	return `https://fonts.googleapis.com/css2?family=${fontParams}&display=swap`;
}

/**
 * Returns a string containing the HTML link tags for Google Fonts.
 * Useful for non-React contexts or raw HTML generation.
 * Generates one <link> tag per font as recommended for maximum compatibility.
 */
export function generateGoogleFontsLink(fonts: string[]): string {
	const families = [...new Set(fonts.filter(f => f.trim().length > 0))];
	if (!families.length) return '';

	const links = families.map(family => {
		const url = `https://fonts.googleapis.com/css2?family=${encodeFontFamily(family)}&display=swap`;
		return `<link href="${url}" rel="stylesheet">`;
	});

	return [
		'<link rel="preconnect" href="https://fonts.googleapis.com">',
		'<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
		...links
	].join('\n');
}
