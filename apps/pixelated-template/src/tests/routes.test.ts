import { describe, expect, it } from 'vitest';
import routesJson from '@/app/data/routes.json';

describe('pixelated-template route data', () => {
	it('defines a valid siteInfo block', () => {
		expect(routesJson.siteInfo).toBeDefined();
		expect(routesJson.siteInfo.name).toContain('__SITE_NAME__');
		expect(routesJson.siteInfo.url).toContain('__SITE_URL__');
	});

	it('contains an About route and unique path values', () => {
		const paths = routesJson.routes.map((route) => route.path);
		expect(paths).toContain('/about');
		expect(new Set(paths).size).toBe(paths.length);
	});
});
