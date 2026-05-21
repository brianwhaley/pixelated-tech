"use client";

import React from "react";
import PropTypes, { InferProps } from 'prop-types';
import { PageSection, PageSectionHeader, PageGridItem } from './semantic';
import { Callout } from './callout';
import { contentfulValueToSlug } from '../integrations/contentful.delivery';
import type { SiteInfoType } from '../config/siteconfig.types';


const defaultServiceAreaPathPrefix = '/service-areas';

export function buildServiceAreaUrl(item: { name: string }, prefix = defaultServiceAreaPathPrefix) {
	const slug = contentfulValueToSlug({ value: item.name });
	return slug ? `${prefix}/${slug}` : prefix;
}

function resolveServiceAreas(props: any) {
	return props.serviceAreas && props.serviceAreas.length
		? props.serviceAreas
		: props.siteInfo?.serviceAreas || [];
}

function findServiceAreaBySlug(props: any) {
	const items = props.serviceAreas?.length ? props.serviceAreas : props.siteInfo?.serviceAreas || [];
	if (props.serviceArea) return props.serviceArea;
	const slug = props.serviceAreaSlug || '';
	return items.find((item: any) => {
		const itemSlug = contentfulValueToSlug({ value: item.name });
		return itemSlug === slug;
	}) || undefined;
}






/**
 * ServiceAreasList propTypes define the list data shape for rendering a grid of service area cards.
 */
ServiceAreasList.propTypes = {
	/** Optional service area list to render. */
	serviceAreas: PropTypes.arrayOf(PropTypes.shape({
		name: PropTypes.string.isRequired,
		description: PropTypes.string.isRequired,
		short_description: PropTypes.string,
		highlights: PropTypes.arrayOf(PropTypes.string),
		relatedServices: PropTypes.arrayOf(PropTypes.string),
	})),
	/** Site info fallback containing service area data. */
	siteInfo: PropTypes.shape({
		serviceAreas: PropTypes.arrayOf(PropTypes.shape({
			name: PropTypes.string.isRequired,
			description: PropTypes.string.isRequired,
			short_description: PropTypes.string,
			highlights: PropTypes.arrayOf(PropTypes.string),
			relatedServices: PropTypes.arrayOf(PropTypes.string),
		})),
	}),
	/** Section title to display above the list. */
	title: PropTypes.string,
	/** Introductory text shown under the title. */
	intro: PropTypes.string,
	/** Optional URL prefix for service area cards. */
	serviceAreaPathPrefix: PropTypes.string,
	/** HTML id attribute for the list section. */
	id: PropTypes.string,
};
export type ServiceAreasListType = InferProps<typeof ServiceAreasList.propTypes>;
export function ServiceAreasList({ serviceAreas, siteInfo, title = 'Service Areas', intro, serviceAreaPathPrefix = defaultServiceAreaPathPrefix, id }: ServiceAreasListType) {
	const items = resolveServiceAreas({ serviceAreas, siteInfo, title, intro, serviceAreaPathPrefix, id });
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
		description: PropTypes.string.isRequired,
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
 * ServiceAreaDetailPage propTypes define the incoming service area detail lookup data shape.
 * 
 * @param {ServiceAreaDetailPageType} props - The properties for the ServiceAreaDetailPage component, including the service area data, lookup lists, slug for resolution, and display options.
 * @return A detailed page section for the active service area, including the name, description, highlights, related services, and a link to the service area page.
 */
ServiceAreaDetailPage.propTypes = {
	/** Active service area object to render. */
	serviceArea: PropTypes.shape({
		name: PropTypes.string.isRequired,
		description: PropTypes.string.isRequired,
		short_description: PropTypes.string,
		highlights: PropTypes.arrayOf(PropTypes.string),
		relatedServices: PropTypes.arrayOf(PropTypes.string),
	}),
	/** Optional list of service areas for lookup. */
	serviceAreas: PropTypes.arrayOf(PropTypes.shape({
		name: PropTypes.string.isRequired,
		description: PropTypes.string.isRequired,
		short_description: PropTypes.string,
		highlights: PropTypes.arrayOf(PropTypes.string),
		relatedServices: PropTypes.arrayOf(PropTypes.string),
	})),
	/** Site info fallback containing service area and service data. */
	siteInfo: PropTypes.shape({
		serviceAreas: PropTypes.arrayOf(PropTypes.shape({
			name: PropTypes.string.isRequired,
			description: PropTypes.string.isRequired,
			short_description: PropTypes.string,
			highlights: PropTypes.arrayOf(PropTypes.string),
			relatedServices: PropTypes.arrayOf(PropTypes.string),
		})),
		services: PropTypes.arrayOf(PropTypes.shape({
			name: PropTypes.string.isRequired,
		})),
	}),
	/** Slug used to resolve the active service area. */
	serviceAreaSlug: PropTypes.string,
	/** Page title override. */
	title: PropTypes.string,
	/** Optional URL prefix for service area detail links. */
	serviceAreaPathPrefix: PropTypes.string,
	/** HTML id attribute for the detail section. */
	id: PropTypes.string,
};
export type ServiceAreaDetailPageType = InferProps<typeof ServiceAreaDetailPage.propTypes>;
export function ServiceAreaDetailPage({ serviceArea, serviceAreas, siteInfo, serviceAreaSlug, title, serviceAreaPathPrefix = defaultServiceAreaPathPrefix, id }: ServiceAreaDetailPageType) {
	const activeArea = findServiceAreaBySlug({ serviceArea, serviceAreas, siteInfo, serviceAreaSlug, title, serviceAreaPathPrefix, id });
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
				<p>{activeArea.description}</p>
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

