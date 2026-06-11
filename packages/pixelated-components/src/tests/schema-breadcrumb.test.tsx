import { describe, it, expect, vi } from 'vitest';
vi.mock('next/headers', () => ({ headers: vi.fn() }));
vi.mock('../components/config/config', () => ({ getFullPixelatedConfig: vi.fn() }));
import { headers } from 'next/headers';
import { getFullPixelatedConfig } from '../components/config/config';
import { BreadcrumbListSchema } from '../components/foundation/schema.server';

async function renderBreadcrumbSchema(currentPath: string = '/', config: any = {}) {
	const mockedGetFullPixelatedConfig = getFullPixelatedConfig as unknown as { mockReturnValue: (value: any) => void };
	const mockedHeaders = headers as unknown as { mockReturnValue: (value: any) => void };

	mockedGetFullPixelatedConfig.mockReturnValue({
		routes: [
			{ name: 'Home', path: '/' },
			{ name: 'Store', path: '/store' },
			{ name: 'Gallery', path: '/gallery' },
			{ name: 'About', path: '/about' },
			{ name: 'Projects', path: '/projects' },
		],
		siteInfo: { url: 'https://example.com' },
		...config,
	});

	mockedHeaders.mockReturnValue(new Headers([['x-path', currentPath]]));

	return await BreadcrumbListSchema();
}

describe('BreadcrumbListSchema', () => {
	const mockRoutes = [
		{ name: 'Home', path: '/' },
		{ name: 'Store', path: '/store' },
		{ name: 'Gallery', path: '/gallery' },
		{ name: 'About', path: '/about' },
		{ name: 'Projects', path: '/projects' },
	];

	it('renders a script tag with application/ld+json type', async () => {
		const script = await renderBreadcrumbSchema('/', { routes: mockRoutes });
		expect(script).toBeDefined();
		expect(script.type).toBe('script');
		expect(script.props.type).toBe('application/ld+json');
	});

	it('generates BreadcrumbList for root path', async () => {
		const script = await renderBreadcrumbSchema('/', { routes: mockRoutes });
		const data = JSON.parse(script.props.dangerouslySetInnerHTML.__html || '{}');

		expect(data['@context']).toBe('https://schema.org');
		expect(data['@type']).toBe('BreadcrumbList');
		expect(data.itemListElement).toHaveLength(1);
		expect(data.itemListElement[0].name).toBe('Home');
		expect(data.itemListElement[0].item).toBe('https://example.com/');
	});

	it('generates breadcrumbs for single-level path', async () => {
		const script = await renderBreadcrumbSchema('/store', { routes: mockRoutes });
		const data = JSON.parse(script.props.dangerouslySetInnerHTML.__html || '{}');

		expect(data.itemListElement).toHaveLength(2);
		expect(data.itemListElement[0]).toEqual({
			'@type': 'ListItem',
			position: 1,
			name: 'Home',
			item: 'https://example.com/',
		});
		expect(data.itemListElement[1]).toEqual({
			'@type': 'ListItem',
			position: 2,
			name: 'Store',
			item: 'https://example.com/store',
		});
	});

	it('generates breadcrumbs for multi-level dynamic path', async () => {
		const script = await renderBreadcrumbSchema('/store/vintage-oakley', { routes: mockRoutes });
		const data = JSON.parse(script.props.dangerouslySetInnerHTML.__html || '{}');

		expect(data.itemListElement).toHaveLength(3);
		expect(data.itemListElement[0].name).toBe('Home');
		expect(data.itemListElement[1].name).toBe('Store');
		// Third level humanizes the segment since "/store/vintage-oakley" doesn't exist in routes
		expect(data.itemListElement[2].name).toBe('Vintage Oakley');
		expect(data.itemListElement[2].item).toBe('https://example.com/store/vintage-oakley');
	});

	it('uses custom siteUrl from props', async () => {
		const script = await renderBreadcrumbSchema('/store', { routes: mockRoutes, siteInfo: { url: 'https://www.pixelvivid.com' } });
		const data = JSON.parse(script.props.dangerouslySetInnerHTML.__html || '{}');

		expect(data.itemListElement[0].item).toBe('https://www.pixelvivid.com/');
		expect(data.itemListElement[1].item).toBe('https://www.pixelvivid.com/store');
	});

	it('handles siteUrl with trailing slash correctly', async () => {
		const script = await renderBreadcrumbSchema('/projects', { routes: mockRoutes, siteInfo: { url: 'https://www.palmetto-epoxy.com/' } });
		const data = JSON.parse(script.props.dangerouslySetInnerHTML.__html || '{}');

		expect(data.itemListElement[0].item).toBe('https://www.palmetto-epoxy.com/');
		expect(data.itemListElement[1].item).toBe('https://www.palmetto-epoxy.com/projects');
	});

	it('defaults to "/" path if currentPath not provided', async () => {
		const script = await renderBreadcrumbSchema('/', { routes: mockRoutes });
		const data = JSON.parse(script.props.dangerouslySetInnerHTML.__html || '{}');

		expect(data.itemListElement).toHaveLength(1);
		expect(data.itemListElement[0].name).toBe('Home');
	});

	it('defaults to https://example.com if siteUrl not provided', async () => {
		const script = await renderBreadcrumbSchema('/about', { routes: mockRoutes, siteInfo: { url: 'https://example.com' } });
		const data = JSON.parse(script.props.dangerouslySetInnerHTML.__html || '{}');

		expect(data.itemListElement[0].item).toBe('https://example.com/');
		expect(data.itemListElement[1].item).toBe('https://example.com/about');
	});

	it('humanizes path segments without matching routes', async () => {
		const routes = [
			{ name: 'Home', path: '/' },
			{ name: 'Products', path: '/products' },
		];
		const script = await renderBreadcrumbSchema('/products/awesome-product-name', { routes, siteInfo: { url: 'https://example.com' } });
		const data = JSON.parse(script.props.dangerouslySetInnerHTML.__html || '{}');

		expect(data.itemListElement[2].name).toBe('Awesome Product Name');
	});

	it('matches parent routes for deeply nested dynamic paths', async () => {
		const routes = [
			{ name: 'Home', path: '/' },
			{ name: 'Projects', path: '/projects' },
		];
		const script = await renderBreadcrumbSchema('/projects/2024/residential-kitchen', { routes, siteInfo: { url: 'https://example.com' } });
		const data = JSON.parse(script.props.dangerouslySetInnerHTML.__html || '{}');

		// Should match "/projects" parent
		expect(data.itemListElement[1].name).toBe('Projects');
		expect(data.itemListElement[1].item).toContain('/projects');
	});
});
