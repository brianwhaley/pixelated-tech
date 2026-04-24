import { describe, expect, it } from 'vitest';
import siteConfig from '@/app/data/siteconfig.json';

describe('pixelated-template route data', () => {
	it('defines a valid siteInfo block', () => {
		expect(siteConfig.siteInfo).toBeDefined();
		expect(siteConfig.siteInfo.name).toContain('__SITE_NAME__');
		expect(siteConfig.siteInfo.url).toContain('__SITE_URL__');
	});

	it('contains an About route and unique path values', () => {
		const paths = siteConfig.routes.map((route) => route.path);
		expect(paths).toContain('/about');
		expect(new Set(paths).size).toBe(paths.length);
	});
});
