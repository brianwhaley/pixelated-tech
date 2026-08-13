"use client";

import React from 'react';
import { PageTitleHeader, PageSection, Services, usePixelatedConfig } from '@pixelated-tech/components';

export default function ServicesPage() {
	const config = usePixelatedConfig();
	const siteInfo = config?.siteInfo;
	const siteName = siteInfo?.name || "GEA Construction";

	return (
		<>
			<PageTitleHeader title={`${siteInfo?.name ?? 'Site'} Services`} />
			<br />
			<PageSection columns={1} maxWidth="1024px" id="services-intro">
				<p>
					{siteName} provides a full suite of digital services for small businesses. Browse our service offerings and click through to learn how we can support your online growth.
				</p>
			</PageSection>

			<Services
				variant="boxed grid"
				boxShape="square"
				gridColumns={{left: 1, right: 2}}
				// title={`${siteName} Services`}
				// intro="Click a service to read more about how it works for your business."
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
