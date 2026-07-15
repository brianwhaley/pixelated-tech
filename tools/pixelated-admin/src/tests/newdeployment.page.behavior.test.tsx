import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('@pixelated-tech/components', async (importOriginal) => {
	const actual = await importOriginal();
	return {
		__esModule: true,
		...actual,
		PageSection: ({ children }: any) => <div>{children}</div>,
		Loading: () => <div>Loading</div>,
		FormEngine: ({ children }: any) => <form>{children}</form>,
		ToggleLoading: () => null,
	};
});

describe('New Deployment page', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it('renders deployment page contents', async () => {
		const Page = (await import('@/app/(pages)/newdeployment/page')).default;
		render(<Page />);
		await waitFor(() => expect(screen.getByText('New Deployment')).toBeTruthy());
	});
});
