"use client";

import React from 'react';
import { PageTitleHeader, PageSection, Services, usePixelatedConfig } from '@pixelated-tech/components';

export default function ServicesPage() {
	const config = usePixelatedConfig();
	const siteInfo = config?.siteInfo;
	const siteName = siteInfo?.name || "AMAVA Janitorial";

	return (
		<>
			<PageTitleHeader title="Amava janitorial Services" />
			<PageSection columns={1} maxWidth="1024px" id="services-intro">
				<p>
					{siteName} provides professional janitorial and facility maintenance services for commercial buildings, offices, and small businesses.
				</p>
			</PageSection>

			<Services
				variant="boxed grid"
				boxShape="square"
			/>

			<PageSection columns={1} maxWidth="1024px" id="service-areas-link-section">
				<p>
					Check out our <a href="/service-areas">Service Areas</a> page to see the regions we serve and the local expertise we offer.
				</p>
				<p>
					<a href="/contact">Contact us</a> to learn more about our services, service areas, and how we can support your needs in your area. We are committed to providing excellent service and local expertise wherever you are.
				</p>
			</PageSection>

		</>
	);
}
