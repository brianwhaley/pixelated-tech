import React from 'react';
import { screen } from '@testing-library/react';
import { render } from '../test/test-utils';
import { Services as ServicesList, ServiceDetail, ServicesTiles } from '../components/elements/services.components';

const mockServices = [
	{
		name: 'Floor Coating',
		description: ['Professional epoxy floor coating for residential and commercial spaces.'],
		subtitle: 'Protect your floors with professional coatings.',
		short_description: 'Protect and beautify concrete floors with long-lasting epoxy.',
		image: '/images/floor-coating.jpg',
		slug: 'floor-coating',
	},
	{
		name: 'Garage Floor Repair',
		description: ['Fast garage floor repair with concrete resurfacing and sealing.'],
		short_description: 'Restore cracked and worn garage floors with expert repair.',
		image: '/images/garage-floor-repair.jpg',
		slug: 'garage-floor-repair',
	},
];

describe('Services components', () => {
	it('renders a list of services using config-provided services', () => {
		render(<ServicesList title="Our Work" intro="Choose a service" />, { config: { siteInfo: { services: mockServices } } });

		expect(screen.getByRole('heading', { name: 'Our Work' })).toBeInTheDocument();
		expect(screen.getByText('Choose a service')).toBeInTheDocument();
		expect(screen.getByText('Protect your floors with professional coatings.')).toBeInTheDocument();
		expect(screen.getByText('Protect and beautify concrete floors with long-lasting epoxy.')).toBeInTheDocument();
		const floorLinks = screen.getAllByRole('link', { name: /Floor Coating/i });
		expect(floorLinks.some((link) => link.getAttribute('href') === '/services/floor-coating')).toBe(true);
	});

	it('renders service tiles with configurable image shape and image sizes', () => {
		const { container } = render(
			<ServicesTiles imgShape="bevel" imgSizes="240px" />,
			{ config: { siteInfo: { services: mockServices } } }
		);

		expect(container.querySelector('.callout .bevel')).toBeInTheDocument();
		expect(container.querySelector('img')).toHaveAttribute('sizes', '240px');
		expect(screen.getByRole('link', { name: /Floor Coating/i })).toHaveAttribute('href', '/services/floor-coating');
	});

	it('exposes the callout box shape for service tiles', () => {
		const { container } = render(
			<ServicesTiles variant="boxed" boxShape="round" />,
			{ config: { siteInfo: { services: mockServices } } }
		);

		expect(container.querySelector('.callout.boxed.round')).toBeInTheDocument();
	});

	it('does not render service tiles when no services are configured', () => {
		const { container } = render(<ServicesTiles />, { config: { siteInfo: { services: [] } } });

		expect(container.firstChild).toBeNull();
	});

	it('forwards callout layout props to service callout cards', () => {
		const { container } = render(
			<ServicesList
				title="Our Work"
				intro="Choose a service"
				variant="full"
				layout="vertical"
				imgShape="round"
			/>
		, { config: { siteInfo: { services: mockServices } } });

		expect(container.querySelector('.callout.full')).toBeInTheDocument();
		expect(container.querySelector('.callout.vertical')).toBeInTheDocument();
		expect(container.querySelector('.callout .round')).toBeInTheDocument();
	});

	it('uses the generated slug for service URLs even when url is provided', () => {
		render(<ServicesList title="Our Work" intro="Choose a service" />, { config: { siteInfo: { services: [{ name: 'Floor Coating', description: ['Professional epoxy floor coating.'], short_description: 'Protect floors with epoxy.', url: '/services/wrong-path', slug: 'floor-coating' }] } } });

		expect(screen.getByRole('link', { name: /Floor Coating/i })).toHaveAttribute('href', '/services/floor-coating');
	});

	it('hides the header section when no title and no intro are provided', () => {
		render(<ServicesList />, { config: { siteInfo: { services: mockServices } } });

		expect(document.querySelector('#services-list-header')).not.toBeInTheDocument();
	});

	it('renders service detail from slug using config-provided services', () => {
		render(<ServiceDetail serviceSlug="garage-floor-repair" />, { config: { siteInfo: { services: mockServices } } });

		expect(screen.getByText('Fast garage floor repair with concrete resurfacing and sealing.')).toBeInTheDocument();
	});
});
