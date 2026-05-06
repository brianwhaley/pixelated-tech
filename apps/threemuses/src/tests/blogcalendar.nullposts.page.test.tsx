import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createPageComponentMocks, resetMockState, setFileDataState } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import BlogCalendarPage from '@/app/(pages)/blogcalendar/page';

describe('Blog calendar page', () => {
	beforeEach(() => {
		resetMockState();
		setFileDataState(null);
	});

	it('renders the markdown section for the blog calendar', async () => {
		render(<BlogCalendarPage />);
		await waitFor(() => expect(screen.getByTestId('mock-markdown')).toBeTruthy());
		expect(screen.getByTestId('mock-pagesection')).toBeTruthy();
	});

	it('renders the loading state when file data is still loading', async () => {
		setFileDataState({ data: null, loading: true, error: null });

		render(<BlogCalendarPage />);
		await waitFor(() => expect(screen.getByText('Loading...')).toBeTruthy());
	});

	it('renders the error state when the markdown file cannot be read', async () => {
		setFileDataState({ data: null, loading: false, error: 'File missing' });

		render(<BlogCalendarPage />);
		await waitFor(() => expect(screen.getByText('Error: File missing')).toBeTruthy());
	});
});
