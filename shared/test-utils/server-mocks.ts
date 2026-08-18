import React from 'react';

export function createServerMocks() {
	return {
		__esModule: true,
		createWellKnownResponse: vi.fn((type: string, req: any) => ({ type, url: req.url })),
		generateMetaTags: vi.fn(() => React.createElement('meta', { 'data-testid': 'meta-tags' }, null)),
		PageMetaTags: () => React.createElement('meta', { 'data-testid': 'page-meta-tags' }, null),
		FooterMenu: () => React.createElement('div', { 'data-testid': 'footer-menu' }, null),
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
		generateSitemapJson: async () => ({ urlset: [{ loc: 'https://example.com/sitemap.xml' }] }),
		generateSiteMapRss: async () => '<?xml version="1.0" encoding="UTF-8"?>\n<?xml-stylesheet type="text/xsl" href="/rss.xsl"?>\n<rss version="2.0"><channel><title>Latest Updates</title><link>https://example.com</link><description>Latest site updates</description><item><title>https://example.com/sitemap.xml</title><link>https://example.com/sitemap.xml</link><guid isPermaLink="true">https://example.com/sitemap.xml</guid></item></channel></rss>',
		getOriginFromNextHeaders: async () => 'https://example.com',
		Manifest: vi.fn((opts: any) => ({ manifest: true, ...opts })),
		getEbayItem: vi.fn(async () => ({ legacyItemId: '123456789012', title: 'Test Sunglasses', description: 'Test description' })),
		getEbayProductSchema: vi.fn(() => ({ '@type': 'Product', name: 'Test Sunglasses' })),
	};
}
