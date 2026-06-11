"use client";

import React, { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { PageTitleHeader, PageSection, ServiceDetail, contentfulValueToSlug, usePixelatedConfig } from '@pixelated-tech/components';

export default function ServiceDetailPage() {
	const params = useParams();
	const serviceSlug = typeof params?.service === 'string' ? params.service : '';
	const pixelatedConfig = usePixelatedConfig();
	const siteInfo = pixelatedConfig?.siteInfo ?? {};

	const activeService = useMemo(() => {
		const services = siteInfo?.services || [];
		return services.find((service) => {
			const slug = service.slug ? contentfulValueToSlug({ value: service.slug }) : contentfulValueToSlug({ value: service.name });
			return slug === serviceSlug;
		});
	}, [siteInfo, serviceSlug]);

	return (
		<>
			<PageTitleHeader title={`${siteInfo?.name ?? 'Site'}${activeService?.name ? ` - ${activeService.name}` : ' - Service'}`} />
			<PageSection columns={1} maxWidth="1024px" id="service-detail-wrapper">
				{activeService ? (
					<ServiceDetail
						serviceSlug={serviceSlug}
						
						
					/>
				) : (
					<p>Service not found. Please return to the services list and choose another option.</p>
				)}
			</PageSection>
		</>
	);
}
