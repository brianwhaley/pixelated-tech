import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '../test/test-utils';
import { SchemaWebPage } from '../components/foundation/schema';

describe('SchemaWebPage', () => {
	const defaultConfig = {
		siteInfo: {
			name: 'Pixelated Technologies',
			url: 'https://www.pixelated.tech',
			servicesPathPrefix: '/services',
			services: [
				{ name: 'Web Development' },
				{ name: 'Search Engine Optimization (SEO)' }
			],
			serviceAreas: [
				{ name: 'Denville NJ' },
				{ name: 'Morristown NJ' }
			]
		}
	};

	it('should return null when serviceAreaSlug does not match any service area', () => {
		const { container } = render(
			<SchemaWebPage serviceAreaSlug="nonexistent-slug" />,
			{ config: defaultConfig }
		);
		const script = container.querySelector('script[type="application/ld+json"]');
		expect(script).toBeNull();
	});

	it('should render WebPage schema matching the specified serviceAreaSlug', () => {
		const { container } = render(
			<SchemaWebPage serviceAreaSlug="denville-nj" />,
			{ config: defaultConfig }
		);

		const script = container.querySelector('script[type="application/ld+json"]');
		expect(script).not.toBeNull();

		const schema = JSON.parse(script!.textContent || '{}');
		expect(schema['@context']).toBe('https://schema.org');
		expect(schema['@type']).toBe('WebPage');
		expect(schema['@id']).toBe('https://www.pixelated.tech/service-areas/denville-nj');
		expect(schema.url).toBe('https://www.pixelated.tech/service-areas/denville-nj');
		expect(schema.name).toBe('Digital Services and Web Design in Denville, NJ');
	});

	it('should include list of about services with absolute URLs in the schema', () => {
		const { container } = render(
			<SchemaWebPage serviceAreaSlug="morristown-nj" />,
			{ config: defaultConfig }
		);

		const script = container.querySelector('script[type="application/ld+json"]');
		expect(script).not.toBeNull();

		const schema = JSON.parse(script!.textContent || '{}');
		expect(schema.about).toEqual([
			{
				'@type': 'Service',
				name: 'Web Development',
				url: 'https://www.pixelated.tech/services/web-development'
			},
			{
				'@type': 'Service',
				name: 'Search Engine Optimization (SEO)',
				url: 'https://www.pixelated.tech/services/search-engine-optimization-(seo)'
			}
		]);
	});

	it('should respect custom serviceAreaPathPrefix overrides', () => {
		const { container } = render(
			<SchemaWebPage serviceAreaSlug="denville-nj" serviceAreaPathPrefix="/locations" />,
			{ config: defaultConfig }
		);

		const script = container.querySelector('script[type="application/ld+json"]');
		const schema = JSON.parse(script!.textContent || '{}');
		expect(schema['@id']).toBe('https://www.pixelated.tech/locations/denville-nj');
		expect(schema.url).toBe('https://www.pixelated.tech/locations/denville-nj');
	});
});
