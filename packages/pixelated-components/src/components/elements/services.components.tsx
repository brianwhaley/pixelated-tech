"use client";

import React from "react";
import PropTypes, { InferProps } from 'prop-types';
import { PageSection, PageSectionHeader, PageGridItem } from '../structure/page-blocks';
import { Callout, variants, shapes, layouts, directions } from '../structure/callout';
import { buildServiceAreaUrl } from './service-areas.components';
import { formatServiceDescription, renderArrayToParagraphs, ServicesSchema } from '../foundation/schema';
import { usePixelatedConfig } from '../config/config.client';
import { SmartImage } from './smartimage';
import { defaultServicePathPrefix, getServicePathPrefix, buildServiceUrl, resolveServices, findServiceBySlug } from './services.functions';






/**
 * Services renders a list of services offered by the business using the config provider's `siteInfo.services` data. Each service is displayed as a Callout card with its name, description, area served, and an optional link to learn more. The component also supports an optional title and introductory text for the section.
 * 
 * @param {ServiceListProps} props - The properties for the Services component, including the section title, introductory text, and HTML id attribute.
 * @return A PageSection containing a list of services, or null if no services are available.
 */
Services.propTypes = {
	variant: PropTypes.oneOf([...variants]),
	boxShape: PropTypes.oneOf([...shapes]),
	layout: PropTypes.oneOf([...layouts]),
	direction: PropTypes.oneOf([...directions]),
	gridColumns: PropTypes.shape({
		left: PropTypes.number,
		right: PropTypes.number,
	}),
	imgShape: PropTypes.oneOf([...shapes]),
	title: PropTypes.string,
	intro: PropTypes.string,
	id: PropTypes.string,
};
export type ServicesType = InferProps<typeof Services.propTypes>;
export function Services({ title, intro, id = 'services-list', variant, boxShape, layout, direction, gridColumns, imgShape }: ServicesType) {
	const config = usePixelatedConfig();
	const siteInfo = config?.siteInfo;
	const resolvedPrefix = getServicePathPrefix(siteInfo);
	const items = resolveServices({ siteInfo });
	if (!items?.length) { return null; }
	return (
		<>
			{ (title || intro) ? (
				<PageSection id={`${id}-header`} columns={1}>
				    <PageSectionHeader title={title ?? 'Our Services'} />
				    {intro ? intro : null}
				</PageSection>
			) : null }
			<PageSection id={`${id}-section`} columns={1}>
				{items.map((service: ServiceCardType['service'], index: number) => (
					<PageGridItem key={index}>
			        <ServiceCard
							key={index}
							index={index}
							service={service}
							servicePathPrefix={resolvedPrefix}
							variant={variant}
							boxShape={boxShape}
							layout={layout}
							direction={direction}
							gridColumns={gridColumns}
							imgShape={imgShape}
						/>
					</PageGridItem>
				))}
			</PageSection>
		</>
	);
}





/**
 * ServiceCard renders an individual service offering as a Callout card, displaying the service name, description, area served, and an optional link to learn more. The URL for the "Learn more" link is constructed based on the service's slug or name and an optional prefix. This component is used within the Services to display each service in a consistent format.
 * 
 * @param {ServiceCardType} props - The properties for the ServiceCard component, including the service data and an optional URL prefix for the service link.
 * @returns A Callout component representing the service offering.
 */
ServiceCard.propTypes = {
	index: PropTypes.number.isRequired,
	service: PropTypes.shape({
		name: PropTypes.string.isRequired,
		description: PropTypes.arrayOf(PropTypes.string).isRequired,
		short_description: PropTypes.string,
		image: PropTypes.string,
		url: PropTypes.string,
		slug: PropTypes.string,
		termsOfService: PropTypes.string,
	}).isRequired,
	servicePathPrefix: PropTypes.string,
	variant: PropTypes.oneOf([...variants]),
	boxShape: PropTypes.oneOf([...shapes]),
	layout: PropTypes.oneOf([...layouts]),
	direction: PropTypes.oneOf([...directions]),
	gridColumns: PropTypes.shape({
		left: PropTypes.number,
		right: PropTypes.number,
	}),
	imgShape: PropTypes.oneOf([...shapes]),
};
export type ServiceCardType = InferProps<typeof ServiceCard.propTypes>;
export function ServiceCard({ index, service, servicePathPrefix = defaultServicePathPrefix, variant, boxShape, layout, direction, gridColumns, imgShape }: ServiceCardType) {
	const url = buildServiceUrl(service, servicePathPrefix);
	const effectiveVariant = variant ?? 'boxed grid';
	const effectiveBoxShape = boxShape ?? 'squircle';
	const effectiveLayout = layout ?? 'horizontal';
	const effectiveDirection = direction ?? (index % 2 === 0 ? 'left' : 'right');
	const effectiveGridLeft = gridColumns?.left ?? 1;
	const effectiveGridRight = gridColumns?.right ?? 3;
	const effectiveGridColumns = (index % 2 === 0 ? {left: effectiveGridLeft, right: effectiveGridRight} : {left: effectiveGridRight, right: effectiveGridLeft});
	const effectiveImgShape = imgShape ?? 'square';
	return (
		<>
			<Callout
				variant={effectiveVariant}
				boxShape={effectiveBoxShape}
				gridColumns={effectiveGridColumns}
				layout={effectiveLayout}
				direction={effectiveDirection}
				imgShape={effectiveImgShape}
				title={service.name}
				content={service.short_description}
				url={url}
				img={service.image}
				imgAlt={service.name}
				buttonText={`View ${service.name}`}
			/>
			<ServicesSchema />
		</>
	);
}




/**
 * ServiceDetail propTypes enforce the shape of the service detail data used by the component.
 * Each service may include a name, description, url, and slug property.
 * The component resolves service details from `siteInfo.services` only and does not accept service data overrides.
 * 
 * @param {ServiceDetailType} props - The properties for the ServiceDetail component, including the slug to identify the service, an optional section title, and an HTML id attribute.
 * @returns A PageSection containing the details of the specified service, or null if the service cannot be found.
 */
ServiceDetail.propTypes = {
	serviceSlug: PropTypes.string,
	title: PropTypes.string,
	id: PropTypes.string,
};
export type ServiceDetailType = InferProps<typeof ServiceDetail.propTypes>;
export function ServiceDetail({ serviceSlug, title, id }: ServiceDetailType) {
	const config = usePixelatedConfig();
	const siteInfo = config?.siteInfo;
	const resolvedPrefix = getServicePathPrefix(siteInfo);
	const activeService = findServiceBySlug(serviceSlug ?? '', siteInfo);
	if (!activeService) {
		return null;
	}
	const url = buildServiceUrl(activeService, resolvedPrefix);
	const serviceAreaItems = (siteInfo?.serviceAreas ?? []) as Array<{ name: string }>;
	const serviceImage = activeService.image || siteInfo?.image;
	return (
		<PageSection id={id} className="servicedetailpage" layoutType="none" gap="20px">
			<ServicesSchema />
			{serviceImage ? (
				<SmartImage src={serviceImage} alt={activeService.name} style={{ width: '100%', height: '300px', objectFit: 'cover', margin: '20px 0px' }} />
			) : null}
			<div className="service-detail-copy">
				{renderArrayToParagraphs(activeService.description)}
				{serviceAreaItems.length ? (
					<div>
						<p><strong>Areas where {siteInfo?.name} provides {activeService.name}:</strong></p>
						<ul>
							{serviceAreaItems.map((area, index) => (
								<li key={index}>
									<a href={buildServiceAreaUrl(area)}>{activeService.name} in {area.name}</a>
								</li>
							))}
						</ul>
					</div>
				) : null}
				{activeService.termsOfService?.trim() ? (<p><a href={activeService.termsOfService.trim()}>Terms of Service</a></p>) : null}
			</div>
		</PageSection>
	);
}
