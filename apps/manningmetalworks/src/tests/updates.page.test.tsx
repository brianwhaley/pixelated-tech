import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks, mockState, resetMockState } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import UpdatesPage from '@/app/(pages)/updates/page';

describe('Updates page', () => {
	beforeEach(() => {
		resetMockState();
		vi.clearAllMocks();
	});

	it('renders the markdown container', () => {
		render(<UpdatesPage />);
		expect(screen.getByTestId('mock-pagesection')).toBeInTheDocument();
		expect(screen.getByTestId('mock-markdown')).toBeInTheDocument();
	});

	it('renders the loading state when file data is loading', () => {
		mockState.fileData = { data: null, loading: true, error: null };
		render(<UpdatesPage />);
		expect(screen.getByText('Loading...')).toBeInTheDocument();
	});

	it('renders the error state when file data fails', () => {
		mockState.fileData = { data: null, loading: false, error: 'Failed to load' };
		render(<UpdatesPage />);
		expect(screen.getByText('Error: Failed to load')).toBeInTheDocument();
	});
});
