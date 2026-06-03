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
		await waitFor(() => {
			const elements = screen.getAllByTestId(/.+/);
			const mockElements = elements.filter(el => 
				el.getAttribute('data-testid')?.includes('callout') || 
				el.getAttribute('data-testid')?.includes('page-section') ||
				el.getAttribute('data-testid')?.includes('smart-image')
			);
			expect(mockElements.length).toBeGreaterThan(0);
		});
	});
});
