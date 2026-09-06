import { describe, it, expect, vi } from 'vitest';
import * as sitemap from '@/components/foundation/sitemap';

describe('getRuntimeEnvFromHeaders', () => {
	it('returns "local" when x-env is local', () => {
		const hdrs = { get: (k: string) => (k === 'x-env' ? 'local' : null) } as any;
		expect(sitemap.getRuntimeEnvFromHeaders(hdrs)).toBe('local');
	});

	it('returns "prod" when x-env is prod', () => {
		const hdrs = { get: (k: string) => (k === 'x-env' ? 'prod' : null) } as any;
		expect(sitemap.getRuntimeEnvFromHeaders(hdrs)).toBe('prod');
	});

	it('returns "auto" when x-env is not present', () => {
		expect(sitemap.getRuntimeEnvFromHeaders(undefined)).toBe('auto');
	});
});

describe('buildSitemapConfig', () => {
	it('enables configured integration sitemap sources', () => {
		const result = sitemap.buildSitemapConfig({
			integrations: {
				wordpress: { site: 'example.wordpress.com' },
				contentful: {
					space_id: 'space',
					delivery_access_token: 'token',
					base_url: 'https://cdn.example',
					environment: 'master',
					sitemap: { imageFields: ['hero'] },
					sitemapImageFields: ['image'],
					sitemapContentType: 'page',
					sitemapField: 'slug',
					sitemapRoutePrefix: '/content',
					sitemapRouteTemplate: '/content/{slug}',
				},
				ebay: { appId: 'app' },
				square: { squareItemCategoryId: 'category' },
			},
		});

		expect(result.createPageURLs).toBe(true);
		expect(result.createImageURLsFromJSON).toBe(true);
		expect(result.createWordPressURLs).toBe(true);
		expect(result.createWordPressImageURLs).toBe(true);
		expect(result.createContentfulURLs).toBe(true);
		expect(result.createContentfulAssetURLs).toBe(true);
		expect(result.createEbayItemURLs).toBe(true);
		expect(result.createSquareItemURLs).toBe(true);
		expect(result.createSquareEventURLs).toBe(true);
		expect(result.contentful?.sitemap.imageFields).toEqual(['hero']);
	});

	it('applies overrides and ignores invalid overrides', () => {
		const base = sitemap.buildSitemapConfig({ integrations: {} }, { createPageURLs: false });
		expect(base.createPageURLs).toBe(true);
		const invalid = sitemap.buildSitemapConfig({ integrations: {} }, null as any);
		expect(invalid.createPageURLs).toBe(true);
	});
});

describe('sitemapEntriesToJson', () => {
	it('maps sitemap entries to RFC 9576 JSON', () => {
		const result = sitemap.sitemapEntriesToJson([
			{
				url: 'https://example.com/page',
				lastModified: new Date('2025-01-01T00:00:00Z'),
				changeFrequency: 'daily',
				priority: 0.8,
			},
		] as any);

		expect(result).toEqual({
			urlset: [
				{
					loc: 'https://example.com/page',
					lastmod: '2025-01-01T00:00:00.000Z',
					changefreq: 'daily',
					priority: 0.8,
				},
			],
		});
	});

	it('omits optional sitemap fields when not present', () => {
		const result = sitemap.sitemapEntriesToJson([
			{ url: 'https://example.com/simple' } as any,
		]);

		expect(result).toEqual({
			urlset: [
				{
					loc: 'https://example.com/simple',
				},
			],
		});
	});
});

describe('generateSiteMapRss', () => {
	it('generates valid RSS XML from sitemap entries', async () => {
		const xml = await sitemap.generateSiteMapRss('https://example.com');
		expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
		expect(xml).toContain('<rss version="2.0">');
		expect(xml).toContain('<channel>');
		expect(xml).toContain('<item>');
		expect(xml).toContain('<guid isPermaLink="true">');
	});

	it('uses entry.name for title and includes description when present', async () => {
		const xml = await sitemap.generateSiteMapRss('https://example.com');
		expect(xml).toContain('<description>');
		expect(xml).toContain('<title>');
		expect(xml).toContain('<guid isPermaLink="true">');
	});

	it('includes the XSL stylesheet reference in RSS output', async () => {
		const xml = await sitemap.generateSiteMapRss('https://example.com');
		expect(xml).toContain('<?xml-stylesheet type="text/xsl" href="/rss.xsl"?>');
	});
});
