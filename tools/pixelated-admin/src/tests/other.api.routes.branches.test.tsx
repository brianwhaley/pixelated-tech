import { describe, it, expect } from 'vitest';

describe('other api route modules (import-only)', () => {
	const routes = [
		'@/app/api/auth/[...nextauth]/route',
		'@/app/api/billing/generate/route',
		'@/app/api/billing/email/route',
		'@/app/api/pagebuilder/save/route',
	];

	for (const r of routes) {
		it(`imports ${r}`, async () => {
			const mod = await import(r);
			expect(mod).toBeTruthy();
		});
	}
});
