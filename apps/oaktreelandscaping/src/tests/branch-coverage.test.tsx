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
import Prospects from '@/app/(pages)/prospects/page';
import BlogCalendar from '@/app/(pages)/blogcalendar/page';

describe('Oak Tree Landscaping branch coverage', () => {
	beforeEach(() => {
		resetMockState();
		setFileDataState(null);
		mockState.wordpressPosts = [{ id: 1, title: 'Oak Tree Blog Post' }];
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('renders home page with homepage sections', async () => {
		render(<Home />);
		await waitFor(() => expect(screen.getAllByTestId(/mock-/).length).toBeGreaterThan(0));
	});

	it('renders prospects page and exercises prospect content branch', async () => {
		render(<Prospects />);
		await waitFor(() => expect(screen.getAllByTestId(/mock-/).length).toBeGreaterThan(0));
	});

	it('renders blogcalendar success and error branches', async () => {
		setFileDataState({ data: 'calendar content', loading: false, error: null });
		render(<BlogCalendar />);
		await waitFor(() => expect(screen.getByTestId('mock-markdown')).not.toBeNull());

		setFileDataState({ data: null, loading: false, error: 'Calendar failed' });
		render(<BlogCalendar />);
		await waitFor(() => expect(screen.getByText('Error: Calendar failed')).not.toBeNull());
	});
});
