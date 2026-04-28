import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createPageComponentMocks, resetFileDataState, setFileDataState } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import UpdatesPage from '@/app/(pages)/updates/page';

describe('Updates page', () => {
	beforeEach(() => {
		resetFileDataState();
	});

	it('renders loading message when file data is loading', async () => {
		setFileDataState({ data: null, loading: true, error: null });
		render(<UpdatesPage />);
		await waitFor(() => expect(screen.getByText('Loading...')).toBeTruthy());
	});

	it('renders the markdown component when no file data is available', async () => {
		setFileDataState({ data: null, loading: false, error: null });
		render(<UpdatesPage />);
		await waitFor(() => expect(screen.getByTestId('mock-markdown')).toBeTruthy());
	});

	it('renders an error message when file data fails to load', async () => {
		setFileDataState({ data: null, loading: false, error: 'Failed to load updates' });
		render(<UpdatesPage />);
		await waitFor(() => expect(screen.getByText(/Error:/)).toBeTruthy());
	});
});
