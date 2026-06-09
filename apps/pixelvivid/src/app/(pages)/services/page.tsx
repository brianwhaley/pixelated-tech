"use client";

import React from 'react';
import { PageTitleHeader, PageSection, Services, usePixelatedConfig } from '@pixelated-tech/components';

export default function ServicesPage() {
	const siteInfo = usePixelatedConfig()?.siteInfo ?? {};

	return (
		<>
			<PageTitleHeader title="PixelVivid Services" />
			<PageSection columns={1} maxWidth="1024px" id="services-intro">
				<p>
					PixelVivid offers a wide variety of artistic products and services such as unique one-of-a-kind painted sunglasses, photography, jewelry, commissioned paintings, and more. Explore our creative offerings below. 
				</p>
			</PageSection>

			<Services
				siteInfo={siteInfo}
				title="Our Services"
				intro="Click a service to read more about how it works for your business."
				servicePathPrefix="/services"
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
