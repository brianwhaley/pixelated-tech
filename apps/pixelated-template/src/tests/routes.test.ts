import { describe, expect, it } from 'vitest';
import { config } from '@/test/page-mocks';

describe('pixelated-template route data', () => {
	it('defines a valid siteInfo block', () => {
		expect(config.siteInfo).toBeDefined();
		expect(config.siteInfo.name).toContain('__SITE_NAME__');
		expect(config.siteInfo.url).toContain('__SITE_URL__');
	});

	it('contains an About route and unique path values', () => {
		const paths = config.routes.map((route: any) => route.path);
		expect(paths).toContain('/about');
		expect(new Set(paths).size).toBe(paths.length);
	});
});
