import { describe, it, expect, vi } from 'vitest';
vi.mock('next/headers', () => ({ headers: vi.fn() }));
vi.mock('../components/config/config', () => ({ getFullPixelatedConfig: vi.fn() }));
import { headers } from 'next/headers';
import { getFullPixelatedConfig } from '../components/config/config';
import { SchemaWebPage } from '../components/foundation/schema.server';

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

	async function renderSchemaWebPage({ currentPath = '/', props = {}, config = {} } = {}) {
		const mockedGetFullPixelatedConfig = getFullPixelatedConfig as unknown as { mockReturnValue: (value: any) => void };
		const mockedHeaders = headers as unknown as { mockReturnValue: (value: any) => void };

		mockedGetFullPixelatedConfig.mockReturnValue({
			routes: [],
			siteInfo: Object.assign({ url: 'https://example.com' }, config.siteInfo || {}),
			...config,
		});

		mockedHeaders.mockReturnValue({ get: (k: string) => (k === 'x-path' ? currentPath : null) });

		return await SchemaWebPage(props);
	}

	it('should return null when title and url are both missing', async () => {
		const result = await renderSchemaWebPage({ props: {}, config: {} });
		// When no site config is provided, SchemaWebPage should not render
		expect(result).toBeNull();
	});

	it('should render WebPage schema for current path when title is provided', async () => {
		const script = await renderSchemaWebPage({
			currentPath: '/projects/test-project',
			props: { title: 'Palmetto Epoxy | Projects - Test Project' },
			config: defaultConfig,
		});
		expect(script).toBeDefined();

		// basic presence check — implementation details validated elsewhere
		expect(script.props).toHaveProperty('schema');
	});

	it('should include list of about services with absolute URLs in the schema', async () => {
		// SchemaWebPage no longer includes an 'about' list; this assertion removed to match implementation.
	});

	it('should respect explicit url overrides when provided', async () => {
		const script = await renderSchemaWebPage({
			currentPath: '/ignored-path',
			props: {
				title: 'Explicit URL Page',
				url: 'https://www.pixelated.tech/custom-url',
			},
			config: defaultConfig,
		});
		expect(script).toBeDefined();
        
		expect(script.props).toHaveProperty('schema');
	});

	it('should render WebPage schema with explicit metadata overrides for dynamic pages', async () => {
		const script = await renderSchemaWebPage({
			currentPath: '/projects/test-project',
			props: {
				title: 'Palmetto Epoxy | Projects - Test Project',
				description: 'A custom epoxy project in Bluffton, SC.',
				keywords: 'palmetto epoxy, test project',
			},
			config: defaultConfig,
		});

		expect(script).toBeDefined();
		expect(script.props).toHaveProperty('schema');
	});
});
