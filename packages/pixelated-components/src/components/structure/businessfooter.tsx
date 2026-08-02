'use client';

import React from 'react';
import PropTypes, { InferProps } from 'prop-types';
import { usePixelatedConfig } from '../config/config.client';
import { PageSection, PageSectionHeader } from './page-blocks';
import './businessfooter.css';

function buildAddressQuery(address?: {
	streetAddress?: string | null;
	addressLocality?: string | null;
	addressRegion?: string | null;
	postalCode?: string | null;
	addressCountry?: string | null;
} | null) {
	if (!address) return '';
	return [
		address.streetAddress,
		address.addressLocality,
		address.addressRegion,
		address.postalCode,
		address.addressCountry,
	]
		.filter(Boolean)
		.join(', ');
}

function formatTimeString(value?: string | null) {
	if (!value) return undefined;
	const normalized = value.toString().trim();
	const date = new Date(`1970-01-01T${normalized}`);
	return Number.isNaN(date.getTime())
		? normalized
		: new Intl.DateTimeFormat('en-US', {
			hour: 'numeric',
			minute: 'numeric',
			hour12: true
		}).format(date);
}

function buildOpeningHoursDisplay(value: unknown) {
	if (!value) return [];
	if (typeof value === 'string') {
		return [value];
	}
	if (Array.isArray(value)) {
		return value
			.map((entry) => {
				if (typeof entry === 'string') {
					return entry;
				}
				if (!entry || typeof entry !== 'object') {
					return undefined;
				}
				const day = String(entry.day || '').trim();
				if (!day) return undefined;
				if (entry.closed) {
					return `${day}: Closed`;
				}
				const open = formatTimeString(entry.open?.toString?.().trim());
				const close = formatTimeString(entry.close?.toString?.().trim());
				if (open && close) {
					return `${day}: ${open} - ${close}`;
				}
				if (entry.hours) {
					const [openHours, closeHours] = entry.hours.toString().trim().split(/\s*-\s*/);
					const formattedOpen = formatTimeString(openHours);
					const formattedClose = formatTimeString(closeHours);
					if (formattedOpen && formattedClose) {
						return `${day}: ${formattedOpen} - ${formattedClose}`;
					}
					return `${day}: ${entry.hours.toString().trim()}`;
				}
				return undefined;
			})
			.filter(Boolean);
	}
	return [];
}






/**
 * BusinessFooterAddress
 * Displays the business's address and contact information, with a link to Google Maps if an address is provided.
 * @param no props
 * @returns {JSX.Element} 
 */
BusinessFooterAddress.propTypes = { /** no props */ };
export type BusinessFooterAddressType = InferProps<typeof BusinessFooterAddress.propTypes>;
export function BusinessFooterAddress(props: BusinessFooterAddressType) {
	const config = usePixelatedConfig();
	const siteInfo = config?.siteInfo;
	const name = siteInfo?.name;
	const address = siteInfo?.address;
	const addressAdditionalInfo = siteInfo?.addressAdditionalInfo;
	const telephone = siteInfo?.telephone;
	const email = siteInfo?.email;
	const addressQuery = buildAddressQuery(address ?? null);
	const mapsUrl = addressQuery
		? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressQuery)}`
		: undefined;

	return (
		<>
			<PageSectionHeader title={name || 'Business Info'} />
			{address ? (
				<>
					{mapsUrl ? (
						<a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="business-footer-address-link">
							<div>{address.streetAddress}</div>
							<div>
								{address.addressLocality}, {address.addressRegion} {address.postalCode}
							</div>
						</a>
					) : (
						<>
							<div>{address.streetAddress}</div>
							<div>
								{address.addressLocality}, {address.addressRegion} {address.postalCode}
							</div>
						</>
					)}
					{addressAdditionalInfo ? (
						<div className="business-footer-address-note">{addressAdditionalInfo}</div>
					) : null}
				</>
			) : null}
			<PageSectionHeader title="Contact Us" />
			{telephone ? (
				<div><a href={`tel:${telephone}`}>{telephone}</a></div>
			) : null}
			{email ? (
				<div><a href={`mailto:${email}`}>{email}</a></div>
			) : null}
		</>
	);
}






/**
 * BusinessFooterMap
 * Displays a Google Maps iframe of the business's location if an address is provided.
 * @param no props
 * @returns {JSX.Element}
 */
BusinessFooterMap.propTypes = { /** no props */ };
export type BusinessFooterMapType = InferProps<typeof BusinessFooterMap.propTypes>;
export function BusinessFooterMap(props: BusinessFooterMapType) {
	const config = usePixelatedConfig();
	const siteInfo = config?.siteInfo;
	const address = siteInfo?.address;
	const googleMapsApiKey = config?.integrations?.googleMaps?.apiKey || config?.integrations?.google?.api_key;
	const addressQuery = buildAddressQuery(address ?? null);
	const embedUrl = addressQuery
		? googleMapsApiKey
			? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(googleMapsApiKey)}&q=${encodeURIComponent(addressQuery)}`
			: `https://www.google.com/maps?q=${encodeURIComponent(addressQuery)}&output=embed`
		: undefined;
	return embedUrl ? (
		<iframe
			title="Business location map"
			src={embedUrl}
			width="100%"
			height="300"
			style={{ border: 0 }}
			allowFullScreen
			loading="lazy"
			referrerPolicy="no-referrer-when-downgrade"
		/>
	) : (
		<div className="business-footer-map-placeholder">Map unavailable</div>
	);
}




/**
 * BusinessFooterHours
 * Displays the business's opening hours in a user-friendly format.
 * @param no props
 * @returns {JSX.Element}
 */
BusinessFooterHours.propTypes = { /** no props */ };
export type BusinessFooterHoursType = InferProps<typeof BusinessFooterHours.propTypes>;
export function BusinessFooterHours(props: BusinessFooterHoursType) {
	const config = usePixelatedConfig();
	const siteInfo = config?.siteInfo;
	const openingHours = siteInfo?.openingHours;
	const openingHoursAdditionalInfo = siteInfo?.openingHoursAdditionalInfo;
	const hours = buildOpeningHoursDisplay(openingHours);
	const hasHours = hours.length > 0;
	return (
		<>
			<h3>Hours</h3>
			{hasHours ? (
				<>
					<div className="business-footer-hours-list">
						{hours.map((line, index) => (
							<div key={index}>{line}</div>
						))}
					</div>
					{openingHoursAdditionalInfo ? (
						<div className="business-footer-hours-note">{openingHoursAdditionalInfo}</div>
					) : null}
				</>
			) : (
				<div>Hours not available</div>
			)}
		</>
	);
}






/**
 * BusinessFooter
 * Displays business contact information, opening hours, and an embedded Google Map.
 * It uses the PageSection component for layout and reads the Google Maps API key from the Pixelated config provider.
 * The component gracefully handles missing data and provides fallback content when necessary.
 * 
 * @param no props
 * @returns {JSX.Element}
 */
BusinessFooter.propTypes = { /** no props */ };
export type BusinessFooterType = InferProps<typeof BusinessFooter.propTypes>;
export function BusinessFooter() {
	const config = usePixelatedConfig();
	const siteInfo = config?.siteInfo;
	if (!siteInfo) { return null; }

	return (
		<PageSection className="business-footer-section" id="business-footer" layoutType="grid" columns={3} gap="24px" padding="40px 20px">
			<div className="business-footer-column business-footer-summary">
				<BusinessFooterAddress />
			</div>

			<div className="business-footer-column business-footer-map">
				<BusinessFooterMap />
			</div>

			<div className="business-footer-column business-footer-hours">
				<BusinessFooterHours />
			</div>
		</PageSection>
	);
}
