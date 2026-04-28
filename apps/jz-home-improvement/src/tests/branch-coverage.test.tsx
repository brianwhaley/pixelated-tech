import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createPageComponentMocks, mockState, resetMockState } from '@/test/page-mocks';

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
import Projects from '@/app/(pages)/projects/page';
import Services from '@/app/(pages)/services/page';

describe('JZ Home Improvement branch coverage', () => {
	beforeEach(() => {
		resetMockState();
		mockState.wordpressPosts = [{ id: 1, title: 'JZ blog post' }];
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('renders home page and includes mocked homepage content', async () => {
		render(<Home />);
		await waitFor(() => expect(screen.getAllByTestId(/mock-/).length).toBeGreaterThan(0));
	});

	it('renders projects page and exercises project content', async () => {
		const projectsPage = await Projects();
		render(projectsPage);
		await waitFor(() => expect(screen.getByTestId('mock-projectsclient')).not.toBeNull());
	});

	it('renders services page and exercises services section', async () => {
		render(<Services />);
		await waitFor(() => expect(screen.getAllByTestId(/mock-/).length).toBeGreaterThan(0));
	});
});
