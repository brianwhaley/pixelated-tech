import React from 'react';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { GoogleMap, GoogleStaticMap } from '../components/integrations/google.map';
import { renderWithProviders } from '../test/test-utils';

describe('Google map components', () => {
	it('renders a typed iframe map URL', () => {
		const { container } = renderWithProviders(
			<GoogleMap
				q="10 Jade Circle, Denville, NJ"
				mode="directions"
				origin="New York, NY"
				destination="Denville, NJ"
				zoom="15"
				width="100%"
				height="300"
				loading="lazy"
			/>,
			{ config: { integrations: { googleMaps: { apiKey: 'test-map-key' } } } },
		);

		const iframe = container.querySelector('iframe');
		expect(iframe).toBeInTheDocument();
		expect(iframe).toHaveAttribute('src', expect.stringContaining('/maps/embed/v1/directions'));
		expect(iframe).toHaveAttribute('src', expect.stringContaining('key=test-map-key'));
		expect(iframe).toHaveAttribute('src', expect.stringContaining('origin=New%20York%2C%20NY'));
		expect(iframe).toHaveAttribute('width', '100%');
		expect(iframe).toHaveAttribute('height', '300');
		expect(iframe).toHaveAttribute('loading', 'lazy');
	});

	it('renders an error state when an iframe map has no API key', () => {
		const { container } = renderWithProviders(
			<GoogleMap q="Austin, TX" />,
			{ config: { integrations: { googleMaps: { apiKey: undefined } } } },
		);

		expect(container.textContent).toMatch(/Sorry, something went wrong loading GoogleMap/i);
	});

	it('renders a linked static map image', () => {
		const { container } = renderWithProviders(
			<GoogleStaticMap query="10 Jade Circle, Denville, NJ" />,
			{ config: { integrations: { googleMaps: { apiKey: 'test-static-key' } } } },
		);

		const image = screen.getByAltText('Map showing business location');
		expect(image).toHaveAttribute('src', expect.stringContaining('maps.googleapis.com/maps/api/staticmap'));
		expect(image).toHaveAttribute('src', expect.stringContaining('key=test-static-key'));
		expect(container.querySelector('a')).toHaveAttribute('href', expect.stringContaining('maps/search/?api=1&query='));
	});

	it('renders an unavailable state when a static map has no API key', () => {
		const { container } = renderWithProviders(
			<GoogleStaticMap query="Austin, TX" />,
			{ config: { integrations: { googleMaps: { apiKey: undefined } } } },
		);

		expect(container.textContent).toContain('Map unavailable');
	});
});
