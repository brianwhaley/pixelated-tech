"use client";

import React from 'react';
import { PageTitleHeader, PageSection, Services, usePixelatedConfig } from '@pixelated-tech/components';
import { PageHero } from '@/app/elements/page-hero';
import { ServiceAreasCallout, ContactUsCallout } from '@/app/elements/callout-library';

export default function ServicesPage() {
	const config = usePixelatedConfig();
	const siteInfo = config?.siteInfo;
	const siteName = siteInfo?.name || "AMAVA Janitorial";

	return (
		<>
        
			<PageHero />
                    
			<PageSection columns={1} maxWidth="1024px" padding="20px" id="services-intro">
			    <PageTitleHeader title={`${siteName} Services`} />
				<p>
					{siteName} provides professional janitorial and facility maintenance services for commercial buildings, offices, and small businesses.
				</p>
			</PageSection>

			<Services
				variant="boxed grid"
				boxShape="square"
			/>

			<section id="services-callouts" style={{ backgroundColor: "var(--accent1-color)" }}>
				<ServiceAreasCallout />
				<ContactUsCallout />
			</section>

		</>
	);
}
