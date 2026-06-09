import { describe, it, expect } from 'vitest';
import { render } from '../test/test-utils';
import type { SiteInfo } from '@/components/config/config.types';
import { WebsiteSchema } from '@/components/foundation/schema';
import configData from '../test/test-data';

describe('WebsiteSchema', () => {
	const siteInfo: SiteInfo = configData.siteInfoFull as SiteInfo;

	const renderSchema = (siteMeta?: SiteInfo) => {
		return render(<WebsiteSchema />, { config: { siteInfo: siteMeta ?? siteInfo } });
	};

	it('should render script tag with application/ld+json type', () => {
		const { container } = renderSchema();
		const scriptTag = container.querySelector('script[type="application/ld+json"]');
		expect(scriptTag).toBeTruthy();
	});

	it('should include schema.org context and WebSite type', () => {
		const { container } = renderSchema();
		const scriptTag = container.querySelector('script[type="application/ld+json"]');
		const schemaData = JSON.parse(scriptTag?.textContent || '{}');

		expect(schemaData['@context']).toBe('https://schema.org');
		expect(schemaData['@type']).toBe('WebSite');
	});

	it('should include name and url', () => {
		const { container } = renderSchema();
		const scriptTag = container.querySelector('script[type="application/ld+json"]');
		const schemaData = JSON.parse(scriptTag?.textContent || '{}');

		expect(schemaData.name).toBe(siteInfo.name);
		expect(schemaData.url).toBe(siteInfo.url);
	});

	it('should include description when provided', () => {
		const siteMeta = { ...siteInfo, description: 'A great website' };
		const { container } = renderSchema(siteMeta);
		const scriptTag = container.querySelector('script[type="application/ld+json"]');
		const schemaData = JSON.parse(scriptTag?.textContent || '{}');

		expect(schemaData.description).toBe('A great website');
	});

	it('should exclude description when not provided', () => {
		const siteMeta = { ...siteInfo, description: '' };
		const { container } = renderSchema(siteMeta);
		const scriptTag = container.querySelector('script[type="application/ld+json"]');
		const schemaData = JSON.parse(scriptTag?.textContent || '{}');

		expect(schemaData.description).toBeUndefined();
	});

	it('should include potentialAction for search when provided', () => {
		const siteMeta = {
			...siteInfo,
			potentialAction: {
				'@type': 'SearchAction',
				target: 'https://example.com/search?q={search_term}',
				'query-input': 'required name=search_term'
			}
		};
		const { container } = renderSchema(siteMeta);
		const scriptTag = container.querySelector('script[type="application/ld+json"]');
		const schemaData = JSON.parse(scriptTag?.textContent || '{}');

		expect(schemaData.potentialAction).toBeDefined();
		expect(schemaData.potentialAction['@type']).toBe('SearchAction');
		expect(schemaData.potentialAction.target.urlTemplate).toBe(
			'https://example.com/search?q={search_term}'
		);
	});

	it('should use siteInfo props when publisher and potentialAction aren\'t provided', () => {
		const { container } = renderSchema(siteInfo);
		const scriptTag = container.querySelector('script[type="application/ld+json"]');
		const schemaData = JSON.parse(scriptTag?.textContent || '{}');

		expect(schemaData.publisher).toBeDefined();
		expect(['LocalBusiness','Organization']).toContain(schemaData.publisher['@type']);
		expect(schemaData.publisher.name).toBe('Pixelated Technologies');
		expect(schemaData.publisher.logo.url).toBe(siteInfo.image);
		expect(schemaData.copyrightHolder).toBeDefined();
		expect(['LocalBusiness','Organization']).toContain(schemaData.copyrightHolder['@type']);
		if (siteInfo.potentialAction) {
			expect(schemaData.potentialAction).toBeDefined();
			expect(schemaData.potentialAction.target.urlTemplate).toBe(
				'https://pixelated.tech/search?q={search_term_string}'
			);
		} else {
			expect(schemaData.potentialAction).toBeUndefined();
		}
	});

	it('should exclude potentialAction when not provided', () => {
		const siteMeta = { ...siteInfo, potentialAction: undefined };
		const { container } = renderSchema(siteMeta);
		const scriptTag = container.querySelector('script[type="application/ld+json"]');
		const schemaData = JSON.parse(scriptTag?.textContent || '{}');

		expect(schemaData.potentialAction).toBeUndefined();
	});

	it('should generate valid JSON', () => {
		const { container } = renderSchema();
		const scriptTag = container.querySelector('script[type="application/ld+json"]');

		expect(() => {
			JSON.parse(scriptTag?.textContent || '{}');
		}).not.toThrow();
	});

	it('should handle special characters in name', () => {
		const siteMeta = { ...siteInfo, name: "O'Brien's Technology & Design" };
		const { container } = renderSchema(siteMeta);
		const schemaData = JSON.parse(container.querySelector('script[type="application/ld+json"]')?.textContent || '{}');

		expect(schemaData.name).toBe(siteMeta.name);
	});

	it('should handle HTTPS URLs', () => {
		const siteMeta = { ...siteInfo, url: 'https://secure.example.com' };
		const { container } = renderSchema(siteMeta);
		const schemaData = JSON.parse(container.querySelector('script[type="application/ld+json"]')?.textContent || '{}');

		expect(schemaData.url).toBe('https://secure.example.com');
	});

	it('should render without crashing with minimal required props', () => {
		expect(() => {
			renderSchema();
		}).not.toThrow();
	});

	it('should not include undefined optional fields in JSON output', () => {
		const { container } = renderSchema();
		const schemaData = JSON.parse(container.querySelector('script[type="application/ld+json"]')?.textContent || '{}');

		expect(Object.values(schemaData).some(val => val === undefined)).toBe(false);
	});
});
