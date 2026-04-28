import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createPageComponentMocks, resetPixelatedConfigOverride, setPixelatedConfigOverride } from '@/test/page-mocks';
import * as pixelatedComponents from '@pixelated-tech/components';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks({
	getCachedWordPressItems: vi.fn(async () => [
		{
			title: 'Sample Blog Post',
			content: 'Sample content',
		},
	]),
	getContentfulReviewsSchema: vi.fn(async () => [
		{
			rating: 5,
			text: 'Excellent service',
			author_name: 'Test Reviewer',
		},
	]),
	getContentfulEntriesByType: vi.fn(async () => ({
		items: [
			{
				sys: { contentType: { sys: { id: 'reviews' } } },
				fields: {
					description: 'Lovely epoxy finish',
					reviewer: 'Customer',
				},
			},
		],
		includes: { Asset: [] },
	})),
}));

const mockGetCachedWordPressItems = pixelatedComponents.getCachedWordPressItems as ReturnType<typeof vi.fn>;

import HomePage from '@/app/(pages)/(home)/page';

describe('Palmetto Epoxy home page', () => {
	beforeEach(() => {
		resetPixelatedConfigOverride();
		mockGetCachedWordPressItems.mockClear();
	});

	it('renders the home page content and review section', async () => {
		render(<HomePage />);
		await waitFor(() => expect(screen.getByTestId('mock-contentfulreviewscarousel')).toBeTruthy());
		expect(screen.getAllByTestId('mock-callout').length).toBeGreaterThan(0);
	});

	it('navigates to contact and submit review when buttons are clicked', async () => {
		const originalLocation = window.location;
		delete (window as any).location;
		(window as any).location = { href: '' };

		render(<HomePage />);
		const contactButton = screen.getByRole('button', { name: /Schedule an Estimate/i });
		await act(async () => {
			fireEvent.click(contactButton);
		});
		expect(window.location.href).toContain('/contact');

		const reviewButton = screen.getByRole('button', { name: /Submit your Review/i });
		await act(async () => {
			fireEvent.click(reviewButton);
		});
		expect(window.location.href).toContain('/submitreview');

		window.location = originalLocation;
	});

	it('renders the loading fallback when config is unavailable', () => {
		setPixelatedConfigOverride(null);
		render(<HomePage />);
		expect(screen.getByTestId('mock-loading')).toBeTruthy();
	});

	it('renders the Palmetto Epoxy home page with WordPress posts', async () => {
		render(<HomePage />);
		await waitFor(() => expect(screen.getByTestId('mock-blogpostlist')).toBeTruthy());
	});

	it('renders the home page gracefully when no WordPress posts exist', async () => {
		mockGetCachedWordPressItems.mockResolvedValueOnce(null);
		render(<HomePage />);
		await waitFor(() => expect(screen.getByTestId('mock-blogpostlist')).toBeTruthy());
	});

	it('renders the home page gracefully when WordPress posts are undefined', async () => {
		mockGetCachedWordPressItems.mockResolvedValueOnce(undefined);
		render(<HomePage />);
		await waitFor(() => expect(screen.getByTestId('mock-blogpostlist')).toBeTruthy());
	});

	it('renders the home page when contentful config fields are missing', async () => {
		setPixelatedConfigOverride({ contentful: {} });
		render(<HomePage />);
		await waitFor(() => expect(screen.getByTestId('mock-blogpostlist')).toBeTruthy());
	});
});
