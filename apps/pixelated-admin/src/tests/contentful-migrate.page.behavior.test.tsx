import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mockSmartFetch = vi.fn();

vi.mock('@pixelated-tech/components', async (importOriginal) => {
	const actual = await importOriginal();
	return {
		__esModule: true,
		...actual,
		PageSection: ({ children }: any) => <div>{children}</div>,
		Accordion: ({ children, items }: any) => <div>{children ?? items?.map((item: any) => <div key={item.title}>{item.content}</div>)}</div>,
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

	it('reports source validation errors and target validation errors', async () => {
		mockSmartFetch
			.mockResolvedValueOnce({ ok: true, json: async () => ({ success: false, error: 'source invalid' }) })
			.mockResolvedValueOnce({ ok: true, json: async () => ({ success: false, error: 'target invalid' }) });
		const Page = (await import('@/app/(pages)/contentful-migrate/page')).default;
		render(<Page />);

		fireEvent.change(screen.getByPlaceholderText('Source space ID'), { target: { value: 'source' } });
		fireEvent.change(screen.getByPlaceholderText('Source management access token'), { target: { value: 'source-token' } });
		fireEvent.change(screen.getByPlaceholderText('Target space ID'), { target: { value: 'target' } });
		fireEvent.change(screen.getByPlaceholderText('Target management access token'), { target: { value: 'target-token' } });
		fireEvent.click(screen.getByRole('button', { name: /Validate & Load Content Types/i }));

		await waitFor(() => expect(screen.getByText(/One or both spaces failed validation/i)).toBeInTheDocument());
	});

	it('loads content types and reports migration failure', async () => {
		mockSmartFetch
			.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
			.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
			.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: [{ sys: { id: 'type-a', type: 'ContentType' }, name: 'Type A', fields: [], description: 'A type' }] }) })
			.mockResolvedValueOnce({ ok: true, json: async () => ({ success: false, error: 'migration failed' }) });
		const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
		const Page = (await import('@/app/(pages)/contentful-migrate/page')).default;
		render(<Page />);

		fireEvent.change(screen.getByPlaceholderText('Source space ID'), { target: { value: 'source' } });
		fireEvent.change(screen.getByPlaceholderText('Source management access token'), { target: { value: 'source-token' } });
		fireEvent.change(screen.getByPlaceholderText('Target space ID'), { target: { value: 'target' } });
		fireEvent.change(screen.getByPlaceholderText('Target management access token'), { target: { value: 'target-token' } });
		fireEvent.click(screen.getByRole('button', { name: /Validate & Load Content Types/i }));
		await waitFor(() => expect(screen.getByText('Type A')).toBeInTheDocument());
		fireEvent.click(screen.getByRole('checkbox', { name: /Type A/ }));
		fireEvent.click(screen.getByRole('button', { name: 'Migrate 1 Content Type' }));

		await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Migration failed for Type A: migration failed'));
	});

	it('reports credential validation exceptions', async () => {
		mockSmartFetch
			.mockRejectedValueOnce(new Error('network failure'))
			.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });
		const Page = (await import('@/app/(pages)/contentful-migrate/page')).default;
		render(<Page />);

		fireEvent.change(screen.getByPlaceholderText('Source space ID'), { target: { value: 'source' } });
		fireEvent.change(screen.getByPlaceholderText('Source management access token'), { target: { value: 'source-token' } });
		fireEvent.change(screen.getByPlaceholderText('Target space ID'), { target: { value: 'target' } });
		fireEvent.change(screen.getByPlaceholderText('Target management access token'), { target: { value: 'target-token' } });
		fireEvent.click(screen.getByRole('button', { name: /Validate & Load Content Types/i }));

		await waitFor(() => expect(screen.getByText(/One or both spaces failed validation/i)).toBeInTheDocument());
	});

	it('alerts when loading content types fails', async () => {
		mockSmartFetch
			.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
			.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
			.mockResolvedValueOnce({ ok: true, json: async () => ({ success: false, error: 'types unavailable' }) });
		const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
		const Page = (await import('@/app/(pages)/contentful-migrate/page')).default;
		render(<Page />);

		fireEvent.change(screen.getByPlaceholderText('Source space ID'), { target: { value: 'source' } });
		fireEvent.change(screen.getByPlaceholderText('Source management access token'), { target: { value: 'source-token' } });
		fireEvent.change(screen.getByPlaceholderText('Target space ID'), { target: { value: 'target' } });
		fireEvent.change(screen.getByPlaceholderText('Target management access token'), { target: { value: 'target-token' } });
		fireEvent.click(screen.getByRole('button', { name: /Validate & Load Content Types/i }));

		await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Error loading content types: types unavailable'));
	});
});
