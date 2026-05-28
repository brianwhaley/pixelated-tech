"use client";

import React from 'react';
import siteConfig from '@/app/data/siteconfig.json';
import { PageTitleHeader, PageSection, ServicesList } from '@pixelated-tech/components';

export default function ServicesPage() {
	const siteInfo = (siteConfig as any).siteInfo;

	return (
		<>
			<PageTitleHeader title="Our Services" />
			<PageSection columns={1} maxWidth="1024px" id="services-intro">
				<p>
					Simple Day Concierge provides a full suite of digital services for small businesses in New Jersey and South Carolina. Browse our service offerings and click through to learn how we can support your online growth.
				</p>
			</PageSection>

			<ServicesList 
				siteInfo={siteInfo}
				title="Summary of Our Services"
				intro="Click a service to read more about how it works for your business."
				servicePathPrefix="/services"

				variant="grid"
				boxShape="bevel"
				layout="horizontal"
				direction="left"
				gridColumns={{ left: 1, right: 3 }}
				imgShape="bevel"
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
