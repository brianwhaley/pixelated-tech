import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as sitemapModule from '../components/foundation/sitemap';
import {
	createPageURLs,
	createImageURLsFromJSON,
	createSiteConfigURLs,
	createWordPressURLs,
	createContentfulURLs,
	createContentfulAssetURLs,
	createEbayItemURLs,
	createSquareItemURLs,
	generateSitemap,
	buildSitemapConfig,
	clearEbaySitemapCache,
	clearSquareSitemapCache,
	getOriginFromHeaders,
	getRuntimeEnvFromHeaders,
	getOriginFromNextHeaders,
	jsonToSitemapEntries,
	createContentfulPageBuilderURLs,
	type SitemapEntry
} from '../components/foundation/sitemap';

// Mock external dependencies
vi.mock('../components/integrations/wordpress.functions');
vi.mock('../components/integrations/contentful.delivery', async () => {
	const actual = await vi.importActual<typeof import('../components/integrations/contentful.delivery')>('../components/integrations/contentful.delivery');
	return {
		...actual,
		callContentfulDeliveryAPI: vi.fn(),
		getContentfulEntries: vi.fn(),
		getContentfulEntriesByType: vi.fn(),
		getContentfulContentType: vi.fn(),
		getContentfulEntryByEntryID: vi.fn(),
		getContentfulEntryByField: vi.fn(),
		getContentfulFieldValues: vi.fn(),
		getContentfulImagesFromEntries: vi.fn(),
		getContentfulAssets: vi.fn(),
		getContentfulAssetURLs: vi.fn(),
		getContentfulDiscountCodes: vi.fn(),
		getContentfulReviewsSchema: vi.fn(),
		getContentfulProductSchema: vi.fn(),
	};
});
vi.mock('../components/shoppingcart/ebay.functions');
vi.mock('../components/shoppingcart/square.server');
vi.mock('../components/config/config');
vi.mock('../components/foundation/metadata.functions');
vi.mock('next/headers', () => ({ headers: vi.fn() }));
// Import mocked modules
import * as wordpressModule from '../components/integrations/wordpress.functions';
import * as contentfulModule from '../components/integrations/contentful.delivery';
import * as ebayModule from '../components/shoppingcart/ebay.functions';
import * as configModule from '../components/config/config';
import * as metadataModule from '../components/foundation/metadata.functions';
import * as squareModule from '../components/shoppingcart/square.server';
import { realWordPressApiData, siteImagesData, realContentfulAssetsData, mockContentfulImageAssets } from '../test/test-data';

// Mock fetch globally
global.fetch = vi.fn();

function normalizeWordPressPosts(posts: Array<Record<string, unknown>>): wordpressModule.BlogPostType[] {
	return posts.map((post) => ({
		...post,
		ID: typeof post.ID === 'string' ? post.ID : String(post.ID),
	})) as wordpressModule.BlogPostType[];
}

describe('Sitemap Helper Functions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// console.error = vi.fn();
		// console.log = vi.fn();
		// console.warn = vi.fn();
		clearEbaySitemapCache();
		clearSquareSitemapCache();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('createPageURLs', () => {
		it('should create sitemap entries for routes', async () => {
			const mockRoutes = [
				{ path: '/home' },
				{ path: '/about' },
				{ path: '/contact' }
			];

			const mockGetAllRoutes = vi.mocked(metadataModule.getAllRoutes);
			mockGetAllRoutes.mockReturnValue(mockRoutes);

			const origin = 'https://example.com';
			const result = await createPageURLs(mockRoutes, origin);

			expect(result).toHaveLength(3);
			expect(result[0]).toMatchObject({
				url: 'https://example.com/home',
				changeFrequency: 'hourly',
				priority: 1,
			});
			expect(result[0].lastModified).toBeInstanceOf(Date);
		});

		it('should skip external URLs', async () => {
			const mockRoutes = [
				{ path: '/home' },
				{ path: 'https://external.com/page' },
				{ path: '/about' }
			];

			const mockGetAllRoutes = vi.mocked(metadataModule.getAllRoutes);
			mockGetAllRoutes.mockReturnValue(mockRoutes);

			const origin = 'https://example.com';
			const result = await createPageURLs(mockRoutes, origin);

			expect(result).toHaveLength(2);
			expect(result.every((entry: SitemapEntry) => !entry.url.includes('external.com'))).toBe(true);
		});

		it('should handle empty routes array', async () => {
			const mockGetAllRoutes = vi.mocked(metadataModule.getAllRoutes);
			mockGetAllRoutes.mockReturnValue([]);

			const origin = 'https://example.com';
			const result = await createPageURLs([], origin);

			expect(result).toEqual([]);
		});
	});

	describe('createSiteConfigURLs', () => {
		it('should create sitemap entries for services and service areas from site config', async () => {
			const origin = 'https://example.com';
			const siteConfig = {
				siteInfo: {
					services: [
						{ name: 'Epoxy Floors', url: '/services/epoxy-floors' },
					],
					serviceAreas: [
						{ name: 'Coastal Area', path: '/service-areas/coastal-area' },
					],
				},
			};

			const result = await createSiteConfigURLs(siteConfig, origin);

			expect(result).toHaveLength(2);
			expect(result.map((entry) => entry.url)).toEqual([
				'https://example.com/services/epoxy-floors',
				'https://example.com/service-areas/coastal-area',
			]);
		});

		it('should create sitemap entry for root-level service when servicesPathPrefix is blank', async () => {
			const origin = 'https://example.com';
			const siteConfig = {
				siteInfo: {
					servicesPathPrefix: '',
					services: [
						{ name: 'Epoxy Floors' },
					],
					serviceAreas: [],
				},
			};

			const result = await createSiteConfigURLs(siteConfig, origin);

			expect(result).toHaveLength(1);
			expect(result[0].url).toBe('https://example.com/epoxy-floors');
		});

		it('should use siteInfo.servicesPathPrefix for generated service URLs', async () => {
			const origin = 'https://example.com';
			const siteConfig = {
				siteInfo: {
					servicesPathPrefix: '/offerings',
					services: [
						{ name: 'Epoxy Floors' },
					],
					serviceAreas: [],
				},
			};

			const result = await createSiteConfigURLs(siteConfig, origin);

			expect(result).toHaveLength(1);
			expect(result[0].url).toBe('https://example.com/offerings/epoxy-floors');
		});
	});

	describe('getOriginFromHeaders', () => {
		it('should build origin from valid headers', () => {
			const headers = {
				get: (key: string) => key === 'x-forwarded-proto' ? 'https' : 'example.com'
			};

			expect(getOriginFromHeaders(headers as any)).toBe('https://example.com');
		});

		it('should return undefined when headers throw', () => {
			const headers = {
				get: () => { throw new Error('bad headers'); }
			};

			expect(getOriginFromHeaders(headers as any)).toBeUndefined();
		});
	});

	describe('getRuntimeEnvFromHeaders', () => {
		it('should return local for localhost origins', () => {
			const headers = {
				get: (key: string) => {
					if (key === 'host') return 'localhost:3000';
					if (key === 'x-forwarded-proto') return 'https';
					return undefined;
				}
			};

			expect(getRuntimeEnvFromHeaders(headers as any)).toBe('local');
		});

		it('should return prod for remote origins', () => {
			const headers = {
				get: (key: string) => key === 'host' ? 'example.com' : 'https'
			};

			expect(getRuntimeEnvFromHeaders(headers as any)).toBe('prod');
		});

		it('should return auto when origin cannot be determined', () => {
			expect(getRuntimeEnvFromHeaders(undefined)).toBe('auto');
		});
	});

	describe('getOriginFromNextHeaders', () => {
		it('should return undefined when next headers are unavailable', async () => {
			const nextHeadersModule = await import('next/headers');
			vi.mocked(nextHeadersModule.headers).mockRejectedValue(new Error('not available'));

			const origin = await getOriginFromNextHeaders();
			expect(origin).toBeUndefined();
		});

		it('should return origin from next headers when available', async () => {
			const nextHeadersModule = await import('next/headers');
			vi.mocked(nextHeadersModule.headers).mockResolvedValue(
				new Headers([
					['x-forwarded-proto', 'https'],
					['host', 'example.com']
				])
			);

			const origin = await getOriginFromNextHeaders();
			expect(origin).toBe('https://example.com');
		});
	});

	describe('jsonToSitemapEntries', () => {
		it('should serialize sitemap entries to XML fragments', () => {
			const entries: SitemapEntry[] = [
				{
					url: 'https://example.com/test',
					lastModified: '2024-01-01',
					changeFrequency: 'daily',
					priority: 0.5,
				}
			];

			const result = jsonToSitemapEntries(entries);

			expect(result).toContain('<loc>https://example.com/test</loc>');
			expect(result).toContain('<changefreq>daily</changefreq>');
			expect(result).toContain('<priority>0.5</priority>');
		});
	});

	describe('createImageURLsFromJSON', () => {
		it('should create sitemap entry with images from JSON array', async () => {
			const mockJson = siteImagesData.images.slice(0, 2);
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockJson
			});

			const origin = 'https://example.com';
			const result = await createImageURLsFromJSON(origin, 'public/site-images.json');

			expect(result).toHaveLength(1);
			expect(result[0]).toMatchObject({
				url: 'https://example.com/images',
				images: [
					'https://example.com/images/brianwhaley-headshot.jpg',
					'https://example.com/images/icons/1x1.png'
				]
			});
		});

		it('should handle JSON object with images property', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => siteImagesData
			});

			const origin = 'https://example.com';
			const result = await createImageURLsFromJSON(origin, 'public/site-images.json');

			expect(result).toHaveLength(1);
			expect(result[0].images).toHaveLength(siteImagesData.images.length);
		});

		it('should handle fetch errors gracefully', async () => {
			(global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

			const origin = 'https://example.com';
			const result = await createImageURLsFromJSON(origin, 'public/site-images.json');

			expect(result).toEqual([]);
		});

		it('should handle non-OK responses', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				status: 404
			});

			const origin = 'https://example.com';
			const result = await createImageURLsFromJSON(origin, 'public/site-images.json');

			expect(result).toEqual([]);
		});

		it('should handle invalid JSON structure', async () => {
			const mockJson = { invalid: 'structure' };
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockJson
			});

			const origin = 'https://example.com';
			const result = await createImageURLsFromJSON(origin, 'public/site-images.json');

			expect(result).toEqual([]);
		});

		it('should escape ampersands in JSON image URLs', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ['images/gallery.jpg?size=large&format=webp']
			});

			const origin = 'https://example.com';
			const result = await createImageURLsFromJSON(origin, 'public/site-images.json');

			expect(result[0].images![0]).toBe('https://example.com/images/gallery.jpg?size=large&amp;format=webp');
		});
	});

	describe('createWordPressURLs', () => {
		it('should create sitemap entries for WordPress posts', async () => {
			const mockPosts = normalizeWordPressPosts(realWordPressApiData.posts.slice(0, 2));

			const mockGetWordPressItems = vi.mocked(wordpressModule.getWordPressItems);
			mockGetWordPressItems.mockResolvedValue(mockPosts);

			const result = await createWordPressURLs({ site: 'example.wordpress.com' });

			expect(result).toHaveLength(2);
			expect(result[0]).toMatchObject({
				url: mockPosts[0].URL,
				changeFrequency: 'hourly',
				priority: 1,
			});
			expect(result[0].lastModified).toBeInstanceOf(Date);
		});

		it('should include images when includeImages is true', async () => {
			const mockPosts = normalizeWordPressPosts([realWordPressApiData.posts[0]]);
			const mockImages = [
				{ url: 'https://blog.example.com/image1.jpg' },
				{ url: 'https://blog.example.com/image2.jpg' }
			];

			const mockGetWordPressItems = vi.mocked(wordpressModule.getWordPressItems);
			const mockGetWordPressItemImages = vi.mocked(wordpressModule.getWordPressItemImages);

			mockGetWordPressItems.mockResolvedValue(mockPosts);
			mockGetWordPressItemImages.mockReturnValue(mockImages);

			const result = await createWordPressURLs({
				site: 'example.wordpress.com',
				includeImages: true
			});

			expect(result[0].images).toEqual(['https://blog.example.com/image1.jpg', 'https://blog.example.com/image2.jpg']);
		});

		it('should escape ampersands in WordPress image URLs', async () => {
			const mockPosts = normalizeWordPressPosts([realWordPressApiData.posts[0]]);
			const mockImages = [
				{ url: 'https://blog.example.com/image1.jpg?w=1200&h=800' }
			];

			const mockGetWordPressItems = vi.mocked(wordpressModule.getWordPressItems);
			const mockGetWordPressItemImages = vi.mocked(wordpressModule.getWordPressItemImages);

			mockGetWordPressItems.mockResolvedValue(mockPosts);
			mockGetWordPressItemImages.mockReturnValue(mockImages);

			const result = await createWordPressURLs({
				site: 'example.wordpress.com',
				includeImages: true
			});

			expect(result[0].images).toEqual(['https://blog.example.com/image1.jpg?w=1200&amp;h=800']);
		});

		it('should handle posts without modified date', async () => {
			const mockPost = { ...normalizeWordPressPosts([realWordPressApiData.posts[0]])[0], modified: undefined } as wordpressModule.BlogPostType;
			const mockGetWordPressItems = vi.mocked(wordpressModule.getWordPressItems);
			mockGetWordPressItems.mockResolvedValue([mockPost]);

			const result = await createWordPressURLs({ site: 'example.wordpress.com' });

			expect(result[0].lastModified).toBeInstanceOf(Date);
		});

		it('should handle empty posts array', async () => {
			const mockGetWordPressItems = vi.mocked(wordpressModule.getWordPressItems);
			mockGetWordPressItems.mockResolvedValue([]);

			const result = await createWordPressURLs({ site: 'example.wordpress.com' });

			expect(result).toEqual([]);
		});
	});

	describe('createContentfulURLs', () => {
		it('should create sitemap entries for Contentful entries', async () => {
			const mockEntries = {
				items: [
					{ fields: { title: 'Project One' } },
					{ fields: { title: 'Project Two' } }
				],
				includes: { Asset: [] }
			};

			const mockGetContentfulEntriesByType = vi.mocked(contentfulModule.getContentfulEntriesByType);
			mockGetContentfulEntriesByType.mockResolvedValue(mockEntries as any);

			const mockGetFullPixelatedConfig = vi.mocked(configModule.getFullPixelatedConfig);
			mockGetFullPixelatedConfig.mockReturnValue({});

			const result = await createContentfulURLs({
				apiProps: {
					base_url: 'https://cdn.contentful.com',
					space_id: 'test-space',
					environment: 'master',
					delivery_access_token: 'test-token',
					sitemapContentType: 'carouselCard',
					sitemapField: 'title',
					sitemapRoutePrefix: '/projects'
				},
				origin: 'https://example.com'
			});

			expect(result).toHaveLength(2);
			expect(result[0]).toMatchObject({
				url: 'https://example.com/projects/project-one',
				changeFrequency: 'hourly',
				priority: 1,
			});
			expect(result[0].lastModified).toBeInstanceOf(Date);
		});

		it('should merge provider config with apiProps', async () => {
			const mockEntries = {
				items: [
					{ fields: { title: 'Project One' } }
				],
				includes: { Asset: [] }
			};

			const mockGetContentfulEntriesByType = vi.mocked(contentfulModule.getContentfulEntriesByType);
			mockGetContentfulEntriesByType.mockResolvedValue(mockEntries as any);

			const mockGetFullPixelatedConfig = vi.mocked(configModule.getFullPixelatedConfig);
			mockGetFullPixelatedConfig.mockReturnValue({
				integrations: {
					contentful: {
						base_url: 'https://cdn.contentful.com',
						space_id: 'provider-space',
						environment: 'master',
						delivery_access_token: 'provider-token'
					}
				}
			});

			await createContentfulURLs({
				apiProps: {
					base_url: 'https://cdn.contentful.com',
					space_id: 'custom-space',
					environment: 'master',
					delivery_access_token: 'custom-token',
					sitemapContentType: 'carouselCard',
					sitemapField: 'title',
					sitemapRoutePrefix: '/projects'
				},
				origin: 'https://example.com'
			});

			expect(mockGetContentfulEntriesByType).toHaveBeenCalledWith({
				apiProps: expect.objectContaining({
					space_id: 'provider-space',
					base_url: 'https://cdn.contentful.com',
					environment: 'master',
					delivery_access_token: 'provider-token'
				}),
				contentType: 'carouselCard'
			});
		});

		it('should support a custom sitemap routePrefix', async () => {
			const mockEntries = {
				items: [
					{ fields: { id: 'event-1' } }
				],
				includes: { Asset: [] }
			};

			const mockGetContentfulEntriesByType = vi.mocked(contentfulModule.getContentfulEntriesByType);
			mockGetContentfulEntriesByType.mockResolvedValue(mockEntries as any);

			const result = await createContentfulURLs({
				apiProps: {
					base_url: 'https://cdn.contentful.com',
					space_id: 'test-space',
					environment: 'master',
					delivery_access_token: 'test-token',
					sitemapContentType: 'event',
					sitemapField: 'id',
					sitemapRoutePrefix: '/events'
				},
				origin: 'https://example.com'
			});

			expect(result).toHaveLength(1);
			expect(result[0].url).toBe('https://example.com/events/event-1');
		});

		it('should include images from contentful entry image references', async () => {
			const mockEntries = {
				items: [
					{
						fields: {
							title: 'Project One',
							images: [{ sys: { id: 'img-1' } }]
						}
					}
				],
				includes: {
					Asset: [
						{ sys: { id: 'img-1' }, fields: { file: { url: '//images.ctfassets.net/sample.jpg' }, description: 'Project image' } }
					]
				}
			};

			const mockGetContentfulEntriesByType = vi.mocked(contentfulModule.getContentfulEntriesByType);
			mockGetContentfulEntriesByType.mockResolvedValue(mockEntries as any);

			const mockGetContentfulImagesFromEntries = vi.mocked(contentfulModule.getContentfulImagesFromEntries);
			mockGetContentfulImagesFromEntries.mockResolvedValue([{ image: 'https://images.ctfassets.net/sample.jpg?fm=webp&q=50', imageAlt: 'Project image' }]);

			const mockGetFullPixelatedConfig = vi.mocked(configModule.getFullPixelatedConfig);
			mockGetFullPixelatedConfig.mockReturnValue({});

			const result = await createContentfulURLs({
				apiProps: {
					base_url: 'https://cdn.contentful.com',
					space_id: 'test-space',
					environment: 'master',
					delivery_access_token: 'test-token',
					sitemapContentType: 'carouselCard',
					sitemapField: 'title',
					sitemapRoutePrefix: '/projects'
				},
				origin: 'https://example.com'
			});

			expect(mockGetContentfulImagesFromEntries).toHaveBeenCalledWith({
				images: mockEntries.items[0].fields.images,
				assets: mockEntries.includes.Asset
			});
			expect(result[0].images).toEqual(['https://images.ctfassets.net/sample.jpg?fm=webp&amp;q=50']);
		});

		it('should escape ampersands in Contentful image URLs', async () => {
			const mockEntries = {
				items: [
					{
						fields: {
							title: 'Project Two',
							images: [{ sys: { id: 'img-2' } }]
						}
					}
				],
				includes: {
					Asset: [
						{ sys: { id: 'img-2' }, fields: { file: { url: '//images.ctfassets.net/sample.jpg?fm=webp&q=50' }, description: 'Project image' } }
					]
				}
			};

			const mockGetContentfulEntriesByType = vi.mocked(contentfulModule.getContentfulEntriesByType);
			mockGetContentfulEntriesByType.mockResolvedValue(mockEntries as any);

			const mockGetContentfulImagesFromEntries = vi.mocked(contentfulModule.getContentfulImagesFromEntries);
			mockGetContentfulImagesFromEntries.mockResolvedValue([{ image: 'https://images.ctfassets.net/sample.jpg?fm=webp&q=50' }]);

			const mockGetFullPixelatedConfig = vi.mocked(configModule.getFullPixelatedConfig);
			mockGetFullPixelatedConfig.mockReturnValue({});

			const result = await createContentfulURLs({
				apiProps: {
					base_url: 'https://cdn.contentful.com',
					space_id: 'test-space',
					environment: 'master',
					delivery_access_token: 'test-token',
					sitemapContentType: 'carouselCard',
					sitemapField: 'title',
					sitemapRoutePrefix: '/projects'
				},
				origin: 'https://example.com'
			});

			expect(result[0].images![0]).toBe('https://images.ctfassets.net/sample.jpg?fm=webp&amp;q=50');
		});

		it('should support image field references as well as images arrays', async () => {
			const mockEntries = {
				items: [
					{
						fields: {
							title: 'Single Image',
							image: { sys: { id: 'img-2' } }
						}
					}
				],
				includes: {
					Asset: [
						{ sys: { id: 'img-2' }, fields: { file: { url: '//images.ctfassets.net/single.jpg' }, description: 'Single image' } }
					]
				}
			};

			const mockGetContentfulEntriesByType = vi.mocked(contentfulModule.getContentfulEntriesByType);
			mockGetContentfulEntriesByType.mockResolvedValue(mockEntries as any);

			const mockGetContentfulImagesFromEntries = vi.mocked(contentfulModule.getContentfulImagesFromEntries);
			mockGetContentfulImagesFromEntries.mockResolvedValue([{ image: 'https://images.ctfassets.net/single.jpg?fm=webp&q=50' }]);

			const mockGetFullPixelatedConfig = vi.mocked(configModule.getFullPixelatedConfig);
			mockGetFullPixelatedConfig.mockReturnValue({});

			const result = await createContentfulURLs({
				apiProps: {
					base_url: 'https://cdn.contentful.com',
					space_id: 'test-space',
					environment: 'master',
					delivery_access_token: 'test-token',
					sitemapContentType: 'carouselCard',
					sitemapField: 'title',
					sitemapRoutePrefix: '/projects'
				},
				origin: 'https://example.com'
			});

			expect(mockGetContentfulImagesFromEntries).toHaveBeenCalledWith({
				images: [mockEntries.items[0].fields.image],
				assets: mockEntries.includes.Asset
			});
			expect(result[0].images).toEqual(['https://images.ctfassets.net/single.jpg?fm=webp&amp;q=50']);
		});

		it('should support carouselImages references', async () => {
			const mockEntries = {
				items: [
					{
						fields: {
							title: 'Carousel Item',
							carouselImages: [{ sys: { id: 'img-3' } }, { sys: { id: 'img-4' } }]
						}
					}
				],
				includes: {
					Asset: [
						{ sys: { id: 'img-3' }, fields: { file: { url: '//images.ctfassets.net/carousel1.jpg' }, description: 'Carousel 1' } },
						{ sys: { id: 'img-4' }, fields: { file: { url: '//images.ctfassets.net/carousel2.jpg' }, description: 'Carousel 2' } }
					]
				}
			};

			const mockGetContentfulEntriesByType = vi.mocked(contentfulModule.getContentfulEntriesByType);
			mockGetContentfulEntriesByType.mockResolvedValue(mockEntries as any);

			const mockGetContentfulImagesFromEntries = vi.mocked(contentfulModule.getContentfulImagesFromEntries);
			mockGetContentfulImagesFromEntries.mockResolvedValue([
				{ image: 'https://images.ctfassets.net/carousel1.jpg?fm=webp&q=50' },
				{ image: 'https://images.ctfassets.net/carousel2.jpg?fm=webp&q=50' }
			]);

			const mockGetFullPixelatedConfig = vi.mocked(configModule.getFullPixelatedConfig);
			mockGetFullPixelatedConfig.mockReturnValue({});

			const result = await createContentfulURLs({
				apiProps: {
					base_url: 'https://cdn.contentful.com',
					space_id: 'test-space',
					environment: 'master',
					delivery_access_token: 'test-token',
					sitemapContentType: 'carouselCard',
					sitemapField: 'title',
					sitemapRoutePrefix: '/projects'
				},
				origin: 'https://example.com'
			});

			expect(mockGetContentfulImagesFromEntries).toHaveBeenCalledWith({
				images: mockEntries.items[0].fields.carouselImages,
				assets: mockEntries.includes.Asset
			});
			expect(result[0].images).toEqual([
				'https://images.ctfassets.net/carousel1.jpg?fm=webp&amp;q=50',
				'https://images.ctfassets.net/carousel2.jpg?fm=webp&amp;q=50'
			]);
		});

		it('should use custom sitemapImageFields when provided', async () => {
			const mockEntries = {
				items: [
					{
						fields: {
							title: 'Hero Image Item',
							heroImage: { sys: { id: 'img-hero' } }
						}
					}
				],
				includes: {
					Asset: [
						{ sys: { id: 'img-hero' }, fields: { file: { url: '//images.ctfassets.net/hero.jpg' }, description: 'Hero image' } }
					]
				}
			};

			const mockGetContentfulEntriesByType = vi.mocked(contentfulModule.getContentfulEntriesByType);
			mockGetContentfulEntriesByType.mockResolvedValue(mockEntries as any);

			const mockGetContentfulImagesFromEntries = vi.mocked(contentfulModule.getContentfulImagesFromEntries);
			mockGetContentfulImagesFromEntries.mockResolvedValue([{ image: 'https://images.ctfassets.net/hero.jpg?fm=webp&q=50' }]);

			const mockGetFullPixelatedConfig = vi.mocked(configModule.getFullPixelatedConfig);
			mockGetFullPixelatedConfig.mockReturnValue({});

			const result = await createContentfulURLs({
				apiProps: {
					base_url: 'https://cdn.contentful.com',
					space_id: 'test-space',
					environment: 'master',
					delivery_access_token: 'test-token',
					sitemapContentType: 'carouselCard',
					sitemapField: 'title',
					sitemapRoutePrefix: '/projects',
					sitemapImageFields: ['heroImage']
				},
				origin: 'https://example.com'
			});

			expect(mockGetContentfulImagesFromEntries).toHaveBeenCalledWith({
				images: [mockEntries.items[0].fields.heroImage],
				assets: mockEntries.includes.Asset
			});
			expect(result[0].images).toEqual(['https://images.ctfassets.net/hero.jpg?fm=webp&amp;q=50']);
		});

		describe('buildSitemapConfig', () => {
			it('should support flattened Contentful sitemap fields', () => {
				const pixelatedConfig = {
					integrations: {
						contentful: {
							space_id: 'space-id',
							delivery_access_token: 'token',
							sitemapContentType: 'event',
							sitemapField: 'id',
							sitemapRoutePrefix: '/events'
						}
					}
				};

				const sitemapConfig = buildSitemapConfig(pixelatedConfig, { routes: [] });

				expect(sitemapConfig.contentful).toMatchObject({
					space_id: 'space-id',
					access_token: 'token',
					sitemapContentType: 'event',
					sitemapField: 'id',
					sitemapRoutePrefix: '/events'
				});
				expect(sitemapConfig.createContentfulURLs).toBe(true);
			});

			it('should enable Square sitemap generation when squareItemCategoryId is configured', () => {
				const pixelatedConfig = {
					integrations: {
						square: {
							squareItemCategoryId: 'test-category'
						}
					}
				};

				const sitemapConfig = buildSitemapConfig(pixelatedConfig, { routes: [] });

				expect(sitemapConfig.createSquareItemURLs).toBe(true);
			});
		});

		it('should create page builder URLs from Contentful field values', async () => {
			const mockGetContentfulFieldValues = vi.mocked(contentfulModule.getContentfulFieldValues);
			mockGetContentfulFieldValues.mockResolvedValue(['Home Page', 'About Us/Team']);

			const result = await createContentfulPageBuilderURLs({
				apiProps: {
					base_url: 'https://cdn.contentful.com',
					space_id: 'test-space',
					environment: 'master',
					delivery_access_token: 'test-token'
				},
				origin: 'https://example.com'
			});

			expect(result).toHaveLength(2);
			expect(result[0].url).toBe('https://example.com/Home%20Page');
			expect(result[1].url).toBe('https://example.com/About%20Us%2FTeam');
		});
	});

	describe('createContentfulAssetURLs', () => {
		it('should create sitemap entry with Contentful images', async () => {
			const mockAssets = mockContentfulImageAssets;

			const mockGetContentfulAssets = vi.mocked(contentfulModule.getContentfulAssets);
			mockGetContentfulAssets.mockResolvedValue(mockAssets);

			const mockGetFullPixelatedConfig = vi.mocked(configModule.getFullPixelatedConfig);
			mockGetFullPixelatedConfig.mockReturnValue({});

			const result = await createContentfulAssetURLs({
				apiProps: {
					base_url: 'https://cdn.contentful.com',
					space_id: 'test-space',
					environment: 'master',
					access_token: 'test-token'
				},
				origin: 'https://example.com'
			});

			expect(result).toHaveLength(1);
			expect(result[0]).toMatchObject({
				url: 'https://example.com/images',
				images: expect.arrayContaining([
					expect.stringContaining('image1.jpg'),
					expect.stringContaining('image2.png'),
					expect.stringContaining('image3.webp')
				])
			});
			expect(result[0].lastModified).toBeInstanceOf(Date);
		});

		it('should create sitemap entry with Contentful videos using Google video sitemap format', async () => {
			const mockAssets = {
				items: realContentfulAssetsData.items.slice(0, 2)
			};

			const mockGetContentfulAssets = vi.mocked(contentfulModule.getContentfulAssets);
			mockGetContentfulAssets.mockResolvedValue(mockAssets);

			const mockGetFullPixelatedConfig = vi.mocked(configModule.getFullPixelatedConfig);
			mockGetFullPixelatedConfig.mockReturnValue({});

			const result = await createContentfulAssetURLs({
				apiProps: {
					base_url: 'https://cdn.contentful.com',
					space_id: 'test-space',
					environment: 'master',
					access_token: 'test-token'
				},
				origin: 'https://example.com'
			});

			expect(result).toHaveLength(1);
			expect(result[0]).toMatchObject({
				url: 'https://example.com/videos'
			});
			expect(result[0].videos).toHaveLength(2);
			expect(result[0].videos![0]).toMatchObject({
				title: expect.any(String),
				description: expect.any(String),
				content_loc: expect.stringContaining('.mp4'),
				player_loc: expect.stringContaining('.mp4'),
				publication_date: expect.any(String),
				family_friendly: 'yes'
			});
			expect(result[0].videos![1]).toMatchObject({
				title: expect.any(String),
				description: expect.any(String),
				content_loc: expect.stringContaining('.mp4'),
				player_loc: expect.stringContaining('.mp4'),
				publication_date: expect.any(String),
				family_friendly: 'yes'
			});
			expect(result[0].lastModified).toBeInstanceOf(Date);
		});

		it('should handle empty assets array', async () => {
			const mockAssets = { items: [] };

			const mockGetContentfulAssets = vi.mocked(contentfulModule.getContentfulAssets);
			mockGetContentfulAssets.mockResolvedValue(mockAssets);

			const result = await createContentfulAssetURLs({
				apiProps: {
					base_url: 'https://cdn.contentful.com',
					space_id: 'test-space',
					environment: 'master',
					access_token: 'test-token'
				},
				origin: 'https://example.com'
			});

			expect(result).toEqual([]);
		});

		it('should handle API errors gracefully', async () => {
			const mockGetContentfulAssets = vi.mocked(contentfulModule.getContentfulAssets);
			mockGetContentfulAssets.mockRejectedValue(new Error('API Error'));

			const result = await createContentfulAssetURLs({
				apiProps: {
					base_url: 'https://cdn.contentful.com',
					space_id: 'test-space',
					environment: 'master',
					access_token: 'test-token'
				},
				origin: 'https://example.com'
			});

			expect(result).toEqual([]);
		});

		it('should filter out empty image URLs', async () => {
			const mockAssets = {
				items: mockContentfulImageAssets.items.map((it: any, idx: number) => {
					if (idx === 0) {
						return { ...it, fields: { ...it.fields, file: { ...it.fields.file, url: '/valid.jpg' } } };
					}
					if (idx === 1) {
						// simulate an empty URL on the second item
						return { ...it, fields: { ...it.fields, file: { ...it.fields.file, url: '' } } };
					}
					if (idx === 2) {
						return { ...it, fields: { ...it.fields, file: { ...it.fields.file, url: 'another-valid.jpg' } } };
					}
					return it;
				})
			};

			const mockGetContentfulAssets = vi.mocked(contentfulModule.getContentfulAssets);
			mockGetContentfulAssets.mockResolvedValue(mockAssets);

			const result = await createContentfulAssetURLs({
				apiProps: {
					base_url: 'https://cdn.contentful.com',
					space_id: 'test-space',
					environment: 'master',
					access_token: 'test-token'
				},
				origin: 'https://example.com'
			});

			expect(result[0].images).toHaveLength(2);
			expect(result[0].images![0]).toContain('valid.jpg');
			expect(result[0].images![1]).toContain('another-valid.jpg');
		});
	});

	describe('createEbayItemURLs', () => {
		it('should create sitemap entries for eBay items', async () => {
			const mockToken = 'test-token';
			const mockItems = {
				itemSummaries: [
					{
						legacyItemId: '123456',
						itemCreationDate: '2024-01-01T10:00:00Z'
					},
					{
						legacyItemId: '789012',
						itemCreationDate: '2024-01-02T10:00:00Z'
					}
				]
			};

			const mockGetEbayAppToken = vi.mocked(ebayModule.getEbayAppToken);
			const mockGetEbayItemsSearch = vi.mocked(ebayModule.getEbayItemsSearch);

			mockGetEbayAppToken.mockResolvedValue(mockToken);
			mockGetEbayItemsSearch.mockResolvedValue(mockItems);

			const origin = 'https://example.com';
			const result = await createEbayItemURLs(origin);

			expect(result).toHaveLength(2);
			expect(result[0]).toMatchObject({
				url: 'https://example.com/store/123456',
				changeFrequency: 'hourly',
				priority: 1,
			});
			expect(result[0].lastModified).toBeInstanceOf(Date);
		});

		it('should handle items without creation date', async () => {
			const mockToken = 'test-token';
			const mockItems = {
				itemSummaries: [
					{
						legacyItemId: '123456'
						// no itemCreationDate
					}
				]
			};

			const mockGetEbayAppToken = vi.mocked(ebayModule.getEbayAppToken);
			const mockGetEbayItemsSearch = vi.mocked(ebayModule.getEbayItemsSearch);

			mockGetEbayAppToken.mockResolvedValue(mockToken);
			mockGetEbayItemsSearch.mockResolvedValue(mockItems);

			const origin = 'https://example.com';
			const result = await createEbayItemURLs(origin);

			expect(result[0].lastModified).toBeInstanceOf(Date);
		});

		it('should handle API errors gracefully', async () => {
			const mockGetEbayAppToken = vi.mocked(ebayModule.getEbayAppToken);
			mockGetEbayAppToken.mockRejectedValue(new Error('API Error'));

			const origin = 'https://example.com';
			const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const result = await createEbayItemURLs(origin);
			expect(result).toEqual([]);
			expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('createEbayItemURLs skipped; unable to fetch items'), expect.any(Error));
		});

		it('should return an empty sitemap when no eBay items exist', async () => {
			const mockToken = 'test-token';
			const mockItems = { itemSummaries: [] };
			const mockGetEbayAppToken = vi.mocked(ebayModule.getEbayAppToken);
			const mockGetEbayItemsSearch = vi.mocked(ebayModule.getEbayItemsSearch);

			mockGetEbayAppToken.mockResolvedValue(mockToken);
			mockGetEbayItemsSearch.mockResolvedValue(mockItems);

			const origin = 'https://example.com';
			const result = await createEbayItemURLs(origin);

			expect(result).toEqual([]);
		});

		it('treats browse search failures as empty sitemaps', async () => {
			const mockToken = 'test-token';
			const mockGetEbayAppToken = vi.mocked(ebayModule.getEbayAppToken);
			const mockGetEbayItemsSearch = vi.mocked(ebayModule.getEbayItemsSearch);

			mockGetEbayAppToken.mockResolvedValue(mockToken);
			mockGetEbayItemsSearch.mockRejectedValue(new Error('search failed'));

			const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const origin = 'https://example.com';
			const result = await createEbayItemURLs(origin);

			expect(result).toEqual([]);
			expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('createEbayItemURLs skipped; unable to fetch items'), expect.any(Error));
		});
	});

	describe('createSquareItemURLs', () => {
		it('should create sitemap entries for Square items', async () => {
			const mockGetFullPixelatedConfig = vi.mocked(configModule.getFullPixelatedConfig);
			const mockGetSquareStoreItems = vi.mocked(squareModule.getSquareStoreItems);

			mockGetFullPixelatedConfig.mockReturnValue({
				integrations: {
					square: { squareItemCategoryId: 'test-category' }
				}
			} as any);
			mockGetSquareStoreItems.mockResolvedValue({
				items: [
				{
					itemURL: '/store/test-item',
					itemImageURLs: ['https://images.example.com/test-item-1.jpg'],
				} as any,
				{ itemURL: 'https://external.com/product' } as any
			]
		} as any);

		const origin = 'https://example.com';
		const result = await createSquareItemURLs(origin);

		expect(result).toHaveLength(2);
		expect(result[0]).toMatchObject({
			url: 'https://example.com/store/test-item',
			changeFrequency: 'hourly',
			priority: 1,
		});
		expect(result[0].images).toEqual(['https://images.example.com/test-item-1.jpg']);
			expect(result[0].lastModified).toBeInstanceOf(Date);
		});

		it('should return an empty sitemap when Square config is missing', async () => {
			const mockGetFullPixelatedConfig = vi.mocked(configModule.getFullPixelatedConfig);
			mockGetFullPixelatedConfig.mockReturnValue({});

			const origin = 'https://example.com';
			const result = await createSquareItemURLs(origin);

			expect(result).toEqual([]);
		});
	});

	describe('generateSitemap', () => {
		it('should generate sitemap with page URLs enabled by default', async () => {
			const mockRoutes = [{ path: '/home' }];
			const mockGetAllRoutes = vi.mocked(metadataModule.getAllRoutes);
			mockGetAllRoutes.mockReturnValue(mockRoutes);
			const mockGetFullPixelatedConfig = vi.mocked(configModule.getFullPixelatedConfig);
			mockGetFullPixelatedConfig.mockReturnValue({ routes: mockRoutes });

			const result = await generateSitemap('https://example.com');

			expect(result.length).toBeGreaterThan(0);
			expect(result.some((entry: SitemapEntry) => entry.url.includes('/home'))).toBe(true);
		});

		it('should include image URLs when enabled', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => siteImagesData.images.slice(0, 1)
			});

			const mockGetFullPixelatedConfig = vi.mocked(configModule.getFullPixelatedConfig);
			mockGetFullPixelatedConfig.mockReturnValue({
				createImageURLsFromJSON: true,
				imageJson: { path: 'public/site-images.json' }
			} as any);
			const result = await generateSitemap('https://example.com');

			expect(result.some((entry: SitemapEntry) => entry.url.includes('/images'))).toBe(true);
		});

		it('should include WordPress URLs when enabled', async () => {
			const mockPosts = normalizeWordPressPosts(realWordPressApiData.posts.slice(0, 1));
			const mockGetWordPressItems = vi.mocked(wordpressModule.getWordPressItems);
			mockGetWordPressItems.mockResolvedValue(mockPosts);

			const mockGetFullPixelatedConfig = vi.mocked(configModule.getFullPixelatedConfig);
			mockGetFullPixelatedConfig.mockReturnValue({
				integrations: {
					wordpress: { baseURL: 'https://public-api.wordpress.com/rest/v1/sites/', site: 'example.wordpress.com' }
				}
			} as any);
			const result = await generateSitemap('https://example.com');

			expect(result.some((entry: SitemapEntry) => entry.url.includes(mockPosts[0].URL))).toBe(true);
		});

		it('should deduplicate entries by URL', async () => {
			const mockRoutes = [{ path: '/duplicate' }];
			const mockGetAllRoutes = vi.mocked(metadataModule.getAllRoutes);
			mockGetAllRoutes.mockReturnValue(mockRoutes);

			// Mock fetch to return images that would create duplicate URLs
			const mockJson: string[] = [];
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockJson
			});

			const mockGetFullPixelatedConfig = vi.mocked(configModule.getFullPixelatedConfig);
			mockGetFullPixelatedConfig.mockReturnValue({
				siteConfig: { routes: mockRoutes },
				createImageURLs: true,
				imageJson: { path: 'public/site-images.json' }
			} as any);

			// Create a scenario where we might have duplicates
			const result = await generateSitemap('https://example.com');

			const urls = result.map((entry: SitemapEntry) => entry.url);
			const uniqueUrls = new Set(urls);
			expect(urls.length).toBe(uniqueUrls.size);
		});

		it('should handle empty config', async () => {
			const mockBuildSitemapConfig = vi.spyOn(sitemapModule, 'buildSitemapConfig').mockReturnValue({});
			const result = await generateSitemap('https://example.com');
			expect(Array.isArray(result)).toBe(true);
		});

		it('should build sitemap config automatically when called without args', async () => {
			const mockRoutes = [{ path: '/home' }];
			const mockGetFullPixelatedConfig = vi.mocked(configModule.getFullPixelatedConfig);
			mockGetFullPixelatedConfig.mockReturnValue({ routes: mockRoutes });
			const mockGetAllRoutes = vi.mocked(metadataModule.getAllRoutes);
			mockGetAllRoutes.mockReturnValue(mockRoutes);

			const result = await generateSitemap();

			expect(result.length).toBeGreaterThan(0);
			expect(result.some((entry: SitemapEntry) => entry.url.includes('/home'))).toBe(true);
		});
	});
});