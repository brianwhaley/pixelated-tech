import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks, mockState, resetMockState } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import Updates from '@/app/(pages)/updates/page';

describe('Updates page', () => {
	beforeEach(() => {
		resetMockState();
		vi.clearAllMocks();
	});

	it('renders the updates page with markdown content', () => {
		mockState.fileData = { data: 'Updates content', loading: false, error: null };
		render(<Updates />);
		expect(screen.getByTestId('markdown')).toHaveTextContent('Updates content');
	});

	it('renders the updates page loading state', () => {
		mockState.fileData = { data: null, loading: true, error: null };
		render(<Updates />);
		expect(screen.getByText('Loading...')).toBeInTheDocument();
	});

	it('renders the updates page error state', () => {
		mockState.fileData = { data: null, loading: false, error: 'Failed' };
		render(<Updates />);
		expect(screen.getByText('Error: Failed')).toBeInTheDocument();
	});

	it('renders the updates page with empty markdown content fallback', () => {
		mockState.fileData = { data: '', loading: false, error: null };
		render(<Updates />);
		expect(screen.getByTestId('markdown')).toBeInTheDocument();
	});
});
