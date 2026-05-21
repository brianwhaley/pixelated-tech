"use client";

import React, { useMemo } from 'react';
import { useParams } from 'next/navigation';
import siteConfig from '@/app/data/siteconfig.json';
import { PageTitleHeader, PageSection, ServiceAreaDetailPage, contentfulValueToSlug } from '@pixelated-tech/components';

export default function ServiceAreaDetailRoute() {
	const params = useParams();
	const serviceAreaSlug = typeof params?.serviceArea === 'string' ? params.serviceArea : '';
	const siteInfo = (siteConfig as any).siteInfo;

	const activeServiceArea = useMemo(() => {
		const serviceAreas = siteInfo?.serviceAreas || [];
		return serviceAreas.find((area: any) => {
			const slug = area.slug ? contentfulValueToSlug({ value: area.slug }) : contentfulValueToSlug({ value: area.name });
			return slug === serviceAreaSlug;
		});
	}, [siteInfo, serviceAreaSlug]);

	return (
		<>
			<PageTitleHeader title={activeServiceArea?.name ? `${activeServiceArea.name}` : 'Service Area'} />
			<PageSection columns={1} maxWidth="1024px" id="service-area-detail-wrapper">
				{activeServiceArea ? (
					<ServiceAreaDetailPage
						serviceArea={activeServiceArea}
						siteInfo={siteInfo}
						serviceAreaPathPrefix="/service-areas"
					/>
				) : (
					<p>Service area not found. Please return to the service areas list and choose another region.</p>
				)}
			</PageSection>
		</>
	);
}
