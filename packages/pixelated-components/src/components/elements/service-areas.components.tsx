"use client";

import React from "react";
import PropTypes, { InferProps } from 'prop-types';
import { PageSection, PageSectionHeader, PageGridItem } from '../structure/page-blocks';
import { Callout } from '../structure/callout';
import { contentfulValueToSlug } from '../integrations/contentful.delivery';
import { usePixelatedConfig } from '../config/config.client';


const defaultServiceAreaPathPrefix = '/service-areas';

export function buildServiceAreaUrl(item: { name: string }, prefix = defaultServiceAreaPathPrefix) {
	const slug = contentfulValueToSlug({ value: item.name });
	return slug ? `${prefix}/${slug}` : prefix;
}

function findServiceAreaBySlug(siteInfo: any, serviceAreaSlug: string) {
	const items = siteInfo?.serviceAreas || [];
	const slug = serviceAreaSlug || '';
	return items.find((item: any) => {
		const itemSlug = contentfulValueToSlug({ value: item.name });
		return itemSlug === slug;
	}) || undefined;
}

function renderServiceAreaDescription(description: string | Array<string | null | undefined> | undefined) {
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
 * ServiceAreas propTypes define the list data shape for rendering a grid of service area cards.
 * The component uses the config provider's `siteInfo.serviceAreas` data internally.
 */
ServiceAreas.propTypes = {
	/** Section title to display above the list. */
	title: PropTypes.string,
	/** Introductory text shown under the title. */
	intro: PropTypes.string,
	/** Optional URL prefix for service area cards. */
	serviceAreaPathPrefix: PropTypes.string,
	/** HTML id attribute for the list section. */
	id: PropTypes.string,
};
export type ServiceAreasType = InferProps<typeof ServiceAreas.propTypes>;
export function ServiceAreas({ title = 'Service Areas', intro, serviceAreaPathPrefix = defaultServiceAreaPathPrefix, id }: ServiceAreasType) {
	const config = usePixelatedConfig();
	const siteInfo = config?.siteInfo;
	const items = siteInfo?.serviceAreas || [];
	if (!items?.length) {
		return null;
	}

	return (
		<>
			<PageSection id={`${id}-header`} columns={1}>
				<PageSectionHeader title={title ?? 'Service Areas'} />
				{intro ? <p>{intro}</p> : null}
			</PageSection>
			<PageSection id={id} className="service-areas-list" layoutType="grid" gap="24px" columns={3}>
				{items.map((serviceArea: any, index: number) => (
					<PageGridItem key={index}>
						<ServiceAreaCard key={index} serviceArea={serviceArea} serviceAreaPathPrefix={serviceAreaPathPrefix} />
					</PageGridItem>
				))}
			</PageSection>
		</>
	);
}





/**
 * ServiceAreaCard propTypes define the incoming service area data shape used to render the card.
 * 
 * @param {ServiceAreaCardType} props - The properties for the ServiceAreaCard component, including the service area data and an optional URL prefix for links.
 * @return A Callout component representing the service area, with a title, description, highlights, related services, and a link to learn more.
 */
ServiceAreaCard.propTypes = {
	/** Service area object to render in the card. */
	serviceArea: PropTypes.shape({
		name: PropTypes.string.isRequired,
		description: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]).isRequired,
		short_description: PropTypes.string,
		keywords: PropTypes.arrayOf(PropTypes.string),
		highlights: PropTypes.arrayOf(PropTypes.string),
		relatedServices: PropTypes.arrayOf(PropTypes.string),
		image: PropTypes.string,
	}).isRequired,
	/** Optional URL prefix for service area links. */
	serviceAreaPathPrefix: PropTypes.string,
};
export type ServiceAreaCardType = InferProps<typeof ServiceAreaCard.propTypes>;
export function ServiceAreaCard({ serviceArea, serviceAreaPathPrefix = defaultServiceAreaPathPrefix }: ServiceAreaCardType) {
	const url = buildServiceAreaUrl(serviceArea, serviceAreaPathPrefix ?? defaultServiceAreaPathPrefix);
	const keywords = serviceArea.keywords ? serviceArea.keywords.join(', ') : undefined;
	return (
		<Callout
			variant="boxed"
			layout="vertical"
			direction="left"
			title={serviceArea.name}
			content={serviceArea.short_description}
			url={url}
			buttonText="Learn more"
			img={serviceArea.image}
			imgAlt={serviceArea.name}
		/>
	);
}




/**
 * ServiceAreaDetail propTypes define the incoming service area detail lookup data shape.
 * The component resolves the active service area from `siteInfo.serviceAreas` in the config provider.
 * 
 * @param {ServiceAreaDetailType} props - The properties for the ServiceAreaDetail component, including the slug used to resolve the service area, title override, URL prefix, and display options.
 * @return A detailed page section for the active service area, including the name, description, highlights, related services, and a link to the service area page.
 */
ServiceAreaDetail.propTypes = {
	/** Slug used to resolve the active service area from config. */
	serviceAreaSlug: PropTypes.string,
	/** Page title override. */
	title: PropTypes.string,
	/** Optional URL prefix for service area detail links. */
	serviceAreaPathPrefix: PropTypes.string,
	/** HTML id attribute for the detail section. */
	id: PropTypes.string,
};
export type ServiceAreaDetailType = InferProps<typeof ServiceAreaDetail.propTypes>;
export function ServiceAreaDetail({ serviceAreaSlug, title, serviceAreaPathPrefix = defaultServiceAreaPathPrefix, id }: ServiceAreaDetailType) {
	const config = usePixelatedConfig();
	const siteInfo = config?.siteInfo;
	const activeArea = findServiceAreaBySlug(siteInfo, serviceAreaSlug ?? '');
	if (!activeArea) {
		return null;
	}
	const url = buildServiceAreaUrl(activeArea, serviceAreaPathPrefix ?? defaultServiceAreaPathPrefix);
	const services = (siteInfo?.services ?? []) as Array<{ name: string }>;
	const serviceLinks = services.map((service: { name: string }) => {
		const href = `/services/${contentfulValueToSlug({ value: service.name })}`;
		return { name: service.name, href };
	});
	return (
		<PageSection id={id} className="service-area-detail-page" layoutType="none" gap="20px">
			<PageSectionHeader title={title ?? activeArea.name} />
			<div className="service-area-detail-copy">
				{renderServiceAreaDescription(activeArea.description)}
				{activeArea.highlights ? (
					<>
						<h4>Highlights</h4>
						<ul>
							{activeArea.highlights.map((highlight: string, idx: number) => (<li key={idx}>{highlight}</li>))}
						</ul>
					</>
				) : null}
				{serviceLinks.length ? (
					<div>
						<p><strong>Related services:</strong></p>
						<ul>
							{serviceLinks.map((service, idx: number) => (
								<li key={idx}>
									<a href={service.href}>{service.name}</a>
								</li>
							))}
						</ul>
					</div>
				) : null}
			</div>
		</PageSection>
	);
}

