import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GoogleReviewsCarousel } from '../components/integrations/google.reviews.components';
import * as googleReviewsFunctions from '../components/integrations/google.reviews.functions';

vi.mock('../components/config/config.client', () => ({
	usePixelatedConfig: vi.fn(() => ({
		googleMaps: {
			apiKey: 'config-api-key'
		},
		global: {
			proxyUrl: 'https://proxy.example.com/'
		}
	}))
}));

vi.mock('../components/general/carousel', () => ({
	Carousel: ({ cards }: any) => <div data-testid="mock-carousel">{cards.length}</div>
}));

vi.mock('../components/general/smartimage', () => ({
	SmartImage: ({ src, alt }: any) => <img data-testid="mock-smartimage" src={src} alt={alt} />
}));

describe('GoogleReviewsCarousel Component', () => {
	const carouselMockPlace = {
		name: 'Test Restaurant',
		place_id: 'place-123',
		formatted_address: '123 Main St, City, State'
	};

	const carouselMockReviews = [
		{
			author_name: 'John Doe',
			rating: 5,
			text: 'Excellent service!',
			profile_photo_url: 'https://example.com/photo1.jpg',
			time: 1234567890,
			relative_time_description: '2 weeks ago'
		},
		{
			author_name: 'Jane Smith',
			rating: 4,
			text: 'Good food, friendly staff',
			profile_photo_url: 'https://example.com/photo2.jpg',
			time: 1234567880,
			relative_time_description: '3 weeks ago'
		}
	];

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('shows loading state initially', () => {
		vi.spyOn(googleReviewsFunctions, 'getGoogleReviewsByPlaceId').mockImplementation(
			() => new Promise(() => {})
		);

		render(<GoogleReviewsCarousel placeId="place-123" />);

		expect(screen.getByText('Loading reviews...')).toBeInTheDocument();
	});

	it('renders carousel when reviews are available', async () => {
		vi.spyOn(googleReviewsFunctions, 'getGoogleReviewsByPlaceId').mockResolvedValue({
			place: carouselMockPlace,
			reviews: carouselMockReviews
		});

		render(<GoogleReviewsCarousel placeId="place-123" />);

		await waitFor(() => {
			expect(screen.getByTestId('mock-carousel')).toBeInTheDocument();
			expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
			expect(screen.getByText('123 Main St, City, State')).toBeInTheDocument();
		});
	});

	it('passes displayMode grid and renders review cards', async () => {
		vi.spyOn(googleReviewsFunctions, 'getGoogleReviewsByPlaceId').mockResolvedValue({
			place: carouselMockPlace,
			reviews: carouselMockReviews
		});

		render(<GoogleReviewsCarousel placeId="place-123" displayMode="grid" />);

		await waitFor(() => {
			expect(screen.getByText('Excellent service!')).toBeInTheDocument();
			expect(screen.getByText('Good food, friendly staff')).toBeInTheDocument();
			expect(screen.getAllByTestId('mock-smartimage')).toHaveLength(2);
		});
	});

	it('shows an error message when fetch fails', async () => {
		vi.spyOn(googleReviewsFunctions, 'getGoogleReviewsByPlaceId').mockRejectedValue(new Error('API Error'));

		render(<GoogleReviewsCarousel placeId="place-123" />);

		await waitFor(() => {
			expect(screen.getByText(/Error:/)).toBeInTheDocument();
		});
	});

	it('shows no reviews text when the API returns an empty list', async () => {
		vi.spyOn(googleReviewsFunctions, 'getGoogleReviewsByPlaceId').mockResolvedValue({
			place: carouselMockPlace,
			reviews: []
		});

		render(<GoogleReviewsCarousel placeId="place-123" />);

		await waitFor(() => {
			expect(screen.getByText('No reviews found.')).toBeInTheDocument();
		});
	});
});
