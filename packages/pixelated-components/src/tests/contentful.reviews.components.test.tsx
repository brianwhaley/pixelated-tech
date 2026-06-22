import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContentfulReviewsCarousel } from '../components/integrations/contentful.reviews.components';
import * as contentfulDelivery from '../components/integrations/contentful.delivery';
import { renderWithProviders } from '../test/test-utils';

vi.mock('../components/structure/carousel', () => ({
	Carousel: ({ cards, draggable, imgFit }: any) => (
		<div data-testid="carousel" data-draggable={String(draggable)} data-imgfit={imgFit}>
			{cards.map((card: any) => card.headerText).join('|')}
		</div>
	),
}));

vi.mock('../components/foundation/schema', () => ({
	ReviewSchema: ({ review }: any) => <div data-testid="reviewschema">{review?.name ?? 'schema'}</div>,
}));

describe('ContentfulReviewsCarousel Component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders loading state while fetching reviews', () => {
		vi.spyOn(contentfulDelivery, 'getContentfulEntriesByType').mockImplementation(
			() => new Promise(() => {})
		);

		renderWithProviders(<ContentfulReviewsCarousel reviewContentType="feedback" itemName="PixelVivid Custom Sunglasses" />);

		expect(screen.getByText('Loading reviews...')).toBeInTheDocument();
	});

	it('renders no reviews when the Contentful response is empty', async () => {
		vi.spyOn(contentfulDelivery, 'getContentfulEntriesByType').mockResolvedValue({ items: [], includes: { Asset: [] } });
		vi.spyOn(contentfulDelivery, 'getContentfulReviewsSchema').mockResolvedValue([]);

		renderWithProviders(<ContentfulReviewsCarousel reviewContentType="feedback" itemName="PixelVivid Custom Sunglasses" />);

		await waitFor(() => {
			expect(screen.getByText('No reviews found.')).toBeInTheDocument();
		});
	});

	it('renders carousel cards and review schema when content is available', async () => {
		vi.spyOn(contentfulDelivery, 'getContentfulEntriesByType').mockResolvedValue({
			items: [
				{
					sys: { contentType: { sys: { id: 'feedback' } } },
					fields: {
						description: 'Excellent glass',
						reviewer: 'Skylar',
					},
				},
			],
			includes: { Asset: [] },
		});

		vi.spyOn(contentfulDelivery, 'getContentfulReviewsSchema').mockResolvedValue([
			{ name: 'Excellent glass review', reviewBody: 'Excellent glass' },
		]);

		renderWithProviders(<ContentfulReviewsCarousel reviewContentType="feedback" itemName="PixelVivid Custom Sunglasses" />);

		await waitFor(() => {
			expect(screen.getByTestId('carousel')).toBeInTheDocument();
			expect(screen.getByTestId('reviewschema')).toBeInTheDocument();
			expect(screen.getByTestId('carousel').textContent).toContain('Excellent glass');
		});
	});

	it('honors maxReviews and custom field names when mapping entries', async () => {
		vi.spyOn(contentfulDelivery, 'getContentfulEntriesByType').mockResolvedValue({
			items: [
				{
					sys: { contentType: { sys: { id: 'feedback' } } },
					fields: { headline: 'Review One', comment: 'One', photo: 'https://example.com/1.jpg' },
				},
				{
					sys: { contentType: { sys: { id: 'feedback' } } },
					fields: { headline: 'Review Two', comment: 'Two', photo: 'https://example.com/2.jpg' },
				},
			],
			includes: { Asset: [] },
		});

		vi.spyOn(contentfulDelivery, 'getContentfulReviewsSchema').mockResolvedValue([]);

		renderWithProviders(
			<ContentfulReviewsCarousel 
				reviewContentType="feedback" 
				itemName="Test" 
				maxReviews={1}
				headerField="headline"
				bodyField="comment"
				imageField="photo"
			/>
		);

		await waitFor(() => {
			expect(screen.getByTestId('carousel').textContent).toContain('Review One');
			expect(screen.getByTestId('carousel').textContent).not.toContain('Review Two');
		});
	});
});
