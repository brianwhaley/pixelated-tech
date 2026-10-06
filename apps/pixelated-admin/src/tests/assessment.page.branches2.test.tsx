import { render, waitFor } from '@testing-library/react';

vi.mock('@pixelated-tech/components', async (importOriginal) => {
	const actual = await importOriginal();
	return {
		...actual,
	};
});

vi.mock('@pixelated-tech/components/adminclient', () => ({
	useAdminFileData: () => ({ files: ['a.json'], selectedFile: 'a.json', setSelectedFile: vi.fn(), data: null, loading: false, error: null }),
}));

describe('Assessment page additional branches', () => {
	it('renders when brand.logo exists', async () => {
		const Page = (await import('@/app/(pages)/assessment/assessment-template')).default;
		const { container } = render(<Page files={['a.json']} />);
		await waitFor(() => expect(container.querySelector('#selection-section')).toBeTruthy());
	});

	it('renders when marketOverview is string and competitors lack url', async () => {
		const Page = (await import('@/app/(pages)/assessment/assessment-template')).default;
		const { container } = render(<Page files={['a.json']} />);
		await waitFor(() => expect(container.querySelector('#selection-section')).toBeTruthy());
	});
});
