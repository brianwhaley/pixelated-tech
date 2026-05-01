import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks, mockState, resetMockState } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import BlogcalendarPage from '@/app/(pages)/blogcalendar/page';

describe('Blog Calendar page', () => {
	beforeEach(() => {
		resetMockState();
		vi.clearAllMocks();
	});

	it('renders the markdown container', () => {
		render(<BlogcalendarPage />);
		expect(screen.getByTestId('mock-pagesection')).toBeInTheDocument();
		expect(screen.getByTestId('mock-markdown')).toBeInTheDocument();
	});

	it('renders the loading state when file data is loading', () => {
		mockState.fileData = { data: null, loading: true, error: null };
		render(<BlogcalendarPage />);
		expect(screen.getByText('Loading...')).toBeInTheDocument();
	});

	it('renders the error state when file data fails', () => {
		mockState.fileData = { data: null, loading: false, error: 'Failed to load' };
		render(<BlogcalendarPage />);
		expect(screen.getByText('Error: Failed to load')).toBeInTheDocument();
	});

	it('renders empty markdown fallback when file data is null with no error', () => {
		mockState.fileData = { data: null, loading: false, error: null };
		render(<BlogcalendarPage />);
		expect(screen.getByTestId('mock-markdown')).toHaveTextContent('');
	});
});
