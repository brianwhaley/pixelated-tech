"use client";

import React from "react";
import PropTypes, { InferProps } from 'prop-types';
import { PageSection, PageSectionHeader, PageGridItem } from './semantic';
import { Callout } from './callout';
import { buildServiceAreaUrl } from './service-areas.components';
import { contentfulValueToSlug } from '../integrations/contentful.delivery';
import { formatServiceDescription } from '../foundation/schema';
import type { SiteInfoType } from '../config/siteconfig.types';
import { SmartImage } from './smartimage';
import { defaultServicePathPrefix, getServicePathPrefix, buildServiceUrl, resolveServices, findServiceBySlug } from './services.functions';

function renderServiceDescription(description: string | Array<string | null | undefined> | undefined) {
	if (Array.isArray(description)) {
		return description
			.filter((paragraph): paragraph is string => typeof paragraph === 'string')
			.map((paragraph, index) => (
				<p key={index}>{paragraph}</p>
			));
	}
	return description ? <p>{description}</p> : null;
}





/**
 * ServicesList renders a list of services offered by the business, using either a provided array of services or falling back to the siteInfo.services data. Each service is displayed as a Callout card with its name, description, area served, and an optional link to learn more. The component also supports an optional title and introductory text for the section.
 * 
 * @param {ServiceListProps} props - The properties for the ServicesList component, including an optional array of services, site information for fallback, section title, introductory text, URL prefix for service links, and an HTML id attribute.
 * @return A PageSection containing a list of services, or null if no services are available.
 * 
 */
ServicesList.propTypes = {
	services: PropTypes.arrayOf(PropTypes.shape({
		name: PropTypes.string.isRequired,
		description: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]).isRequired,
		short_description: PropTypes.string,
		image: PropTypes.string,
	})),
	siteInfo: PropTypes.shape({
		services: PropTypes.arrayOf(PropTypes.shape({
			name: PropTypes.string.isRequired,
			description: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]).isRequired,
			short_description: PropTypes.string,
		})),
	}),
	title: PropTypes.string,
	intro: PropTypes.string,
	servicePathPrefix: PropTypes.string,
	id: PropTypes.string,
};
export type ServicesListType = InferProps<typeof ServicesList.propTypes>;
export function ServicesList({ services, siteInfo, title = 'Our Services', intro, servicePathPrefix, id }: ServicesListType) {
	const resolvedPrefix = getServicePathPrefix(siteInfo, servicePathPrefix ?? null);
	const items = resolveServices({ services, siteInfo });
	if (!items?.length) {
		return null;
	}
	return (
		<>
			<PageSection id={`${id}-header`} columns={1}>
			    <PageSectionHeader title={title ?? 'Our Services'} />
			    {intro ? intro : null}
			</PageSection>
			<PageSection id={id} columns={1}>
				{items.map((service: ServiceCardType['service'], index: number) => (
					<PageGridItem key={index}>
				        <ServiceCard key={index} index={index} service={service} servicePathPrefix={resolvedPrefix} />
					</PageGridItem>
				))}
			</PageSection>
		</>
	);
}





/**
 * ServiceCard renders an individual service offering as a Callout card, displaying the service name, description, area served, and an optional link to learn more. The URL for the "Learn more" link is constructed based on the service's slug or name and an optional prefix. This component is used within the ServicesList to display each service in a consistent format.
 * 
 * @param {ServiceCardType} props - The properties for the ServiceCard component, including the service data and an optional URL prefix for the service link.
 * @returns A Callout component representing the service offering.
 */
ServiceCard.propTypes = {
	index: PropTypes.number.isRequired,
	service: PropTypes.shape({
		name: PropTypes.string.isRequired,
		description: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]).isRequired,
		short_description: PropTypes.string,
		image: PropTypes.string,
		termsOfService: PropTypes.string,
	}).isRequired,
	servicePathPrefix: PropTypes.string,
};
export type ServiceCardType = InferProps<typeof ServiceCard.propTypes>;
export function ServiceCard({ index, service, servicePathPrefix = defaultServicePathPrefix }: ServiceCardType) {
	const url = buildServiceUrl(service, servicePathPrefix);
	return (
		<Callout
			variant="boxed grid"
			gridColumns={index % 2 === 0 ? {left:1, right:3} : {left:3, right:1}}
			layout="horizontal"
			direction={index % 2 === 0 ? "left" : "right"}
			title={service.name}
			content={service.short_description}
			url={url}
			buttonText="Learn more"
			img={service.image}
			imgAlt={service.name}
		/>
	);
}




/**
 * ServiceDetailPage propTypes enforce the shape of the service detail data used by the component.
 * Each service may include a name, description, url, slug property.
 * ServiceDetailPage propTypes enforce the shape of the service detail data used by the component.
 * Each service may include a name, description, url, slug property.
 * 
 * @param {ServiceDetailType} props - The properties for the ServiceDetailPage component, including the service data, an optional array of services for lookup, site information for fallback, the slug to identify the service, section title, URL prefix for service links, and an HTML id attribute.
 * @returns A PageSection containing the details of the specified service, or null if the service cannot be found.
 */
ServiceDetailPage.propTypes = {
	service: PropTypes.shape({
		name: PropTypes.string.isRequired,
		description: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]).isRequired,
		short_description: PropTypes.string,
		image: PropTypes.string,
		termsOfService: PropTypes.string,
	}),
	services: PropTypes.arrayOf(PropTypes.shape({
		name: PropTypes.string.isRequired,
		description: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]).isRequired,
		short_description: PropTypes.string,
		image: PropTypes.string,
		termsOfService: PropTypes.string,
	})),
	siteInfo: PropTypes.shape({
		services: PropTypes.arrayOf(PropTypes.shape({
			name: PropTypes.string.isRequired,
			description: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]).isRequired,
			short_description: PropTypes.string,
		})),
		image: PropTypes.string,
		serviceAreas: PropTypes.arrayOf(PropTypes.shape({
			name: PropTypes.string.isRequired,
			description: PropTypes.string,
			short_description: PropTypes.string,
		})),
	}),
	serviceSlug: PropTypes.string,
	title: PropTypes.string,
	servicePathPrefix: PropTypes.string,
	id: PropTypes.string,
};
export type ServiceDetailPageType = InferProps<typeof ServiceDetailPage.propTypes>;
export function ServiceDetailPage({ service, services, siteInfo, serviceSlug, title, servicePathPrefix, id }: ServiceDetailPageType) {
	const resolvedPrefix = getServicePathPrefix(siteInfo, servicePathPrefix ?? null);
	const lookupSource = services?.length ? { ...(siteInfo ?? {}), services } : siteInfo;
	const activeService = service ?? findServiceBySlug(serviceSlug ?? '', lookupSource);
	if (!activeService) {
		return null;
	}
	const url = buildServiceUrl(activeService, resolvedPrefix);
	const serviceAreaItems = (siteInfo?.serviceAreas ?? []) as Array<{ name: string }>;
	const serviceImage = activeService.image || siteInfo?.image;
	return (
		<PageSection id={id} className="service-detail-page" layoutType="none" gap="20px">
			{serviceImage ? (
				<SmartImage src={serviceImage} alt={activeService.name} style={{ width: '100%', height: '300px', objectFit: 'cover', margin: '20px 0px' }} />
			) : null}
			<div className="service-detail-copy">
				{renderServiceDescription(activeService.description)}
				{serviceAreaItems.length ? (
					<div>
						<p><strong>Areas served:</strong></p>
						<ul>
							{serviceAreaItems.map((area, index) => (
								<li key={index}>
									<a href={buildServiceAreaUrl(area)}>{area.name}</a>
								</li>
							))}
						</ul>
					</div>
				) : null}
				{activeService.termsOfService ? (<p><a href={activeService.termsOfService}>Terms of Service</a></p>) : null}
			</div>
		</PageSection>
	);
}
