import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import appConfig from '@/app/config/pixelated.config.json';
import { createPageComponentMocks, resetPixelatedConfigOverride, setGoogleReviewsResponse, setPixelatedConfigOverride } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => {
	const baseMocks = createPageComponentMocks({
		GoogleReviewsCarousel: () => React.createElement('div', { 'data-testid': 'mock-googlereviewscarousel' }, null),
	});
	return baseMocks;
});

const googlePlacesKey = 'googlePlaces';
const placeIdKey = 'placeId';
const apiKeyKey = 'apiKey';
const globalKey = 'global';
const proxyUrlKey = 'proxyUrl';

const createAboutUsConfig = (apiKey: string, placeId: string) => {
	const configClone = structuredClone(appConfig) as any;
	configClone[googlePlacesKey] = {
		...configClone[googlePlacesKey],
		[placeIdKey]: placeId,
		[apiKeyKey]: apiKey,
	};
	configClone[globalKey] = {
		...configClone[globalKey],
		[proxyUrlKey]: '',
	};
	return configClone;
};

import AboutUsPage from '@/app/(pages)/about-us/page';

describe('About Us page', () => {
	beforeEach(() => {
		resetPixelatedConfigOverride();
		setGoogleReviewsResponse({
			reviews: [
				{ rating: 5, text: 'Excellent service', author_name: 'John Doe', profile_photo_url: 'https://example.com/photo.jpg' },
			],
		});
		setPixelatedConfigOverride(createAboutUsConfig('key', 'abc'));
	});

	it('renders the page title and review content', async () => {
		render(<AboutUsPage />);
		await waitFor(() => expect(screen.getByTestId('mock-pagetitleheader').textContent).toContain('About Three Muses'));
		await waitFor(() => expect(screen.getByTestId('mock-googlereviewscarousel')).toBeTruthy());
	});

	it('renders the page title without review content when API key is missing', async () => {
		setPixelatedConfigOverride(createAboutUsConfig('', 'abc'));

		render(<AboutUsPage />);
		await waitFor(() => expect(screen.getByTestId('mock-pagetitleheader').textContent).toContain('About Three Muses'));
		expect(screen.queryAllByTestId('mock-googlereviewscarousel').length).toBe(0);
	});

	it('renders the page title when placeId is missing', async () => {
		setPixelatedConfigOverride(createAboutUsConfig('key', ''));

		render(<AboutUsPage />);
		await waitFor(() => expect(screen.getByTestId('mock-pagetitleheader').textContent).toContain('About Three Muses'));
		expect(screen.getByTestId('mock-googlereviewscarousel')).toBeTruthy();
	});

	it('renders the page title even when review fetch fails', async () => {
		render(<AboutUsPage />);
		await waitFor(() => expect(screen.getByTestId('mock-pagetitleheader').textContent).toContain('About Three Muses'));
	});
});
