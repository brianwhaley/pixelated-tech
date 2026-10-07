import { describe, it, expect } from 'vitest';

describe('remaining page modules (import-only)', () => {
	const modules = [
		'@/app/(pages)/component-usage/page',
		'@/app/(pages)/proposal/page',
		'@/app/(pages)/billing/invoice/[siteName]/[billingCycle]/layout',
		'@/app/(pages)/assessment/page',
	];

	for (const m of modules) {
		it(`imports ${m}`, async () => {
			const mod = await import(m);
			expect(mod).toBeTruthy();
		});
	}
});
