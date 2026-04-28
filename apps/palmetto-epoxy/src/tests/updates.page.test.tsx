import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks, resetFileDataState, setFileDataState } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import UpdatesPage from '@/app/(pages)/updates/page';

describe('Palmetto Epoxy updates page', () => {
	afterEach(() => {
		resetFileDataState();
	});

	it('renders loading state when file is still loading', () => {
		setFileDataState({ data: null, loading: true, error: null });
		render(<UpdatesPage />);
		expect(screen.getByText('Loading...')).toBeTruthy();
	});

	it('renders an error state when file reading fails', () => {
		setFileDataState({ data: null, loading: false, error: 'Read failure' });
		render(<UpdatesPage />);
		expect(screen.getByText('Error: Read failure')).toBeTruthy();
	});

	it('renders markdown content when file data is available', () => {
		setFileDataState({ data: 'Update content', loading: false, error: null });
		render(<UpdatesPage />);
		expect(screen.getByTestId('mock-markdown').textContent).toContain('Update content');
	});

	it('renders empty markdown when read succeeds with no data', () => {
		setFileDataState({ data: null, loading: false, error: null });
		render(<UpdatesPage />);
		expect(screen.getByTestId('mock-markdown').textContent).toBe('');
	});
});
