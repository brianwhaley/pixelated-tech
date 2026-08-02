import React from 'react';
import { screen } from '@testing-library/react';
import { render } from '../test/test-utils';
import { ServiceAreas as ServiceAreasList, ServiceAreaDetail } from '../components/elements/service-areas.components';

const mockServiceAreas = [
	{
		name: 'Coastal Service Area',
		description: ['Serving coastal homes with specialized exterior coatings and weatherproof finishes.'],
		short_description: 'Waterproof and corrosion-resistant service area solutions.',
		path: '/service-areas/coastal-service-area',
		highlights: ['Marine-safe coatings', 'Salt-air protection'],
		relatedServices: ['Exterior Coatings', 'Paver Sealing'],
	},
	{
		name: 'Downtown Service Area',
		description: ['Urban garage and business floor solutions for downtown locations.'],
		short_description: 'Heavy-duty flooring coverage for downtown commercial spaces.',
		slug: 'downtown-service-area',
	},
];

describe('Service areas components', () => {
	it('renders a list of service areas using config-provided serviceAreas', () => {
		render(<ServiceAreasList title="Service Areas" intro="We serve the following regions:" />, { config: { siteInfo: { serviceAreas: mockServiceAreas } } });

		expect(screen.getByRole('heading', { name: 'Service Areas' })).toBeInTheDocument();
		expect(screen.getByText('We serve the following regions:')).toBeInTheDocument();
		expect(screen.getByText('Waterproof and corrosion-resistant service area solutions.')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Coastal Service Area/i })).toHaveAttribute('href', '/service-areas/coastal-service-area');
	});

	it('uses the generated slug for service area URLs even when path is provided', () => {
		render(<ServiceAreasList title="Service Areas" intro="We serve the following regions:" />, { config: { siteInfo: { serviceAreas: [{ name: 'Coastal Service Area', description: ['Serving coastal homes.'], short_description: 'Waterproof service area solutions.', path: '/service-areas/wrong-path' }] } } });

		expect(screen.getByRole('link', { name: /Coastal Service Area/i })).toHaveAttribute('href', '/service-areas/coastal-service-area');
	});

	it('renders service area detail page by slug using config-provided serviceAreas', () => {
		render(<ServiceAreaDetail serviceAreaSlug="downtown-service-area" />, { config: { siteInfo: { serviceAreas: mockServiceAreas } } });

		expect(screen.getByText('Urban garage and business floor solutions for downtown locations.')).toBeInTheDocument();
	});

	it('renders service areas from config-provided siteInfo', () => {
		render(<ServiceAreasList title="Service Areas" intro="We serve the following regions:" />, { config: { siteInfo: { serviceAreas: mockServiceAreas } } });

		expect(screen.getByRole('heading', { name: 'Service Areas' })).toBeInTheDocument();
		expect(screen.getByText('Coastal Service Area')).toBeInTheDocument();
	});

	it('renders service area detail page with highlights and related service links', () => {
		render(
			<ServiceAreaDetail
				serviceAreaSlug="coastal-service-area"
			/>
		, { config: { siteInfo: { serviceAreas: [{
				name: 'Coastal Service Area',
				description: ['Serving coastal homes.', 'Expert exterior coatings.'],
				short_description: 'Waterproof solutions.',
				highlights: ['Marine-safe coatings', 'Salt-air protection'],
				relatedServices: ['Exterior Coatings'],
			}], services: [{ name: 'Exterior Coatings' }] } } });

		expect(screen.getByText('Highlights')).toBeInTheDocument();
		expect(screen.getByText('Marine-safe coatings')).toBeInTheDocument();
		expect(screen.getByText('Salt-air protection')).toBeInTheDocument();
		expect(screen.getByText(/Exterior Coatings/)).toBeInTheDocument();
	});
});
