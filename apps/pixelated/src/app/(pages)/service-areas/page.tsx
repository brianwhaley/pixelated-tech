"use client";

import React from 'react';
import siteConfig from '@/app/data/siteconfig.json';
import { PageTitleHeader, PageSection, ServiceAreasList } from '@pixelated-tech/components';

export default function ServiceAreasPage() {
	const siteInfo = (siteConfig as any).siteInfo;

	return (
		<>
			<PageTitleHeader title="Service Areas" />
			<PageSection columns={1} maxWidth="1024px" id="service-areas-intro">
				<p>
					Pixelated Technologies supports businesses across targeted regions in New Jersey and South Carolina. Explore the service areas where we deliver digital strategy, web development, and local marketing solutions.
				</p>
			</PageSection>

			<ServiceAreasList
				siteInfo={siteInfo}
				title="Pixelated Technologies Service Areas"
				intro="Click a service area to see the local coverage and specialties for that region."
				serviceAreaPathPrefix="/service-areas"
			/>
			
			<PageSection columns={1} maxWidth="1024px" id="services-link-section">
				<p>
					Check out our <a href="/services">Services</a> page to see the services we offer and the expertise we provide.
				</p>
				<p>
					<a href="/schedule">Schedule an appointment</a> to learn more about our services, service areas, and how we can support your needs in your area. We are committed to providing excellent service and local expertise wherever you are.
				</p>
			</PageSection>

		</>
	);
}
