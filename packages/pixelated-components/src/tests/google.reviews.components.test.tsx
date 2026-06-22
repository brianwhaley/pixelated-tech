import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GoogleReviewsCard, GoogleReviewsCarousel } from '../components/integrations/google.reviews.components';
import * as googleReviewsFunctions from '../components/integrations/google.reviews.functions';
import { renderWithProviders, screen, waitFor } from '../test/test-utils';
import { pixelatedConfig, mockPlaceReviews as canonicalMockPlaceReviews } from '../test/test-data';

// Mock SmartImage
vi.mock('../components/elements/smartimage', () => ({
	SmartImage: ({ src, alt }: any) => <img src={src} alt={alt} data-testid="mock-smartimage" />
}));

// Mock Carousel
vi.mock('../components/structure/carousel', () => ({
	Carousel: ({ cards }: any) => <div data-testid="mock-carousel">{cards.length} items</div>
}));

describe('Google Reviews Components', () => {
	const mockPlaceReviews = JSON.parse(JSON.stringify(canonicalMockPlaceReviews));
	const { place: mockPlace, reviews: mockReviews } = mockPlaceReviews;

	const googlePlacesTestConfig = JSON.parse(JSON.stringify(pixelatedConfig));
	googlePlacesTestConfig.integrations = googlePlacesTestConfig.integrations || {};
	googlePlacesTestConfig.integrations.googlePlaces = {
		...(googlePlacesTestConfig.integrations?.googlePlaces || {}),
		placeId: 'place-123',
		apiKey: 'test-api-key',
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('GoogleReviewsCard', () => {
		it('should display loading message initially', () => {
			vi.spyOn(googleReviewsFunctions, 'getGoogleReviewsByPlaceId').mockImplementation(
				() => new Promise(() => {})
			);

			renderWithProviders(<GoogleReviewsCard />, {
				config: googlePlacesTestConfig,
			});

			expect(screen.getByText('Loading reviews...')).toBeInTheDocument();
		});

		it('should display error message on fetch failure', async () => {
			vi.spyOn(googleReviewsFunctions, 'getGoogleReviewsByPlaceId').mockRejectedValue(
				new Error('API Error')
			);

			renderWithProviders(<GoogleReviewsCard />, {
				config: googlePlacesTestConfig,
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
				config: googlePlacesTestConfig,
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
				config: googlePlacesTestConfig,
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
				config: googlePlacesTestConfig,
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
					config: googlePlacesTestConfig,
				}
			);

			await waitFor(() => {
				expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
				expect(screen.getByText('John Doe')).toBeInTheDocument();
			});
		});
	});
});
