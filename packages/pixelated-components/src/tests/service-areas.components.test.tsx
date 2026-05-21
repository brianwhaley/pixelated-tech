import React from 'react';
import { render, screen } from '@testing-library/react';
import { ServiceAreasList, ServiceAreaDetailPage } from '../components/general/service-areas.components';

const mockServiceAreas = [
	{
		name: 'Coastal Service Area',
		description: 'Serving coastal homes with specialized exterior coatings and weatherproof finishes.',
		short_description: 'Waterproof and corrosion-resistant service area solutions.',
		path: '/service-areas/coastal-service-area',
		highlights: ['Marine-safe coatings', 'Salt-air protection'],
		relatedServices: ['Exterior Coatings', 'Paver Sealing'],
	},
	{
		name: 'Downtown Service Area',
		description: 'Urban garage and business floor solutions for downtown locations.',
		short_description: 'Heavy-duty flooring coverage for downtown commercial spaces.',
		slug: 'downtown-service-area',
	},
];

describe('Service areas components', () => {
	it('renders a list of service areas with direct serviceAreas props', () => {
		render(<ServiceAreasList serviceAreas={mockServiceAreas} title="Service Areas" intro="We serve the following regions:" />);

		expect(screen.getByRole('heading', { name: 'Service Areas' })).toBeInTheDocument();
		expect(screen.getByText('We serve the following regions:')).toBeInTheDocument();
		expect(screen.getByText('Waterproof and corrosion-resistant service area solutions.')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Coastal Service Area/i })).toHaveAttribute('href', '/service-areas/coastal-service-area');
	});

	it('uses the generated slug for service area URLs even when path is provided', () => {
		render(<ServiceAreasList serviceAreas={[
			{ name: 'Coastal Service Area', description: 'Serving coastal homes.', short_description: 'Waterproof service area solutions.', path: '/service-areas/wrong-path' }
		]} title="Service Areas" intro="We serve the following regions:" />);

		expect(screen.getByRole('link', { name: /Coastal Service Area/i })).toHaveAttribute('href', '/service-areas/coastal-service-area');
	});

	it('renders service area detail page by slug using fallback list', () => {
		render(<ServiceAreaDetailPage serviceAreaSlug="downtown-service-area" serviceAreas={mockServiceAreas} />);

		expect(screen.getByText('Urban garage and business floor solutions for downtown locations.')).toBeInTheDocument();
	});
});
