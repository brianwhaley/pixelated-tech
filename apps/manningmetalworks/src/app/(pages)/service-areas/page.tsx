"use client";

import React from 'react';
import { PageTitleHeader, PageSection, ServiceAreas } from '@pixelated-tech/components';

export default function ServiceAreasPage() {

	return (
		<>
			<PageTitleHeader title="Manning Metalworks Service Areas" />
			<PageSection columns={1} maxWidth="1024px" id="service-areas-intro">
				<p>
					This site serves targeted geographic areas with localized services and expertise. Explore the regions where we deliver dependable service and local support.
				</p>
			</PageSection>

			<ServiceAreas
				title="Our Service Areas"
				intro="Click a service area to read about the local coverage, specialties, and how we support businesses in that region."
				serviceAreaPathPrefix="/service-areas"
			/>

			<PageSection columns={1} maxWidth="1024px" id="service-areas-link-section">
				<p>
					Check out our <a href="/services">Services</a> page to see the full range of services we offer across all our service areas.
				</p>
				<p>
					<a href="/contact-us">Contact us</a> to learn more about our services, service areas, and how we can support your needs in your area. We are committed to providing excellent service and local expertise wherever you are.
				</p>
			</PageSection>

		</>
	);
}
