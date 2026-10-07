const mockResult = { uptime: { status: 'ok' }, metrics: [] };
vi.mock('@pixelated-tech/components', async (importOriginal) => {
	const actual = await importOriginal();
	return { __esModule: true, ...actual, fetchSiteHealth: async () => mockResult };
});

describe('Site Health Page', () => {
	it('imports the page module', async () => {
		const Page = (await import('@/app/(pages)/site-health/page')).default;
		expect(Page).toBeTruthy();
	});
});
