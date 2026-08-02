import React from 'react';
import { PixelatedClientConfigProvider } from '@/components/config/config.client';
import { Services, ServiceDetail } from '@/components/elements/services.components';
import '@/css/pixelated.grid.scss';

export default {
	title: 'General/Services',
	component: Services,
};

const services = [
	{
		name: 'Interior Epoxy Floors',
		description: ['Durable epoxy finishes for garages, basements, and workshops.'],
		short_description: 'High-performance floor coatings for residential and commercial uses.',
		slug: 'interior-epoxy-floors',
	},
	{
		name: 'Surface Preparation',
		description: ['Concrete grinding, repair, and moisture mitigation before coating application.'],
		short_description: 'Premium surface prep services that make coatings last longer.',
		slug: 'surface-preparation',
	},
];

export const ServicesListStory = {
	render: () => (
		<PixelatedClientConfigProvider config={{ siteInfo: { services } }}>
			<ServicesList
				title="Our Service Catalog"
				intro="Browse our main services and learn more about each project type."
			/>
		</PixelatedClientConfigProvider>
	),
};

export const ServiceDetailStory = {
	render: () => (
		<PixelatedClientConfigProvider config={{ siteInfo: { services } }}>
			<ServiceDetail
				serviceSlug="interior-epoxy-floors"
			/>
		</PixelatedClientConfigProvider>
	),
};
