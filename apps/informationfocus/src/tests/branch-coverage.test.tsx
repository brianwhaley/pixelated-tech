import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createPageComponentMocks, resetMockState } from '@/test/page-mocks';

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
import Resume from '@/app/(pages)/resume/page';
import StyleGuide from '@/app/(pages)/styleguide/page';

describe('InformationFocus branch coverage', () => {
	beforeEach(() => {
		resetMockState();
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('renders the home page and includes section headers', async () => {
		render(<Home />);
		await waitFor(() => expect(screen.getAllByTestId(/mock-/).length).toBeGreaterThan(0));
	});

	it('renders the resume page with resume sections', () => {
		render(<Resume />);
		const resumeSection = screen.getByTestId('mock-pagesection');
		expect(resumeSection).not.toBeNull();
		expect(resumeSection.className).toContain('p-resume');
	});

	it('renders the styleguide page and executes styleguide UI branch', async () => {
		render(<StyleGuide />);
		await waitFor(() => expect(screen.getByTestId('styleguide-ui')).not.toBeNull());
	});
});
