import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks, resetFileDataState, setFileDataState } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import AdCalendarPage from '@/app/(pages)/adcalendar/page';

describe('Palmetto Epoxy ad calendar page', () => {
	afterEach(() => {
		resetFileDataState();
	});

	it('renders loading state when file is loading', () => {
		setFileDataState({ data: null, loading: true, error: null });
		render(<AdCalendarPage />);
		expect(screen.getByText('Loading...')).toBeTruthy();
	});

	it('renders an error state when read fails', () => {
		setFileDataState({ data: null, loading: false, error: 'File missing' });
		render(<AdCalendarPage />);
		expect(screen.getByText('Error: File missing')).toBeTruthy();
	});

	it('renders markdown content when data is present', () => {
		setFileDataState({ data: 'Ad calendar details', loading: false, error: null });
		render(<AdCalendarPage />);
		expect(screen.getByTestId('mock-markdown').textContent).toContain('Ad calendar details');
	});

	it('renders empty markdown when read succeeds with no data', () => {
		setFileDataState({ data: null, loading: false, error: null });
		render(<AdCalendarPage />);
		expect(screen.getByTestId('mock-markdown').textContent).toBe('');
	});
});
