import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
vi.mock('next/headers', () => ({ headers: vi.fn() }));
import { headers } from 'next/headers';
import {
	descriptionToKeywords,
	getRouteByKey,
	getAllRoutes,
	getMetadata,
	getAccordionMenuData,
	type Route
} from '../components/foundation/metadata.functions';
import { generateMetaTags } from '../components/foundation/metadata.server';
import type { SiteInfo } from '../components/config/config.types';
import * as configModule from '../components/config/config';

describe('Metadata Functions', () => {
	describe('descriptionToKeywords', () => {
		it('should extract keywords from description', () => {
			const description = 'This is a test description about web development and JavaScript programming';
			const keywords = descriptionToKeywords(description, 3);

			expect(keywords).toBeDefined();
			expect(keywords.length).toBeLessThanOrEqual(3);
			expect(keywords.every(k => typeof k === 'string')).toBe(true);
		});

		it('should filter out stop words', () => {
			const description = 'the quick brown fox jumps over the lazy dog';
			const keywords = descriptionToKeywords(description, 5);

			expect(keywords.some(k => k === 'the')).toBe(false);
			expect(keywords.some(k => k === 'over')).toBe(false);
		});

		it('should handle empty description', () => {
			const keywords = descriptionToKeywords('', 5);
			expect(keywords).toEqual([]);
		});

		it('should respect custom stop words', () => {
			const description = 'test testing tested test example';
			const keywords = descriptionToKeywords(description, 10, ['test', 'testing']);

			expect(keywords.some(k => k === 'test')).toBe(false);
		});

		it('should filter out single and double character words', () => {
			const description = 'I am a web developer who codes in JavaScript and TypeScript';
			const keywords = descriptionToKeywords(description, 10);

			expect(keywords.every(k => k.length > 2)).toBe(true);
		});

		it('should handle punctuation', () => {
			const description = 'Hello! How are you? This is a test. Great!';
			const keywords = descriptionToKeywords(description, 5);

			expect(keywords.length).toBeGreaterThan(0);
			expect(keywords.every(k => !k.includes('!'))).toBe(true);
		});

		it('should return top N keywords', () => {
			const description = 'apple apple apple banana banana orange';
			const keywords = descriptionToKeywords(description, 2);

			expect(keywords.length).toBeLessThanOrEqual(2);
		});
	});

	describe('getRouteByKey', () => {
		it('should find object by key-value pair', () => {
			const routes = {
				name: 'Home',
				path: '/',
				routes: [
					{ name: 'About', path: '/about' },
					{ name: 'Contact', path: '/contact' }
				]
			};

			const result = getRouteByKey(routes, 'name', 'About');
			expect(result).toBeDefined();
			expect(result?.name).toBe('About');
		});

		it('should handle nested objects', () => {
			const routes = {
				name: 'Root',
				routes: {
					name: 'Parent',
					routes: [{ name: 'Target', path: '/target' }]
				}
			};

			const result = getRouteByKey(routes, 'name', 'Target');
			expect(result?.name).toBe('Target');
		});

		it('should return null for non-existent values', () => {
			const routes = { name: 'Home', path: '/' };
			const result = getRouteByKey(routes, 'name', 'NonExistent');

			expect(result).toBeNull();
		});

		it('should handle null/undefined input', () => {
			expect(getRouteByKey(null, 'name', 'Test')).toBeNull();
			expect(getRouteByKey(undefined, 'name', 'Test')).toBeNull();
		});

		it('should find first match in arrays', () => {
			const routes = [
				{ name: 'First' },
				{ name: 'Second', nested: [{ name: 'Target' }] },
				{ name: 'Third' }
			];

			const result = getRouteByKey(routes, 'name', 'Target');
			expect(result?.name).toBe('Target');
		});
	});

	describe('getAllRoutes', () => {
		it('should extract all leaf nodes', () => {
			const routes: Route = {
				name: 'Root',
				routes: [
					{ name: 'Item1', path: '/1' },
					{ name: 'Item2', path: '/2' }
				]
			};

			const result = getAllRoutes(routes, 'routes');
			expect(result.length).toBeGreaterThan(0);
		});

		it('should handle single level routes', () => {
			const routes: Route = { name: 'Single', path: '/' };
			const result = getAllRoutes(routes, 'routes');

			expect(Array.isArray(result)).toBe(true);
		});

		it('should traverse deeply nested structures', () => {
			const routes: Route = {
				name: 'Level1',
				routes: [
					{
						name: 'Level2',
						routes: [{ name: 'Level3', path: '/deep' }]
					}
				]
			};

			const result = getAllRoutes(routes, 'routes');
			expect(result.length).toBeGreaterThan(0);
		});
	});

	describe('getMetadata', () => {
		it('should extract metadata by key-value', () => {
			const routes = {
				name: 'Home',
				title: 'Home Page',
				description: 'Welcome to home',
				keywords: 'home, welcome'
			};

			const metadata = getMetadata(routes, 'name', 'Home');
			expect(metadata.title).toBe('Home Page');
			expect(metadata.description).toBe('Welcome to home');
		});

		it('should return empty metadata if not found', () => {
			const routes = { name: 'Home', title: 'Home' };
			const metadata = getMetadata(routes, 'name', 'About');

			expect(metadata.title).toBe('');
			expect(metadata.description).toBe('');
			expect(metadata.keywords).toBe('');
		});

		it('should use provided key and value', () => {
			const routes: Route = {
				name: 'Root',
				path: '/',
				title: 'Root',
				description: 'Root page',
				keywords: 'root'
			};

			const metadata = getMetadata(routes, 'path', '/');
			expect(metadata.title).toBe( 'Root');
		});

		it('should handle routes in array format', () => {
			const routes = [
				{ name: 'Home', title: 'Home Page', description: 'Desc' },
				{ name: 'About', title: 'About Page', description: 'About desc' }
			];

			const metadata = getMetadata(routes, 'name', 'About');
			expect(metadata.title).toBe('About Page');
		});
	});

	describe('getAccordionMenuData', () => {
		it('should convert routes to accordion structure', () => {
			const routes = [
				{
					name: 'Products',
					routes: [
						{ name: 'Electronics', path: '/electronics' },
						{ name: 'Books', path: '/books' }
					]
				}
			];

			const result = getAccordionMenuData(routes);
			expect(result).toBeDefined();
			expect(typeof result).toBe('object');
		});

		it('should handle flat routes', () => {
			const routes = [
				{ name: 'Home', path: '/' },
				{ name: 'About', path: '/about' }
			];

			const result = getAccordionMenuData(routes);
			expect(result).toBeDefined();
		});

		it('should handle mixed nested and flat routes', () => {
			const routes = [
				{ name: 'Home', path: '/' },
				{
					name: 'Services',
					routes: [{ name: 'Consulting', path: '/consulting' }]
				}
			];

			const result = getAccordionMenuData(routes);
			expect(result).toBeDefined();
		});
	});

	describe('generateMetaTags', () => {
		const mockSiteInfo: SiteInfo = {
			name: 'Example',
			description: 'Example site description',
			url: 'https://example.com',
			email: 'test@example.com',
			image: 'https://example.com/logo.png',
			image_height: 600,
			image_width: 800,
			favicon: '/favicon.ico',
		};
		const mockGetFullPixelatedConfig = vi.spyOn(configModule, 'getFullPixelatedConfig');

		beforeEach(() => {
			mockGetFullPixelatedConfig.mockReturnValue({
				siteInfo: mockSiteInfo,
				routes: [
					{ path: '/test', title: 'Test Page', description: 'A test page', keywords: 'test, example' }
				]
			} as any);
		});

		const setupHeaders = (path = '/test', origin = 'https://example.com', url = 'https://example.com/test') => {
			vi.mocked(headers).mockReturnValue(new Headers([
				['x-path', path],
				['x-origin', origin],
				['x-url', url],
			]));
		};

		afterEach(() => {
			mockGetFullPixelatedConfig.mockReset();
			vi.mocked(headers).mockReset();
		});

		it('should generate meta tag JSX for a route that exists', async () => {
			setupHeaders('/test', 'https://example.com', 'https://example.com/test');

			const result = renderToStaticMarkup(await generateMetaTags());
			expect(result).toContain('<title>Test Page</title>');
			expect(result).toContain('name="description" content="A test page"');
			expect(result).toContain('name="keywords" content="test, example"');
			expect(result).toContain('property="og:url" content="https://example.com/test"');
		});

		it('should handle missing optional props for an unknown path', async () => {
			setupHeaders('/unknown', 'https://example.com', 'https://example.com/unknown');

			const result = renderToStaticMarkup(await generateMetaTags());
			expect(result).toContain('<title></title>');
			expect(result).toContain('name="description" content=""');
			expect(result).toContain('name="keywords" content=""');
		});

		it('should extract hostname from origin URL', () => {
			setupHeaders('/test', 'https://subdomain.example.com:8080/path', 'https://example.com/');

			const result = generateMetaTags();
			expect(result).toBeDefined();
		});

		it('should handle invalid origin URL gracefully', async () => {
			setupHeaders('/test', 'not-a-url', 'https://example.com/');

			const result = renderToStaticMarkup(await generateMetaTags());
			expect(result).toContain('property="twitter:url" content="https://example.com/"');
			expect(result).toContain('property="twitter:domain"');
			expect(result).toContain('content="https://example.com/"');
		});

		it('should use config-provided site metadata values', async () => {
			setupHeaders('/test', 'https://example.com', 'https://example.com/');

			const result = renderToStaticMarkup(await generateMetaTags());
			expect(result).toContain('name="application-name" content="Example"');
			expect(result).toContain('name="author" content="Example, test@example.com"');
		});

		it('should fallback to service metadata for /services/* when route metadata is missing', async () => {
			setupHeaders('/services/web-development', 'https://example.com', 'https://example.com/services/web-development');
			mockGetFullPixelatedConfig.mockReturnValue({
				siteInfo: {
					...mockSiteInfo,
					keywords: 'services, example',
					services: [
						{
							name: 'Web Development',
							description: 'Custom web development services',
						},
					],
				},
				routes: [],
			} as any);

			const result = renderToStaticMarkup(await generateMetaTags());
			expect(result).toContain('<title>Example - Web Development</title>');
			expect(result).toContain('name="description" content=""');
			expect(result).toContain('name="keywords" content="services, example"');
		});

		it('should fallback to service area metadata for /service-areas/* when route metadata is missing', async () => {
			setupHeaders('/service-areas/east-coast', 'https://example.com', 'https://example.com/service-areas/east-coast');
			mockGetFullPixelatedConfig.mockReturnValue({
				siteInfo: {
					...mockSiteInfo,
					keywords: 'service areas, example',
					serviceAreas: [
						{
							name: 'East Coast',
							description: 'Service area description',
						},
					],
				},
				routes: [],
			} as any);

			const result = renderToStaticMarkup(await generateMetaTags());
			expect(result).toContain('<title>Example - East Coast</title>');
			expect(result).toContain('name="description" content=""');
			expect(result).toContain('name="keywords" content="service areas, example"');
		});

		it('should include RSS autodiscovery link', async () => {
			setupHeaders('/test', 'https://example.com', 'https://example.com/test');

			const result = renderToStaticMarkup(await generateMetaTags());
			expect(result).toContain('<link rel="alternate" type="application/rss+xml" title="Sitemap RSS" href="/rss.xml"');
		});
	});});