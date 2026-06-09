import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GoogleReviewsCard, GoogleReviewsCarousel } from '../components/integrations/google.reviews.components';
import * as googleReviewsFunctions from '../components/integrations/google.reviews.functions';
import { renderWithProviders } from '../test/test-utils';

// Mock SmartImage
vi.mock('../components/elements/smartimage', () => ({
	SmartImage: ({ src, alt }: any) => <img src={src} alt={alt} data-testid="mock-smartimage" />
}));

// Mock Carousel
vi.mock('../components/structure/carousel', () => ({
	Carousel: ({ cards }: any) => <div data-testid="mock-carousel">{cards.length} items</div>
}));

describe('Google Reviews Components', () => {
	const mockPlace = {
		name: 'Test Restaurant',
		place_id: 'place-123',
		formatted_address: '123 Main St, City, State'
	};

	const mockReviews = [
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

	describe('GoogleReviewsCard', () => {
		it('should display loading message initially', () => {
			vi.spyOn(googleReviewsFunctions, 'getGoogleReviewsByPlaceId').mockImplementation(
				() => new Promise(() => {})
			);

			renderWithProviders(<GoogleReviewsCard />, {
				config: {
					integrations: {
						googlePlaces: { placeId: 'place-123', apiKey: 'test-api-key' },
					},
				},
			});

			expect(screen.getByText('Loading reviews...')).toBeInTheDocument();
		});

		it('should display error message on fetch failure', async () => {
			vi.spyOn(googleReviewsFunctions, 'getGoogleReviewsByPlaceId').mockRejectedValue(
				new Error('API Error')
			);

			renderWithProviders(<GoogleReviewsCard />, {
				config: {
					integrations: {
						googlePlaces: { placeId: 'place-123', apiKey: 'test-api-key' },
					},
				},
			});

			await waitFor(() => {
				expect(screen.getByText(/Error:/)).toBeInTheDocument();
			});
		});

		it('should display CORS error message for CORS failures', async () => {
			vi.spyOn(googleReviewsFunctions, 'getGoogleReviewsByPlaceId').mockRejectedValue(
				new Error('CORS error')
			);

			renderWithProviders(<GoogleReviewsCard />, {
				config: {
					integrations: {
						googlePlaces: { placeId: 'place-123', apiKey: 'test-api-key' },
					},
				},
			});

			await waitFor(() => {
				expect(screen.getByText(/CORS restrictions/)).toBeInTheDocument();
			});
		});

		it('should display place name when data loads', async () => {
			vi.spyOn(googleReviewsFunctions, 'getGoogleReviewsByPlaceId').mockResolvedValue({
				place: mockPlace,
				reviews: mockReviews
			});

			renderWithProviders(<GoogleReviewsCard />, {
				config: {
					integrations: {
						googlePlaces: { placeId: 'place-123', apiKey: 'test-api-key' },
					},
				},
			});

			await waitFor(() => {
				expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
			});
		});

		it('should display no reviews found when API returns an empty list', async () => {
			vi.spyOn(googleReviewsFunctions, 'getGoogleReviewsByPlaceId').mockResolvedValue({
				place: mockPlace,
				reviews: []
			});

			renderWithProviders(<GoogleReviewsCard />, {
				config: {
					integrations: {
						googlePlaces: { placeId: 'place-123', apiKey: 'test-api-key' },
					},
				},
			});

			await waitFor(() => {
				expect(screen.getByText('No reviews found.')).toBeInTheDocument();
			});
		});
	});

	describe('GoogleReviewsCarousel', () => {

		it('should display error when GoogleReviewsCarousel config is missing a placeId', async () => {
			renderWithProviders(<GoogleReviewsCarousel displayMode="grid" />, {
				config: {
					integrations: {
						googlePlaces: {},
					},
				},
			});

			await waitFor(() => {
				expect(screen.getByText(/Place ID is required/)).toBeInTheDocument();
			});
		});

		it('should render GoogleReviewsCarousel in grid mode without schema', async () => {
			vi.spyOn(googleReviewsFunctions, 'getGoogleReviewsByPlaceId').mockResolvedValue({
				place: mockPlace,
				reviews: mockReviews
			});

			renderWithProviders(
				<GoogleReviewsCarousel displayMode="grid" includeReviewSchema={false} />,
				{
					config: {
						integrations: {
							googlePlaces: { placeId: 'place-123', apiKey: 'test-api-key' },
						},
					},
				}
			);

			await waitFor(() => {
				expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
				expect(screen.getByText('John Doe')).toBeInTheDocument();
			});
		});
	});
});
