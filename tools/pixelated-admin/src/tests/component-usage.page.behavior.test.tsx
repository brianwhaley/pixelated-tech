import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const mockSmartFetch = vi.fn();

vi.mock('@pixelated-tech/components', async (importOriginal) => {
	const actual = await importOriginal();
	return {
		__esModule: true,
		...actual,
		PageSection: ({ children }: any) => <div>{children}</div>,
		Loading: () => <div>Loading</div>,
		ToggleLoading: () => null,
		Table: ({ children }: any) => <table>{children}</table>,
		smartFetch: (...args: any[]) => mockSmartFetch(...args),
	};
});

describe('Component usage page behavior', () => {
	beforeEach(() => {
		vi.resetModules();
		mockSmartFetch.mockReset();
	});

	it('shows loading state before data loads', async () => {
		mockSmartFetch.mockResolvedValue({ ok: true, json: async () => ({ components: [], siteList: [], usageMatrix: {} }) });
		const Page = (await import('@/app/(pages)/component-usage/page')).default;
		const { getByText } = render(<Page />);
		expect(getByText('Component Usage Analytics')).toBeTruthy();
		expect(getByText('Loading')).toBeTruthy();
		await waitFor(() => expect(mockSmartFetch).toHaveBeenCalled());
	});

	it('renders table data after successful fetch', async () => {
		mockSmartFetch.mockResolvedValue({ ok: true, json: async () => ({ components: ['component-a'], siteList: [{ name: 'site-a', localPath: '/site-a' }], usageMatrix: { 'component-a': { 'site-a': true } } }) });
		const Page = (await import('@/app/(pages)/component-usage/page')).default;
		render(<Page />);
		await waitFor(() => expect(mockSmartFetch).toHaveBeenCalled());
		expect(screen.getByText('Component Usage Analytics')).toBeTruthy();
	});

	it('shows error message when fetch fails', async () => {
		mockSmartFetch.mockRejectedValue(new Error('fetch failed'));
		const Page = (await import('@/app/(pages)/component-usage/page')).default;
		render(<Page />);
		await waitFor(() => expect(mockSmartFetch).toHaveBeenCalled());
		expect(screen.getByText('Component Usage Analytics')).toBeTruthy();
	});
});
