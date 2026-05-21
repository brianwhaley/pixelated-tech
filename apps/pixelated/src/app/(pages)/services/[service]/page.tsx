"use client";

import React, { useMemo } from 'react';
import { useParams } from 'next/navigation';
import siteConfig from '@/app/data/siteconfig.json';
import { PageTitleHeader, PageSection, ServiceDetailPage, contentfulValueToSlug } from '@pixelated-tech/components';

export default function ServiceDetailRoute() {
	const params = useParams();
	const serviceSlug = typeof params?.service === 'string' ? params.service : '';
	const siteInfo = (siteConfig as any).siteInfo;

	const activeService = useMemo(() => {
		const services = siteInfo?.services || [];
		return services.find((service) => {
			const slug = service.slug ? contentfulValueToSlug({ value: service.slug }) : contentfulValueToSlug({ value: service.name });
			return slug === serviceSlug;
		});
	}, [siteInfo, serviceSlug]);

	return (
		<>
			<PageTitleHeader title={`Pixelated Technologies ${activeService?.name ? ` - ${activeService.name}` : ' - Service'}`} />
			<PageSection columns={1} maxWidth="1024px" id="service-detail-wrapper">
				{activeService ? (
					<ServiceDetailPage
						service={activeService}
						siteInfo={siteInfo}
						servicePathPrefix="/services"
					/>
				) : (
					<p>Service not found. Please return to the services list and choose another option.</p>
				)}
			</PageSection>
		</>
	);
}
