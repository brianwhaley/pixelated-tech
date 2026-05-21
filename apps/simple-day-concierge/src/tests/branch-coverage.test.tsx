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
import Podcast from '@/app/(pages)/podcast/page';

describe('Pixelated Template branch coverage', () => {
	beforeEach(() => {
		resetMockState();
		setFileDataState(null);
		mockState.wordpressPosts = [{ id: 1, title: 'Hello Template' }];
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('renders home page and includes mock content', async () => {
		render(<Home />);
		await waitFor(() => expect(screen.getAllByTestId(/mock-/).length).toBeGreaterThan(0));
	});

	it('renders blogcalendar success branch', async () => {
		setFileDataState({ data: 'blog calendar content', loading: false, error: null });
		render(<BlogCalendar />);
		await waitFor(() => expect(screen.getByTestId('markdown')).toBeInTheDocument());
	});

	it('renders podcast page and shows podcast schema branch', async () => {
		render(<Podcast />);
		await waitFor(() => expect(screen.getByTestId('schema-podcast-series')).toBeInTheDocument());
	});
});
