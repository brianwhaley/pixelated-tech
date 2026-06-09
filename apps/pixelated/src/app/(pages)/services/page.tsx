"use client";

import React from 'react';
import { PageTitleHeader, PageSection, Services, usePixelatedConfig } from '@pixelated-tech/components';

export default function ServicesPage() {
	const pixelatedConfig = usePixelatedConfig();
	const siteInfo = pixelatedConfig?.siteInfo ?? {};

	return (
		<>
			<PageTitleHeader title="Services" />
			<PageSection columns={1} maxWidth="1024px" id="services-intro">
				<p>
					Pixelated Technologies provides a full suite of digital services for small businesses in New Jersey and South Carolina. Browse our service offerings and click through to learn how we can support your online growth.
				</p>
			</PageSection>

			<Services
				siteInfo={siteInfo}
				title="Pixelated Technologies Services"
				intro="Click a service to read more about how it works for your business."
				servicePathPrefix="/services"
			/>

			<PageSection columns={1} maxWidth="1024px" id="service-areas-link-section">
				<p>
					Check out our <a href="/service-areas">Service Areas</a> page to see the regions we serve and the local expertise we offer.
				</p>
				<p>
					<a href="/schedule">Schedule an appointment</a> to learn more about our services, service areas, and how we can support your needs in your area. We are committed to providing excellent service and local expertise wherever you are.
				</p>
			</PageSection>

		</>
	);
}
