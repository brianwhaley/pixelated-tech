import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createPageComponentMocks, mockState, resetMockState, setFileDataState, setPixelatedConfigOverride } from '@/test/page-mocks';

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
import ContactPage from '@/app/(pages)/contact/page';
import ServicesPage from '@/app/(pages)/services/page';
import StyleGuidePage from '@/app/(pages)/style-guide/page';
import TermsPage from '@/app/(pages)/terms/page';
import Footer from '@/app/elements/footer';
import Nav from '@/app/elements/nav';


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

	it('renders core pages and components with no site config to exercise alternate branches', async () => {
		setPixelatedConfigOverride(null);
		render(<Home />);
		render(<ServicesPage />);
		render(<StyleGuidePage />);
		render(<TermsPage />);
		render(<Footer />);
		render(<Nav />);

		setPixelatedConfigOverride({
			siteInfo: {
				address: {
					streetAddress: '',
					addressLocality: '',
					addressRegion: '',
					postalCode: '',
				},
				email: 'info@simpledayconcierge.com',
				telephone: '(000) 000-0000',
			},
		});
		render(<ContactPage />);

		await waitFor(() => {
			expect(screen.getAllByText(/Simple Day Concierge/).length).toBeGreaterThan(0);
		});
	});
});
