import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createPageComponentMocks, mockState, resetMockState, setFileDataState } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', async () => {
	const actual = await vi.importActual<typeof import('@pixelated-tech/components')>('@pixelated-tech/components');
	return {
		__esModule: true,
		...actual,
		...createPageComponentMocks(),
	};
});

vi.mock('next/headers', () => ({
	headers: vi.fn(async () => new Headers({ 'x-path': '/', 'x-origin': 'https://example.com', 'x-url': 'https://example.com/' })),
}));

vi.mock('next/server', () => ({
	NextResponse: {
		next: (options: any) => options,
	},
}));

import Home from '@/app/(pages)/(home)/page';
import BlogCalendar from '@/app/(pages)/blogcalendar/page';
import Gallery from '@/app/(pages)/gallery/page';

describe('Manning Metalworks branch coverage', () => {
	beforeEach(() => {
		resetMockState();
		setFileDataState(null);
		mockState.wordpressPosts = [{ id: 1, title: 'Manning blog post' }];
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('renders the home page and includes homepage sections', async () => {
		render(<Home />);
		await waitFor(() => expect(screen.getAllByTestId(/mock-/).length).toBeGreaterThan(0));
	});

	it('renders gallery page and includes gallery data', async () => {
		render(<Gallery />);
		await waitFor(() => expect(screen.getAllByTestId(/mock-/).length).toBeGreaterThan(0));
	});

	it('renders blogcalendar error and success branches', async () => {
		setFileDataState({ data: 'calendar content', loading: false, error: null });
		render(<BlogCalendar />);
		await waitFor(() => expect(screen.getByTestId('mock-markdown')).not.toBeNull());

		setFileDataState({ data: null, loading: false, error: 'Cannot load calendar' });
		render(<BlogCalendar />);
		await waitFor(() => expect(screen.getByText('Error: Cannot load calendar')).not.toBeNull());
	});
});
