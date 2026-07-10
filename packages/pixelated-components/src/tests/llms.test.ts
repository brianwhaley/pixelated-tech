import { describe, expect, it, vi, beforeEach } from 'vitest';

const createFakeConfig = () => ({
	siteInfo: {
		name: 'Test Site',
		url: 'https://example.com',
		email: 'hello@example.com',
		services: [
			{ name: 'Web Design', slug: 'web-design' },
		],
		serviceAreas: [
			{ name: 'Metro', slug: 'metro', path: '/service-areas/metro' },
		],
	},
	routes: [
		{ path: '/about' },
		{ path: '/styleguide' },
		{ path: '/robots.txt' },
		{ path: '/faq' },
	],
});

let fakeConfig = createFakeConfig();

vi.mock('../components/config/config', () => ({
	getFullPixelatedConfig: vi.fn(() => fakeConfig),
}));

import { LLMSTxt } from '../components/foundation/llms';

describe('LLMSTxt', () => {
	beforeEach(() => {
		fakeConfig = createFakeConfig();
	});
	it('generates markdown with services, service areas, other links, contact, and generated metadata', async () => {
		const output = LLMSTxt({});
		const text = await output.text();

		expect(text).toContain('# Test Site');
		expect(text).toContain('## Services');
		expect(text).toContain('- https://example.com/services/web-design');
		expect(text).toContain('## Service Areas');
		expect(text).toContain('- https://example.com/service-areas/metro');
		expect(text).toContain('## Other Links');
		expect(text).toContain('- https://example.com/about');
		expect(text).toContain('- https://example.com/faq');
		expect(text).not.toContain('styleguide');
		expect(text).not.toContain('robots.txt');
		expect(text).toContain('## Contact');
		expect(text).toContain('Contact: mailto:hello@example.com');
		expect(text).toMatch(/Generated: \d{4}-\d{2}-\d{2}T/);
	});

	it('normalizes relative route paths', async () => {
		const output = LLMSTxt({});
		const text = await output.text();

		expect(text).toContain('- https://example.com/about');
		expect(text).toContain('- https://example.com/faq');
	});

	it('renders none when services and service areas are missing', async () => {
		fakeConfig.siteInfo.services = undefined;
		fakeConfig.siteInfo.serviceAreas = undefined;
		fakeConfig.routes = [{ path: '/about' }];

		const output = LLMSTxt({});
		const text = await output.text();

		expect(text).toContain('## Services');
		expect(text).toContain('- none');
		expect(text).toContain('## Service Areas');
		expect(text).toContain('- none');
		expect(text).toContain('- https://example.com/about');
	});

	it('filters excluded routes from other links', async () => {
		fakeConfig.routes = [
			{ path: '/about' },
			{ path: '/privacy' },
			{ path: '/terms' },
			{ path: '/sitemap.xml' },
		];

		const output = LLMSTxt({});
		const text = await output.text();

		expect(text).toContain('- https://example.com/about');
		expect(text).not.toContain('- https://example.com/privacy');
		expect(text).not.toContain('- https://example.com/terms');
		expect(text).not.toContain('- https://example.com/sitemap.xml');
	});
});
