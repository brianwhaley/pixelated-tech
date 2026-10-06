import { render } from '@testing-library/react';
import GlobalError from '@/app/global-error';

vi.mock('@pixelated-tech/components', async (importOriginal) => {
	const actual = await importOriginal();
	return {
		...actual,
		usePixelatedConfig: () => ({ siteInfo: { title: 'X' } }),
		GlobalErrorUI: ({ reset, siteInfo }: any) => (
			<div>
				<div>Something went wrong</div>
				<button onClick={() => reset && reset()}>Try again</button>
				<div>{siteInfo?.title}</div>
			</div>
		),
	};
});

describe('GlobalError', () => {
	it('renders generic error UI', () => {
		const { getByText } = render(<GlobalError error={new Error('boom')} /> as any);
		expect(getByText('Something went wrong')).toBeTruthy();
	});

	it('renders reset button when provided', () => {
		const reset = vi.fn();
		const { getByText } = render(<GlobalError error={new Error('boom')} reset={reset} /> as any);
		const btn = getByText('Try again');
		expect(btn).toBeTruthy();
	});
});
