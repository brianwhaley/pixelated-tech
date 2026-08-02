"use client";

import React, { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { PageSection, ServiceAreaDetail, contentfulValueToSlug, usePixelatedConfig } from '@pixelated-tech/components';
import * as CalloutLibrary from '@/app/elements/calloutlibrary';

export default function ServiceAreaDetailPage() {
	const params = useParams();
	const serviceAreaSlug = typeof params?.serviceArea === 'string' ? params.serviceArea : '';
	const pixelatedConfig = usePixelatedConfig();
	const siteInfo = pixelatedConfig?.siteInfo;

	const activeServiceArea = useMemo(() => {
		const serviceAreas = siteInfo?.serviceAreas || [];
		return serviceAreas.find((area: any) => {
			const slug = area.slug ? contentfulValueToSlug({ value: area.slug }) : contentfulValueToSlug({ value: area.name });
			return slug === serviceAreaSlug;
		});
	}, [siteInfo, serviceAreaSlug]);

	return (
		<>

			<CalloutLibrary.PageTitle title={activeServiceArea?.name ? `Service Area - ${activeServiceArea.name}` : 'Service Area'}  />

			<PageSection columns={1} maxWidth="1024px" id="service-area-detail-wrapper">
				{activeServiceArea ? (
					<>
						<ServiceAreaDetail serviceAreaSlug={serviceAreaSlug} />

						<p>
							These neighborhoods are highly desirable because of their world-class amenities, championship golf courses, and preservation of the natural Lowcountry aesthetic. Property values continue to climb here as more people seek the balance of luxury and coastal living. Palmetto Epoxy contributes to this value by helping homeowners protect their investments with high-end finishes that withstand the salt air. Our services ensure these properties maintain their "Lowcountry's Best" quality. If you live outside of {activeServiceArea?.name}, you can <a href="/service-areas">view all of our service areas here</a>.
						</p>
                        
						<p>
							If you are a resident, or are planning a move to the {activeServiceArea?.name} area, Palmetto Epoxy is ready to help you elevate your property. We specialize in industrial-strength <a href="/services">services</a> tailored for the coast. Reach out today to <a href="/contact">schedule your expert quote</a> and protect your home's value.
						</p>
					</>
				) : (
					<p>Service area not found. Please return to the service areas list and choose another region.</p>
				)}
			</PageSection>
		</>
	);
}
