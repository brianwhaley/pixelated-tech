import React from 'react';

export function createServerMocks() {
	return {
		__esModule: true,
		createWellKnownResponse: vi.fn((type: string, req: any) => ({ type, url: req.url })),
		generateMetaTags: vi.fn(() => React.createElement('meta', { 'data-testid': 'meta-tags' }, null)),
		PageMetaTags: () => React.createElement('meta', { 'data-testid': 'page-meta-tags' }, null),
		WebsiteSchema: () => null,
		LocalBusinessSchema: () => null,
		ServicesSchema: () => null,
		BreadcrumbListSchema: () => null,
		VisualDesignStyles: () => null,
		StyleGuideUI: () => React.createElement('div', { id: 'colors-section' }, 'Style Guide UI'),
		PixelatedServerConfigProvider: ({ children }: any) => React.createElement('div', { 'data-testid': 'server-config-provider' }, children),
		getFullPixelatedConfig: () => ({}),
		buildSitemapConfig: () => ({ sitemap: true }),
		generateSitemap: async () => [{ url: 'https://example.com/sitemap.xml' }],
		getOriginFromNextHeaders: async () => 'https://example.com',
		Manifest: vi.fn((opts: any) => ({ manifest: true, ...opts })),
		getEbayItem: vi.fn(async () => ({ legacyItemId: '123456789012', title: 'Test Sunglasses', description: 'Test description' })),
		getEbayProductSchema: vi.fn(() => ({ '@type': 'Product', name: 'Test Sunglasses' })),
	};
}
