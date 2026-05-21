import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks, mockState, resetMockState } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import BlogCalendar from '@/app/(pages)/blogcalendar/page';

describe('Blog Calendar page', () => {
	beforeEach(() => {
		resetMockState();
		vi.clearAllMocks();
	});

	it('renders the calendar markdown content', () => {
		mockState.fileData = { data: 'Calendar content', loading: false, error: null };
		render(<BlogCalendar />);
		expect(screen.getByTestId('markdown')).toHaveTextContent('Calendar content');
	});

	it('renders the loading state', () => {
		mockState.fileData = { data: null, loading: true, error: null };
		render(<BlogCalendar />);
		expect(screen.getByText('Loading...')).toBeInTheDocument();
	});

	it('renders the error state', () => {
		mockState.fileData = { data: null, loading: false, error: 'Failed' };
		render(<BlogCalendar />);
		expect(screen.getByText('Error: Failed')).toBeInTheDocument();
	});

	it('renders the calendar page with empty markdown content fallback', () => {
		mockState.fileData = { data: '', loading: false, error: null };
		render(<BlogCalendar />);
		expect(screen.getByTestId('markdown')).toBeInTheDocument();
	});
});
