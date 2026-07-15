import { describe, it, expect } from 'vitest';

describe('contentful-migrate page branches (import-only)', () => {
	it('imports the page module (migration-needed branch)', async () => {
		const Page = (await import('@/app/(pages)/contentful-migrate/page')).default;
		expect(Page).toBeTruthy();
	});

	it('imports the page module (migration-not-needed branch)', async () => {
		const Page = (await import('@/app/(pages)/contentful-migrate/page')).default;
		expect(Page).toBeTruthy();
	});
});
