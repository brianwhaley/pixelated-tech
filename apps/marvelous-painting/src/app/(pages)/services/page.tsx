"use client";

import React from 'react';
import { PageTitleHeader, PageSection, Services, usePixelatedConfig } from '@pixelated-tech/components';

export default function ServicesPage() {
	const config = usePixelatedConfig();
	const siteInfo = config?.siteInfo;
	const siteName = siteInfo?.name || "Marvelous Painting";

	return (
		<>
			<PageTitleHeader title={`${siteName} Services`} />
			<PageSection columns={1} maxWidth="1024px" id="services-intro">
				<p>
					{siteName} provides painting, custom carpentry, remodeling, renovation, power washing, and outdoor improvement services for homes and businesses across Northern New Jersey.
				</p>
			</PageSection>

			<Services
				
				title={`${siteName} Services`}
				intro="Click a service to read more about how it works for your business."
				
			/>

			<PageSection columns={1} maxWidth="1024px" id="service-areas-link-section">
				<p>
					Check out our <a href="/service-areas">Service Areas</a> page to see the regions we serve and the local expertise we offer.
				</p>
				<p>
					<a href="/contact">Contact us</a> to discuss your project, timeline, and next steps.
				</p>
			</PageSection>

		</>
	);
}
