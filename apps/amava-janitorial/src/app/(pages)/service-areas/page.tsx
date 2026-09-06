"use client";

import React from 'react';
import { PageTitleHeader, PageSection, ServiceAreas, usePixelatedConfig } from '@pixelated-tech/components';
import { PageHero } from '@/app/elements/page-hero';
import { ServicesCallout, ContactUsCallout } from '@/app/elements/callout-library';


export default function ServiceAreasPage() {
	const config = usePixelatedConfig();
	const siteInfo = config?.siteInfo;
	const siteName = siteInfo?.name || "AMAVA Janitorial";

	return (
		<>

			<PageHero />

			<PageSection columns={1} maxWidth="1024px" padding="20px" id="service-areas-intro">
			    <PageTitleHeader title={`${siteName} Service Areas`} />
				<p>
					This site serves targeted geographic areas with localized services and expertise. Explore the regions where we deliver dependable service and local support.
				</p>
			</PageSection>

			<ServiceAreas
				
				title={`${siteName} Service Areas`}
				intro="Click a service area to read about the local coverage, specialties, and how we support businesses in that region."
				serviceAreaPathPrefix="/service-areas"
			/>

			<section id="services-callouts" style={{ backgroundColor: "var(--accent1-color)" }}>
				<ServicesCallout />
				<ContactUsCallout />
			</section>
            
			
		</>
	);
}
