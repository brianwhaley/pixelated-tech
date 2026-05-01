'use client';

import { buildUrl } from '../../foundation/urlbuilder';

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

export async function getFontOptions(): Promise<Array<{ value: string; label: string; category: string }>> {
	return FALLBACK_GOOGLE_FONTS
		.sort((a: GoogleFont, b: GoogleFont) => a.family.localeCompare(b.family))
		.map((font: GoogleFont) => ({
			value: font.family,
			label: `${font.family} (${font.category})`,
			category: font.category,
		}));
}

export function generateGoogleFontsUrl(fonts: string[]): string {
	if (!fonts.length) return '';

	const cleanFonts = fonts
		.map(font => font.replace(/['"]/g, '').trim())
		.filter(font => font.length > 0);

	if (!cleanFonts.length) return '';

	const fontParam = cleanFonts
		.map(font => font.replace(/\s+/g, '+'))
		.join('|');

	return buildUrl({
		baseUrl: 'https://fonts.googleapis.com',
		pathSegments: ['css2'],
		params: { family: fontParam, display: 'swap' }
	});
}

export function generateGoogleFontsLink(fonts: string[]): string {
	const url = generateGoogleFontsUrl(fonts);
	if (!url) return '';

	return `<link rel="preconnect" fetchPriority="high" href="https://fonts.googleapis.com">
<link rel="preconnect" fetchPriority="high" href="https://fonts.gstatic.com" crossOrigin="anonymous">
<link rel="stylesheet" fetchPriority="high" href="${url}">`;
}
