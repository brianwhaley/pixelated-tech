vi.mock('@pixelated-tech/components', async (importOriginal) => {
	const actual = await importOriginal();
	return {
		...actual,
		needsMigration: () => false,
	};
});

describe('Contentful migrate branches', () => {
	it('imports when no migration needed', async () => {
		const Page = (await import('@/app/(pages)/contentful-migrate/page')).default;
		expect(Page).toBeTruthy();
	});
});
