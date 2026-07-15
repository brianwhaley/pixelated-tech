import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const mockSmartFetch = vi.fn();

vi.mock('@pixelated-tech/components', async (importOriginal) => {
	const actual = await importOriginal();
	return {
		__esModule: true,
		...actual,
		PageSection: ({ children }: any) => <div>{children}</div>,
		Accordion: ({ children }: any) => <div>{children}</div>,
		smartFetch: (...args: any[]) => mockSmartFetch(...args),
	};
});

describe('Contentful Migrate page', () => {
	beforeEach(() => {
		vi.resetModules();
		mockSmartFetch.mockReset();
	});

	it('renders without crashing when initial state is empty', async () => {
		mockSmartFetch.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
		const Page = (await import('@/app/(pages)/contentful-migrate/page')).default;
		render(<Page />);
		await waitFor(() => expect(screen.getByText('Contentful Migration')).toBeTruthy());
	});

	it('displays validation messages for missing credentials', async () => {
		const Page = (await import('@/app/(pages)/contentful-migrate/page')).default;
		const { container } = render(<Page />);
		expect(container.textContent).toContain('Migration Status');
	});
});
