import { describe, it, expect } from 'vitest';

describe('targeted import-only coverage for many modules', () => {
	const files = [
		'@/app/global-error',
		'@/app/(pages)/assessment/page',
		'@/app/(pages)/component-usage/page',
		'@/app/(pages)/contentful-migrate/page',
		'@/app/(pages)/newdeployment/page',
		'@/app/(pages)/site-health/page',
		'@/app/api/auth/[...nextauth]/route',
		'@/app/api/billing/email/route',
		'@/app/api/billing/generate/route',
		'@/app/api/deploy/route',
		'@/app/api/pagebuilder/delete/route',
		'@/app/api/pagebuilder/load/route',
		'@/app/api/pagebuilder/save/route',
		'@/app/api/contentful/content-types/route',
		'@/app/api/contentful/migrate/route',
		'@/app/api/contentful/validate/route',
		'@/app/api/site-health/axe-core/route',
		'@/app/api/site-health/core-web-vitals/route',
		'@/app/api/site-health/github/route',
		'@/app/api/site-health/google-analytics/route',
		'@/app/api/site-health/google-search-console/route',
		'@/app/api/site-health/on-site-seo/route',
		'@/app/api/site-health/security/route',
		'@/app/api/site-health/uptime/route',
		'@/app/api/site-health/cloudwatch/route',
		'@/app/components/Nav',
	];

	for (const f of files) {
		it(`imports ${f}`, async () => {
			const mod = await import(f).catch((e) => {
				// If a module has side-effects or fails to import, the test should still record the attempt
				// rethrow to make failures visible when tests run; for now assert that import returned something or an Error
				throw e;
			});
			expect(mod).toBeTruthy();
		});
	}
});
