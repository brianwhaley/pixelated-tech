"use client";

import React from 'react';
import siteConfig from '@/app/data/siteconfig.json';
import { PageTitleHeader, PageSection, ServicesList } from '@pixelated-tech/components';

export default function ServicesPage() {
	const siteInfo = (siteConfig as any).siteInfo;

	return (
		<>
			<PageTitleHeader title="Manning Metalworks Services" />
			<PageSection columns={1} maxWidth="1024px" id="services-intro">
				<p>
					Manning Metalworks provides a wide range of metal fabrication services to meet the needs of our clients. From custom metalwork to large-scale industrial projects, we have the expertise and equipment to handle it all. Our team of skilled professionals is dedicated to delivering high-quality results on time and within budget. Whether you need a one-time project or ongoing support, we are here to help your business succeed with our comprehensive metal fabrication services.
				</p>
			</PageSection>

			<ServicesList
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
					<a href="/contact-us">Contact us</a> to learn more about our services, service areas, and how we can support your needs in your area. We are committed to providing excellent service and local expertise wherever you are.
				</p>
			</PageSection>

		</>
	);
}
