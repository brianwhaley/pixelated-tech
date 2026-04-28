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
import Projects from '@/app/(pages)/projects/page';

describe('Palmetto Epoxy branch coverage', () => {
	beforeEach(() => {
		resetMockState();
		setFileDataState(null);
		mockState.wordpressPosts = [{ id: 1, title: 'Epoxy blog post' }];
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('renders the home page and includes home content', async () => {
		render(<Home />);
		await waitFor(() => expect(screen.getAllByTestId(/mock-/).length).toBeGreaterThan(0));
	});

	it('renders projects page and includes project list content', async () => {
		render(<Projects />);
		await waitFor(() => expect(screen.getAllByTestId(/mock-/).length).toBeGreaterThan(0));
	});

	it('renders blogcalendar error branch when file data load fails', async () => {
		setFileDataState({ data: null, loading: false, error: 'Calendar load failed' });
		render(<BlogCalendar />);
		await waitFor(() => expect(screen.getByText('Error: Calendar load failed')).not.toBeNull());
	});
});
