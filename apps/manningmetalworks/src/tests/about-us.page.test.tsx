import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { config as pixelatedConfig, createPageComponentMocks } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks({
	usePixelatedConfig: () => ({
		integrations: {
			googlePlaces: {
				placeId: pixelatedConfig.integrations?.googlePlaces?.placeId,
				apiKey: pixelatedConfig.integrations?.googlePlaces?.apiKey,
			},
			googleMaps: { apiKey: pixelatedConfig.integrations?.googleMaps?.apiKey },
			global: { proxyUrl: pixelatedConfig.integrations?.global?.proxyUrl },
		},
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

	it('renders the GoogleReviewsCarousel when apiKey is configured', async () => {
		render(<AboutUsPage />);

		await waitFor(() => {
			expect(screen.getByTestId('mock-googlereviewscarousel')).toBeInTheDocument();
		});
	});
});
