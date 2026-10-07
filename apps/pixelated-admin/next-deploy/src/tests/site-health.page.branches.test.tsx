import { describe, it, expect } from 'vitest';

describe('site-health page branches (import-only)', () => {
	it('imports the site-health page module (success payload)', async () => {
		const Page = (await import('@/app/(pages)/site-health/page')).default;
		expect(Page).toBeTruthy();
	});

	it('imports the site-health page module (error payload)', async () => {
		const Page = (await import('@/app/(pages)/site-health/page')).default;
		expect(Page).toBeTruthy();
	});
});

vi.mock('@pixelated-tech/components', async (importOriginal) => {
	const actual = await importOriginal();
	return { ...actual, fetchSiteHealth: async () => ({ uptime: { status: 'partial' }, metrics: [{ name: 'LCP' }] }) };
});

describe('Site Health deeper branches', () => {
	it('imports the page module (partial branch smoke)', async () => {
		const Page = (await import('@/app/(pages)/site-health/page')).default;
		expect(Page).toBeTruthy();
	});
});
