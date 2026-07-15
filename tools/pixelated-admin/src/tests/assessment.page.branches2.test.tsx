import { render, waitFor } from '@testing-library/react';

// Provide controlled smartFetch responses to exercise conditional branches
vi.mock('@pixelated-tech/components', async (importOriginal) => {
	const actual = await importOriginal();
	let call = 0;
	return {
		...actual,
		useFileData: () => ({ data: [{ name: 'a.json', file: '/data/assessment/a.json' }], loading: false, error: null }),
		smartFetch: async () => {
			call += 1;
			if (call === 1) {
				return {
					companyName: 'LogoCo',
					title: 'Assessment with logo',
					brand: { logo: '/logo.png' },
					existingSite: null,
					marketOverview: ['one'],
					competitors: [],
				};
			}
			return {
				companyName: 'NoLogo',
				title: 'Assessment without logo',
				brand: {},
				existingSite: { url: 'http://x' },
				marketOverview: 'overview text',
				competitors: [{ name: 'c' }],
			};
		},
	};
});

describe('Assessment page additional branches', () => {
	it('renders when brand.logo exists', async () => {
		const Page = (await import('@/app/(pages)/assessment/page')).default;
		const { container } = render(<Page />);
		await waitFor(() => expect(container.querySelector('#selection-section')).toBeTruthy());
	});

	it('renders when marketOverview is string and competitors lack url', async () => {
		const Page = (await import('@/app/(pages)/assessment/page')).default;
		const { container } = render(<Page />);
		await waitFor(() => expect(container.querySelector('#selection-section')).toBeTruthy());
	});
});
