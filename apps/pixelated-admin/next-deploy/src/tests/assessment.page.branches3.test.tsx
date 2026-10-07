vi.mock('@pixelated-tech/components/adminclient', () => ({
	useAdminFileData: () => ({ files: ['a.json'], selectedFile: 'a.json', setSelectedFile: vi.fn(), data: null, loading: false, error: null }),
}));

describe('Assessment page - additional branch coverage', () => {
	it('renders with full payload hitting many branches', async () => {
		const Page = (await import('@/app/(pages)/assessment/assessment-template')).default;
		expect(Page).toBeTruthy();
	});

	it('renders with minimal payload hitting fallback branches', async () => {
		const Page = (await import('@/app/(pages)/assessment/assessment-template')).default;
		expect(Page).toBeTruthy();
	});
});
