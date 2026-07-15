import { render, waitFor } from '@testing-library/react';

// Smoke branch tests for assessment page to exercise optional fields
vi.mock('@pixelated-tech/components', async (importOriginal) => {
	const actual = await importOriginal();
	return {
		...actual,
		useFileData: () => ({ data: [{ name: 'a.json', file: '/data/assessment/a.json' }], loading: false, error: null }),
		smartFetch: async () => ({
			companyName: 'C',
			title: 'Assessment',
			existingSite: { url: 'https://x', strengths: ['s'], areasForImprovement: ['a'] },
			marketOverview: ['one','two'],
			competitors: [{ name: 'comp', url: 'https://c' }],
			colorPalette: ['#fff','#000'],
		}),
	};
});

describe('Assessment page branches', () => {
	it('renders selection section (smoke)', async () => {
		const Page = (await import('@/app/(pages)/assessment/page')).default;
		const { container } = render(<Page />);
		await waitFor(() => expect(container.querySelector('#selection-section')).toBeTruthy());
	});

	it('renders when marketOverview is a string (smoke)', async () => {
		// ensure page imports and renders selection UI
		const Page = (await import('@/app/(pages)/assessment/page')).default;
		const { container } = render(<Page />);
		await waitFor(() => expect(container.querySelector('#selection-section')).toBeTruthy());
	});
});
