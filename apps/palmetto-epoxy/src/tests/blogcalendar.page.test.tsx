import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks, resetFileDataState, setFileDataState } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import BlogCalendarPage from '@/app/(pages)/blogcalendar/page';

describe('Palmetto Epoxy blog calendar page', () => {
	afterEach(() => {
		resetFileDataState();
	});

	it('renders loading state when file is still loading', () => {
		setFileDataState({ data: null, loading: true, error: null });
		render(<BlogCalendarPage />);
		expect(screen.getByText('Loading...')).toBeTruthy();
	});

	it('renders an error state when file reading fails', () => {
		setFileDataState({ data: null, loading: false, error: 'Markdown error' });
		render(<BlogCalendarPage />);
		expect(screen.getByText('Error: Markdown error')).toBeTruthy();
	});

	it('renders markdown content when file data is available', () => {
		setFileDataState({ data: 'Blog calendar content', loading: false, error: null });
		render(<BlogCalendarPage />);
		expect(screen.getByTestId('mock-markdown').textContent).toContain('Blog calendar content');
	});

	it('renders empty markdown when read succeeds with no data', () => {
		setFileDataState({ data: null, loading: false, error: null });
		render(<BlogCalendarPage />);
		expect(screen.getByTestId('mock-markdown').textContent).toBe('');
	});
});
