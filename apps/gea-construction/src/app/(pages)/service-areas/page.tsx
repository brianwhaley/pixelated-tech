"use client";

import React from 'react';
import { PageTitleHeader, PageSection, ServiceAreas, usePixelatedConfig } from '@pixelated-tech/components';

export default function ServiceAreasPage() {
	const config = usePixelatedConfig();
	const siteInfo = config?.siteInfo;
	const siteName = siteInfo?.name || "GEA Construction";

	return (
		<>
			<PageTitleHeader title={`${siteName} Service Areas`} />
			<PageSection columns={1} maxWidth="1024px" id="service-areas-intro">
				<p>
					This site serves targeted geographic areas with localized services and expertise. Explore the regions where we deliver dependable service and local support.
				</p>
			</PageSection>

			<ServiceAreas
				title={`${siteName} Service Areas`}
				intro="Click a service area to read about the local coverage, specialties, and how we support businesses in that region."
				serviceAreaPathPrefix="/service-areas"
			/>
			
			<PageSection columns={1} maxWidth="1024px" id="services-link-section">
				<p>
					Check out our <a href="/services">Services</a> page to see the services we offer and the expertise we provide.
				</p>
				<p>
					<a href="/contact">Contact us</a> to learn more about our services, service areas, and how we can support your needs in your area. We are committed to providing excellent service and local expertise wherever you are.
				</p>
			</PageSection>
			
		</>
	);
}
