import React from 'react';
import { render, screen } from '@testing-library/react';
import { ServicesList, ServiceDetailPage } from '../components/general/services.components';

const mockServices = [
	{
		name: 'Floor Coating',
		description: 'Professional epoxy floor coating for residential and commercial spaces.',
		short_description: 'Protect and beautify concrete floors with long-lasting epoxy.',
		slug: 'floor-coating',
	},
	{
		name: 'Garage Floor Repair',
		description: 'Fast garage floor repair with concrete resurfacing and sealing.',
		short_description: 'Restore cracked and worn garage floors with expert repair.',
		slug: 'garage-floor-repair',
	},
];

describe('Services components', () => {
	it('renders a list of services using direct services props', () => {
		render(<ServicesList services={mockServices} title="Our Work" intro="Choose a service" />);

		expect(screen.getByRole('heading', { name: 'Our Work' })).toBeInTheDocument();
		expect(screen.getByText('Choose a service')).toBeInTheDocument();
		expect(screen.getByText('Protect and beautify concrete floors with long-lasting epoxy.')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Floor Coating/i })).toHaveAttribute('href', '/services/floor-coating');
	});

	it('uses the generated slug for service URLs even when url is provided', () => {
		render(<ServicesList services={[
			{ name: 'Floor Coating', description: 'Professional epoxy floor coating.', short_description: 'Protect floors with epoxy.', url: '/services/wrong-path', slug: 'floor-coating' }
		]} title="Our Work" intro="Choose a service" />);

		expect(screen.getByRole('link', { name: /Floor Coating/i })).toHaveAttribute('href', '/services/floor-coating');
	});

	it('renders service detail from slug using service list fallback', () => {
		render(<ServiceDetailPage serviceSlug="garage-floor-repair" services={mockServices} />);

		expect(screen.getByText('Fast garage floor repair with concrete resurfacing and sealing.')).toBeInTheDocument();
	});
});
