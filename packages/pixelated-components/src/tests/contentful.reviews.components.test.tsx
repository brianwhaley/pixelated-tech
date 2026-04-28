import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContentfulReviewsCarousel } from '../components/integrations/contentful.reviews.components';
import { usePixelatedConfig } from '../components/config/config.client';
import * as contentfulDelivery from '../components/integrations/contentful.delivery';

vi.mock('../components/config/config.client', () => ({
	usePixelatedConfig: vi.fn(() => ({
		contentful: {
			base_url: 'https://example.contentful.com',
			space_id: 'space-id',
			environment: 'master',
			delivery_access_token: 'token',
		},
	}))
}));

vi.mock('../components/general/carousel', () => ({
	Carousel: ({ cards, draggable, imgFit }: any) => (
		<div data-testid="mock-carousel" data-draggable={String(draggable)} data-imgfit={imgFit}>
			{cards.map((card: any) => card.headerText).join('|')}
		</div>
	),
}));

vi.mock('../components/foundation/schema', () => ({
	ReviewSchema: ({ review }: any) => <div data-testid="mock-reviewschema">{review?.name ?? 'schema'}</div>,
}));

describe('ContentfulReviewsCarousel Component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders loading state while fetching reviews', () => {
		vi.spyOn(contentfulDelivery, 'getContentfulEntriesByType').mockImplementation(
			() => new Promise(() => {})
		);

		render(<ContentfulReviewsCarousel reviewContentType="feedback" itemName="PixelVivid Custom Sunglasses" />);

		expect(screen.getByText('Loading reviews...')).toBeInTheDocument();
	});

	it('renders no reviews when the Contentful response is empty', async () => {
		vi.spyOn(contentfulDelivery, 'getContentfulEntriesByType').mockResolvedValue({ items: [], includes: { Asset: [] } });
		vi.spyOn(contentfulDelivery, 'getContentfulReviewsSchema').mockResolvedValue([]);

		render(<ContentfulReviewsCarousel reviewContentType="feedback" itemName="PixelVivid Custom Sunglasses" />);

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

		render(<ContentfulReviewsCarousel reviewContentType="feedback" itemName="PixelVivid Custom Sunglasses" />);

		await waitFor(() => {
			expect(screen.getByTestId('mock-carousel')).toBeInTheDocument();
			expect(screen.getByTestId('mock-reviewschema')).toBeInTheDocument();
			expect(screen.getByTestId('mock-carousel').textContent).toContain('Excellent glass');
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

		render(
			<ContentfulReviewsCarousel
				reviewContentType="feedback"
				itemName="PixelVivid Custom Sunglasses"
				headerField="headline"
				bodyField="comment"
				imageField="photo"
				maxReviews={1}
				includeReviewSchema={false}
			/>
		);

		await waitFor(() => {
			expect(screen.getByTestId('mock-carousel').textContent).toContain('Review One');
			expect(screen.getByTestId('mock-carousel').textContent).not.toContain('Review Two');
			expect(screen.queryByTestId('mock-reviewschema')).not.toBeInTheDocument();
		});
	});

	it('renders an error message when Contentful fetch fails', async () => {
		vi.spyOn(contentfulDelivery, 'getContentfulEntriesByType').mockRejectedValue(new Error('Network failure'));

		render(<ContentfulReviewsCarousel reviewContentType="feedback" itemName="PixelVivid Custom Sunglasses" />);

		await waitFor(() => {
			expect(screen.getByText('Error: Network failure')).toBeInTheDocument();
		});
	});

	it('shows no reviews when contentful configuration is missing', async () => {
		const mockConfig = vi.mocked(usePixelatedConfig as any);
		mockConfig.mockReturnValueOnce({});

		render(<ContentfulReviewsCarousel reviewContentType="feedback" itemName="PixelVivid Custom Sunglasses" />);

		await waitFor(() => {
			expect(screen.getByText('No reviews found.')).toBeInTheDocument();
		});
	});
});
