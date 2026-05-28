import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchGoogleFonts, getFontOptions, clearGoogleFontsCache } from '../components/integrations/google.fonts.server';
import { generateGoogleFontsUrl, generateGoogleFontsLink } from '../components/integrations/google.fonts';
import { buildUrl } from '../components/foundation/urlbuilder';
import { smartFetch } from '../components/foundation/smartfetch';
import { getFullPixelatedConfig } from '../components/config/config';

vi.mock('../components/foundation/smartfetch', () => ({
	smartFetch: vi.fn()
}));

vi.mock('../components/config/config', () => ({
	getFullPixelatedConfig: vi.fn()
}));

const mockApiKey = 'test-api-key-123';

describe('google-fonts', () => {

	// Section 1: buildUrl for Google Fonts API list fetch
	describe('buildUrl Google Fonts API URL construction', () => {
		it('should construct Google Fonts API URL with api key and sort parameter', () => {
			const url = buildUrl({
				baseUrl: 'https://www.googleapis.com',
				pathSegments: ['webfonts', 'v1', 'webfonts'],
				params: { key: mockApiKey, sort: 'popularity' }
			});

			expect(url).toContain('https://www.googleapis.com/webfonts/v1/webfonts');
			expect(url).toContain(`key=${mockApiKey}`);
			expect(url).toContain('sort=popularity');
		});

		it('should construct correct path segments for Google Fonts endpoint', () => {
			const url = buildUrl({
				baseUrl: 'https://www.googleapis.com',
				pathSegments: ['webfonts', 'v1', 'webfonts'],
				params: { key: 'xyz', sort: 'popularity' }
			});

			expect(url).toMatch(/\/webfonts\/v1\/webfonts\?/);
		});
	});

	// Section 2: buildUrl for Google Fonts CSS import URL construction
	describe('buildUrl Google Fonts CSS URL construction', () => {
		it('should construct CSS URL with single font family', () => {
			const url = buildUrl({
				baseUrl: 'https://fonts.googleapis.com',
				pathSegments: ['css2'],
				params: { family: 'Roboto', display: 'swap' }
			});

			expect(url).toContain('https://fonts.googleapis.com/css2');
			expect(url).toContain('family=Roboto');
			expect(url).toContain('display=swap');
		});

		it('should construct CSS URL with multiple font families (pipe-separated)', () => {
			const fontFamily = 'Roboto|Lato|Poppins';
			const url = buildUrl({
				baseUrl: 'https://fonts.googleapis.com',
				pathSegments: ['css2'],
				params: { family: fontFamily, display: 'swap' }
			});

			expect(url).toContain('https://fonts.googleapis.com/css2');
			// buildUrl properly encodes pipe as %7C
			expect(url).toContain('family=Roboto%7CLato%7CPoppins');
			expect(url).toContain('display=swap');
		});

		it('should construct CSS URL with font families with weight variants', () => {
			const fontFamily = 'Roboto:400;700|Lato:300;400;700';
			const url = buildUrl({
				baseUrl: 'https://fonts.googleapis.com',
				pathSegments: ['css2'],
				params: { family: fontFamily, display: 'swap' }
			});

			expect(url).toContain('https://fonts.googleapis.com/css2');
			expect(url).toContain('family=');
		});
	});

	// Section 3: generateGoogleFontsUrl function tests
	describe('generateGoogleFontsUrl', () => {
		it('should return empty string for empty fonts array', () => {
			const url = generateGoogleFontsUrl([]);
			expect(url).toBe('');
		});

		it('should generate correct URL for Open Sans', () => {
			const url = generateGoogleFontsUrl(['Open Sans']);
			expect(url).toBe('https://fonts.googleapis.com/css2?family=Open+Sans&display=swap');
		});

		it('should support explicit weight parameters', () => {
			const url = generateGoogleFontsUrl(['Cinzel:wght@400..900']);
			expect(url).toBe('https://fonts.googleapis.com/css2?family=Cinzel:wght@400..900&display=swap');
		});

		it('should replace spaces with plus signs in font names', () => {
			const url = generateGoogleFontsUrl(['Playfair Display', 'Libre Baskerville']);
			// Google Fonts expects literal + for spaces
			expect(url).toContain('Playfair+Display');
			expect(url).toContain('Libre+Baskerville');
		});

		it('should join multiple fonts with pipe separator', () => {
			const url = generateGoogleFontsUrl(['Roboto', 'Lato', 'Poppins']);
			// Google Fonts expects literal | separator
			expect(url).toContain('Roboto|Lato|Poppins');
		});

		it('should handle fonts with special characters', () => {
			const url = generateGoogleFontsUrl(['"Roboto"', "'Lato'"]);
			expect(url).toContain('Roboto');
			expect(url).toContain('Lato');
			expect(url).not.toContain('"');
		});

		it('should filter out empty font names', () => {
			const url = generateGoogleFontsUrl(['Roboto', '', '  ', 'Lato']);
			expect(url).not.toBe('');
			expect(url).toContain('Roboto');
			expect(url).toContain('Lato');
		});
	});

	// Section 4: generateGoogleFontsLink function tests
	describe('generateGoogleFontsLink', () => {
		it('should return empty string for empty fonts array', () => {
			const link = generateGoogleFontsLink([]);
			expect(link).toBe('');
		});

		it('should generate HTML link tags for font', () => {
			const link = generateGoogleFontsLink(['Roboto']);
			expect(link).toContain('<link');
			expect(link).toContain('rel="stylesheet"');
			expect(link).toContain('https://fonts.googleapis.com');
			expect(link).toContain('https://fonts.gstatic.com');
		});

		it('should include one link per font family', () => {
			const link = generateGoogleFontsLink(['Roboto', 'Lato']);
			const occurrences = (link.match(/rel="stylesheet"/g) || []).length;
			expect(occurrences).toBe(2);
		});

		it('should construct CSS URL within the link tag', () => {
			const link = generateGoogleFontsLink(['Roboto', 'Lato']);
			expect(link).toContain('family=Roboto');
			expect(link).toContain('family=Lato');
			expect(link).toContain('display=swap');
		});
	});

	describe('fetchGoogleFonts and getFontOptions', () => {
		const mockSmartFetch = vi.mocked(smartFetch);
		const mockConfig = vi.mocked(getFullPixelatedConfig);

		beforeEach(async () => {
			vi.clearAllMocks();
			await clearGoogleFontsCache();
		});

		const createMockGoogleConfig = (apiKey?: string) => ({
			google: {
				client_id: '',
				client_secret: '',
				api_key: apiKey || '',
				refresh_token: ''
			}
		} as any);

		it('should return empty list when api key is missing', async () => {
			mockConfig.mockReturnValue(createMockGoogleConfig());
			const fonts = await fetchGoogleFonts();
			expect(fonts).toEqual([]);
		});

		it('should return empty list when fetch fails', async () => {
			mockConfig.mockReturnValue(createMockGoogleConfig(mockApiKey));
			mockSmartFetch.mockRejectedValueOnce(new Error('API failure'));

			const fonts = await fetchGoogleFonts();
			expect(fonts).toEqual([]);
		});

		it('should fetch fonts when api key is present', async () => {
			mockConfig.mockReturnValue(createMockGoogleConfig(mockApiKey));
			mockSmartFetch.mockResolvedValue({ items: [{ family: 'Roboto', category: 'sans-serif', variants: [], subsets: [], version: '', lastModified: '', kind: '', menu: '', files: {} }] });

			const fonts = await fetchGoogleFonts();
			expect(fonts).toHaveLength(1);
			expect(fonts[0].family).toBe('Roboto');
		});

		it('should return cached fonts on second fetch within cache duration', async () => {
			mockConfig.mockReturnValue(createMockGoogleConfig(mockApiKey));
			vi.resetModules();
			const googleFontsModule = await import('../components/integrations/google.fonts.server');
			mockSmartFetch.mockResolvedValueOnce({ items: [{ family: 'Roboto', category: 'sans-serif', variants: [], subsets: [], version: '', lastModified: '', kind: '', menu: '', files: {} }] });

			const fonts1 = await googleFontsModule.fetchGoogleFonts();
			const fonts2 = await googleFontsModule.fetchGoogleFonts();

			expect(fonts1).toBe(fonts2);
			expect(fonts1).toHaveLength(1);
			expect(mockSmartFetch).toHaveBeenCalledTimes(1);
		});

		it('should return fallback fonts when config retrieval returns no fonts', async () => {
			mockConfig.mockReturnValue(createMockGoogleConfig());
			const options = await getFontOptions();
			expect(options.length).toBeGreaterThan(0);
			expect(options[0]).toHaveProperty('value');
			expect(options[0]).toHaveProperty('label');
		});

		it('should fall back to default fonts when API returns an empty list', async () => {
			mockConfig.mockReturnValue(createMockGoogleConfig(mockApiKey));
			mockSmartFetch.mockResolvedValue({ items: [] });

			const options = await getFontOptions();
			expect(options.length).toBeGreaterThan(0);
			expect(options[0]).toHaveProperty('value');
			expect(options[0]).toHaveProperty('label');
		});

		it('should use fetched fonts for getFontOptions when available', async () => {
			mockConfig.mockReturnValue(createMockGoogleConfig(mockApiKey));
			mockSmartFetch.mockResolvedValue({ items: [{ family: 'Open Sans', category: 'sans-serif', variants: [], subsets: [], version: '', lastModified: '', kind: '', menu: '', files: {} }] });

			const options = await getFontOptions();
			expect(options).toEqual([{ value: 'Open Sans', label: 'Open Sans (sans-serif)', category: 'sans-serif' }]);
		});

		it('should fall back to default fonts when config retrieval throws', async () => {
			mockConfig.mockImplementationOnce(() => { throw new Error('config failure'); });

			const options = await getFontOptions();
			expect(options.length).toBeGreaterThan(0);
			expect(options[0]).toHaveProperty('value');
		});
	});
});
