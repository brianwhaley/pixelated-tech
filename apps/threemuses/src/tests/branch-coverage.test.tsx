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
import Events from '@/app/(pages)/events/page';
import BlogCalendar from '@/app/(pages)/blog-calendar/page';

describe('ThreeMuses branch coverage', () => {
	beforeEach(() => {
		resetMockState();
		setFileDataState(null);
		mockState.wordpressPosts = [{ id: 1, title: 'ThreeMuses blog post' }];
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('renders home page and includes mocked homepage content', async () => {
		render(<Home />);
		await waitFor(() => expect(screen.getAllByTestId(/mock-/).length).toBeGreaterThan(0));
	});

	it('renders events page and exercises event branch', async () => {
		render(<Events />);
		await waitFor(() => expect(screen.getAllByTestId(/mock-/).length).toBeGreaterThan(0));
	});

	it('renders blog calendar and blog post list', async () => {
		render(<BlogCalendar />);
		await waitFor(() => expect(screen.getByTestId('mock-blogpostlist')).not.toBeNull());
	});
});
