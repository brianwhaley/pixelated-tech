"use client";

import React from 'react';
import { PageTitleHeader, PageSection, Services, usePixelatedConfig } from '@pixelated-tech/components';

export default function ServicesPage() {
	const config = usePixelatedConfig();
	const siteInfo = config?.siteInfo;
	const siteName = siteInfo?.name || "Mgt Pro Services";

	return (
		<>
			<PageTitleHeader title={`${siteName} Services`} />
			<PageSection columns={1} maxWidth="1024px" id="services-intro">
				<p>
					{siteName} provides residential floor coatings, commercial floor coatings, and selected home renovation assessments. Review the service categories and request an assessment for your project.
				</p>
			</PageSection>

			<Services
				
				title={`${siteName} Services`}
				intro="Click a service to read more about how it works for your business."
				
			/>

			<PageSection columns={1} maxWidth="1024px" id="service-areas-link-section">
				<p>
					Review <a href="/service-areas">MGT service-area markets</a> currently listed for South Carolina assessment requests.
				</p>
				<p>
					<a href="/request-an-assessment">Request an assessment</a> to share your project type, location, surface, and timing.
				</p>
			</PageSection>

		</>
	);
}
