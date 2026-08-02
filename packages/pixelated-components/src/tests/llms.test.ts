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

import { AITxt, LLMSTxt, LLMSFullTxt } from '../components/foundation/llms';

describe('LLMSTxt', () => {
	beforeEach(() => {
		fakeConfig = createFakeConfig();
	});
	it('generates markdown with services, service areas, other links, contact, and generated metadata', async () => {
		const output = await LLMSTxt({});
		const text = await output.text();

		expect(text).toContain('# Test Site');
		expect(text).toContain('> Test Site');
		expect(text).toContain('## Services');
		expect(text).toContain('- [Web Design](https://example.com/services/web-design)');
		expect(text).toContain('## Service Areas');
		expect(text).toContain('- [Metro](https://example.com/service-areas/metro)');
		expect(text).toContain('## Page Links');
		expect(text).toContain('- [https://example.com/about](https://example.com/about)');
		expect(text).toContain('- [https://example.com/faq](https://example.com/faq)');
		expect(text).toContain('- [https://example.com/styleguide](https://example.com/styleguide)');
		expect(text).toContain('- [https://example.com/robots.txt](https://example.com/robots.txt)');
		expect(text).toContain('## Contact');
		expect(text).toContain('Contact: mailto:hello@example.com');
		expect(text).toMatch(/Generated: \d{4}-\d{2}-\d{2}T/);
	});

	it('normalizes relative route paths', async () => {
		const output = await LLMSTxt({});
		const text = await output.text();

		expect(text).toContain('- [https://example.com/about](https://example.com/about)');
		expect(text).toContain('- [https://example.com/faq](https://example.com/faq)');
	});

	it('renders none when services and service areas are missing', async () => {
		fakeConfig.siteInfo.services = undefined;
		fakeConfig.siteInfo.serviceAreas = undefined;
		fakeConfig.routes = [{ path: '/about' }];

		const output = await LLMSTxt({});
		const text = await output.text();

		expect(text).toContain('## Services');
		expect(text).toContain('- none');
		expect(text).toContain('## Service Areas');
		expect(text).toContain('- none');
		expect(text).toContain('- [https://example.com/about](https://example.com/about)');
	});

	it('filters excluded routes from other links', async () => {
		fakeConfig.routes = [
			{ path: '/about' },
			{ path: '/privacy' },
			{ path: '/terms' },
			{ path: '/sitemap.xml' },
		];

		const output = await LLMSTxt({});
		const text = await output.text();

		expect(text).toContain('- [https://example.com/about](https://example.com/about)');
		expect(text).not.toContain('- https://example.com/privacy');
		expect(text).not.toContain('- https://example.com/terms');
		expect(text).not.toContain('- https://example.com/sitemap.xml');
	});
});

describe('LLMSFullTxt', () => {
	beforeEach(() => {
		fakeConfig = createFakeConfig();
	});

	it('renders full service description from config', async () => {
		fakeConfig.siteInfo.services = [
			{ name: 'Web Design', slug: 'web-design', description: ['Full service description line 1.', 'Full service description line 2.'] },
		];

		const output = await LLMSFullTxt({});
		const text = await output.text();

		expect(text).toContain('## Services');
		expect(text).toContain('- [Web Design](https://example.com/services/web-design): Full service description line 1. Full service description line 2.');
	});

	it('renders full service area description and highlights from config', async () => {
		fakeConfig.siteInfo.serviceAreas = [
			{ name: 'Metro', slug: 'metro', path: '/service-areas/metro', description: ['Full area description.'], highlights: ['Fast', 'Local'] },
		];

		const output = await LLMSFullTxt({});
		const text = await output.text();

		expect(text).toContain('## Service Areas');
		expect(text).toContain('- [Metro](https://example.com/service-areas/metro): Full area description.');
		expect(text).toContain('Highlights:');
		expect(text).toContain('- Fast');
		expect(text).toContain('- Local');
	});
});

describe('AITxt', () => {
	it('generates ai.txt directives with default policies', async () => {
		const output = await AITxt({});
		const text = await output.text();

		expect(text).toContain('User-agent: *');
		expect(text).toContain('Allow-Train: /');
		expect(text).toContain('Allow-RAG: /');
		expect(text).not.toContain('User-agent: ChatGPTUser');
		expect(text).not.toContain('User-agent: Google-Extended');
		expect(text).not.toContain('User-agent: ClaudeBot');
	});
});
