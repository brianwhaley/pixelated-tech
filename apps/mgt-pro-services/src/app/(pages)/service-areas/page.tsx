"use client";

import React from 'react';
import { PageTitleHeader, PageSection, ServiceAreas, usePixelatedConfig } from '@pixelated-tech/components';

export default function ServiceAreasPage() {
	const config = usePixelatedConfig();
	const siteInfo = config?.siteInfo;
	const siteName = siteInfo?.name || "Mgt Pro Services";

	return (
		<>
			<PageTitleHeader title={`${siteName} Service Areas`} />
			<PageSection columns={1} maxWidth="1024px" id="service-areas-intro">
				<p>
					MGT Pro Services currently lists South Carolina markets for residential flooring, commercial flooring, and selected renovation assessments. Local project fit, access, and scope are confirmed during the assessment process.
				</p>
			</PageSection>

			<ServiceAreas
				
				title={`${siteName} Service Areas`}
				intro="Review the residential and commercial project context for each listed South Carolina market."
				serviceAreaPathPrefix="/service-areas"
			/>
			
			<PageSection columns={1} maxWidth="1024px" id="services-link-section">
				<p>
					Review <a href="/services">MGT flooring and renovation services</a> to understand the current offerings.
				</p>
				<p>
					<a href="/request-an-assessment">Request an assessment</a> to share your location and project details.
				</p>
			</PageSection>
			
		</>
	);
}
