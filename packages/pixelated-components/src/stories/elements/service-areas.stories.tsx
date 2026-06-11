import React from 'react';
import { PixelatedClientConfigProvider } from '@/components/config/config.client';
import { ServiceAreasList, ServiceAreaDetail } from '@/components/elements/service-areas.components';
import '@/css/pixelated.grid.scss';

export default {
	title: 'General/Service Areas',
	component: ServiceAreasList,
};

const serviceAreas = [
	{
		name: 'Coastal Neighborhoods',
		description: 'Protecting coastal homes from salt air, humidity, and outdoor wear.',
		short_description: 'Local coastal service area for marine-safe flooring.',
		path: '/service-areas/coastal-neighborhoods',
		highlights: ['Salt-air protection', 'Exterior surface sealing'],
		relatedServices: ['Deck Refinishing', 'Driveway Coating'],
	},
	{
		name: 'Downtown Districts',
		description: 'Commercial and residential floor systems built for heavy foot traffic.',
		short_description: 'Urban district service coverage with durable commercial finishes.',
		slug: 'downtown-districts',
	},
];

export const ServiceAreasListStory = {
	render: () => (
		<PixelatedClientConfigProvider config={{ siteInfo: { serviceAreas } }}>
			<ServiceAreasList
				title="Service Areas"
				intro="Find the communities where we deliver trusted local service."
			/>
		</PixelatedClientConfigProvider>
	),
};

export const ServiceAreaDetailStory = {
	render: () => (
		<PixelatedClientConfigProvider config={{ siteInfo: { serviceAreas } }}>
			<ServiceAreaDetail
				serviceAreaSlug="downtown-districts"
			/>
		</PixelatedClientConfigProvider>
	),
};
