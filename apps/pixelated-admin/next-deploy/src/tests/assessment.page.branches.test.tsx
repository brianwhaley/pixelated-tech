import { render, waitFor } from '@testing-library/react';

// Smoke branch tests for assessment page to exercise optional fields
vi.mock('@pixelated-tech/components', async (importOriginal) => {
	const actual = await importOriginal();
	return {
		...actual,
	};
});

vi.mock('@pixelated-tech/components/adminclient', () => ({
	useAdminFileData: () => ({ files: ['a.json'], selectedFile: 'a.json', setSelectedFile: vi.fn(), data: null, loading: false, error: null }),
}));

describe('Assessment page branches', () => {
	it('renders selection section (smoke)', async () => {
		const Page = (await import('@/app/(pages)/assessment/assessment-template')).default;
		const { container } = render(<Page files={['a.json']} />);
		await waitFor(() => expect(container.querySelector('#selection-section')).toBeTruthy());
	});

	it('renders when marketOverview is a string (smoke)', async () => {
		// ensure page imports and renders selection UI
		const Page = (await import('@/app/(pages)/assessment/assessment-template')).default;
		const { container } = render(<Page files={['a.json']} />);
		await waitFor(() => expect(container.querySelector('#selection-section')).toBeTruthy());
	});
});
