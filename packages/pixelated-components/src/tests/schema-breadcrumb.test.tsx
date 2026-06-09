import { render } from '../test/test-utils';
import { describe, it, expect } from 'vitest';
import { BreadcrumbListSchema } from '../components/foundation/schema';

function renderBreadcrumbSchema(currentPath: string = '/', config: any = {}) {
	return render(<BreadcrumbListSchema currentPath={currentPath} />, {
		config: {
			routes: [
				{ name: 'Home', path: '/' },
				{ name: 'Store', path: '/store' },
				{ name: 'Gallery', path: '/gallery' },
				{ name: 'About', path: '/about' },
				{ name: 'Projects', path: '/projects' },
			],
			siteInfo: { url: 'https://example.com' },
			...config,
		},
	});
}

describe('BreadcrumbListSchema', () => {
	const mockRoutes = [
		{ name: 'Home', path: '/' },
		{ name: 'Store', path: '/store' },
		{ name: 'Gallery', path: '/gallery' },
		{ name: 'About', path: '/about' },
		{ name: 'Projects', path: '/projects' },
	];

	it('renders a script tag with application/ld+json type', () => {
		const { container } = renderBreadcrumbSchema('/', { routes: mockRoutes });
		const script = container.querySelector('script[type="application/ld+json"]');
		expect(script).toBeDefined();
	});

	it('generates BreadcrumbList for root path', () => {
		const { container } = renderBreadcrumbSchema('/', { routes: mockRoutes });
		const script = container.querySelector('script[type="application/ld+json"]');
		const data = JSON.parse(script?.textContent || '{}');

		expect(data['@context']).toBe('https://schema.org');
		expect(data['@type']).toBe('BreadcrumbList');
		expect(data.itemListElement).toHaveLength(1);
		expect(data.itemListElement[0].name).toBe('Home');
		expect(data.itemListElement[0].item).toBe('https://example.com/');
	});

	it('generates breadcrumbs for single-level path', () => {
		const { container } = renderBreadcrumbSchema('/store', { routes: mockRoutes });
		const script = container.querySelector('script[type="application/ld+json"]');
		const data = JSON.parse(script?.textContent || '{}');

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

	it('generates breadcrumbs for multi-level dynamic path', () => {
		const { container } = renderBreadcrumbSchema('/store/vintage-oakley', { routes: mockRoutes });
		const script = container.querySelector('script[type="application/ld+json"]');
		const data = JSON.parse(script?.textContent || '{}');

		expect(data.itemListElement).toHaveLength(3);
		expect(data.itemListElement[0].name).toBe('Home');
		expect(data.itemListElement[1].name).toBe('Store');
		// Third level humanizes the segment since "/store/vintage-oakley" doesn't exist in routes
		expect(data.itemListElement[2].name).toBe('Vintage Oakley');
		expect(data.itemListElement[2].item).toBe('https://example.com/store/vintage-oakley');
	});

	it('uses custom siteUrl from props', () => {
		const { container } = renderBreadcrumbSchema('/store', { routes: mockRoutes, siteInfo: { url: 'https://www.pixelvivid.com' } });
		const script = container.querySelector('script[type="application/ld+json"]');
		const data = JSON.parse(script?.textContent || '{}');

		expect(data.itemListElement[0].item).toBe('https://www.pixelvivid.com/');
		expect(data.itemListElement[1].item).toBe('https://www.pixelvivid.com/store');
	});

	it('handles siteUrl with trailing slash correctly', () => {
		const { container } = renderBreadcrumbSchema('/projects', { routes: mockRoutes, siteInfo: { url: 'https://www.palmetto-epoxy.com/' } });
		const script = container.querySelector('script[type="application/ld+json"]');
		const data = JSON.parse(script?.textContent || '{}');

		expect(data.itemListElement[0].item).toBe('https://www.palmetto-epoxy.com/');
		expect(data.itemListElement[1].item).toBe('https://www.palmetto-epoxy.com/projects');
	});

	it('defaults to "/" path if currentPath not provided', () => {
		const { container } = renderBreadcrumbSchema('/', { routes: mockRoutes });
		const script = container.querySelector('script[type="application/ld+json"]');
		const data = JSON.parse(script?.textContent || '{}');

		expect(data.itemListElement).toHaveLength(1);
		expect(data.itemListElement[0].name).toBe('Home');
	});

	it('defaults to https://example.com if siteUrl not provided', () => {
		const { container } = renderBreadcrumbSchema('/about', { routes: mockRoutes, siteInfo: { url: 'https://example.com' } });
		const script = container.querySelector('script[type="application/ld+json"]');
		const data = JSON.parse(script?.textContent || '{}');

		expect(data.itemListElement[0].item).toBe('https://example.com/');
		expect(data.itemListElement[1].item).toBe('https://example.com/about');
	});

	it('humanizes path segments without matching routes', () => {
		const routes = [
			{ name: 'Home', path: '/' },
			{ name: 'Products', path: '/products' },
		];
		const { container } = renderBreadcrumbSchema('/products/awesome-product-name', { routes, siteInfo: { url: 'https://example.com' } });
		const script = container.querySelector('script[type="application/ld+json"]');
		const data = JSON.parse(script?.textContent || '{}');

		expect(data.itemListElement[2].name).toBe('Awesome Product Name');
	});

	it('matches parent routes for deeply nested dynamic paths', () => {
		const routes = [
			{ name: 'Home', path: '/' },
			{ name: 'Projects', path: '/projects' },
		];
		const { container } = renderBreadcrumbSchema('/projects/2024/residential-kitchen', { routes, siteInfo: { url: 'https://example.com' } });
		const script = container.querySelector('script[type="application/ld+json"]');
		const data = JSON.parse(script?.textContent || '{}');

		// Should match "/projects" parent
		expect(data.itemListElement[1].name).toBe('Projects');
		expect(data.itemListElement[1].item).toContain('/projects');
	});
});
