import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createPageComponentMocks } from '@/test/page-mocks';
import pixelatedConfig from '@/app/config/pixelated.config.json';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks({
	usePixelatedConfig: () => ({
		googlePlaces: {
			placeId: pixelatedConfig.googlePlaces.placeId,
			apiKey: pixelatedConfig.googlePlaces.apiKey,
		},
		googleMaps: { apiKey: pixelatedConfig.googleMaps.apiKey },
		global: { proxyUrl: pixelatedConfig.global.proxyUrl },
	}),
	getGoogleReviewsByPlaceId: async () => ({
		reviews: [
			{
				rating: 5,
				text: 'Excellent service',
				author_name: 'John Doe',
				profile_photo_url: 'https://example.com/photo.jpg',
			},
			{
				rating: 4,
				author_name: 'Jane Smith',
				profile_photo_url: '',
			},
		],
	}),
}));

import AboutUsPage from '@/app/(pages)/about-us/page';

describe('About Us page', () => {
	it('renders the page title', async () => {
		render(<AboutUsPage />);
		await waitFor(() => expect(screen.getByTestId('mock-pagetitleheader')).toHaveTextContent('About Manning Metalworks'));
	});

	it('fetches and renders review cards and schema when apiKey is configured', async () => {
		render(<AboutUsPage />);

		await waitFor(() => {
			expect(screen.getAllByTestId('mock-reviewschema').length).toBe(2);
			expect(screen.getByTestId('mock-carousel')).toBeInTheDocument();
		});
	});
});
