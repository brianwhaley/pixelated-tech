import { describe, it, expect } from 'vitest';

describe('site-health api route modules (import-only)', () => {
	const routes = [
		'@/app/api/site-health/core-web-vitals/route',
		'@/app/api/site-health/cloudwatch/route',
		'@/app/api/site-health/google-search-console/route',
	];

	for (const r of routes) {
		it(`imports ${r}`, async () => {
			const mod = await import(r);
			expect(mod).toBeTruthy();
		});
	}
});
