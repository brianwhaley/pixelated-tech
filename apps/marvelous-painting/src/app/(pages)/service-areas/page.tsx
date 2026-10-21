"use client";

import React from 'react';
import { PageTitleHeader, PageSection, ServiceAreas, usePixelatedConfig } from '@pixelated-tech/components';

export default function ServiceAreasPage() {
	const config = usePixelatedConfig();
	const siteInfo = config?.siteInfo;
	const siteName = siteInfo?.name || "Marvelous Painting";

	return (
		<>
			<PageTitleHeader title={`${siteName} Service Areas`} />
			<PageSection columns={1} maxWidth="1024px" id="service-areas-intro">
				<p>
					Marvelous Painting serves residential and commercial customers throughout Northern New Jersey. Explore the communities where our painting, carpentry, remodeling, and outdoor work is available.
				</p>
			</PageSection>

			<ServiceAreas
				
				title={`${siteName} Service Areas`}
				intro="Select a community to learn about local coverage and the services available there."
				serviceAreaPathPrefix="/service-areas"
			/>
			
			<PageSection columns={1} maxWidth="1024px" id="services-link-section">
				<p>
					Check out our <a href="/services">Services</a> page to see the services we offer and the expertise we provide.
				</p>
				<p>
					<a href="/contact">Contact us</a> to confirm coverage for your address and discuss your project.
				</p>
			</PageSection>
			
		</>
	);
}
