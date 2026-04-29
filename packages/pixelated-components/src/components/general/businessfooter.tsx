'use client';

import React from 'react';
import PropTypes, { InferProps } from 'prop-types';
import { PageSection, PageSectionHeader } from './semantic';
import { normalizeOpeningHoursValue } from '../foundation/schema';
import type { SiteInfo } from '../config/config.types';
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

function buildGoogleMapsUrl(addressQuery: string) {
	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressQuery)}`;
}

function buildGoogleMapsEmbedUrl(addressQuery: string, apiKey?: string) {
	if (apiKey) {
		return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(addressQuery)}`;
	}
	return `https://www.google.com/maps?q=${encodeURIComponent(addressQuery)}&output=embed`;
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
 * BusinessFooter component displays business contact information, opening hours, and an embedded Google Map based on the provided siteInfo prop. It uses the PageSection component for layout and supports an optional Google Maps API key for enhanced map embedding. The component gracefully handles missing data and provides fallback content when necessary.
 * 
 * @param {BusinessFooterType} props - The props for the BusinessFooter component, including siteInfo and an optional googleMapsApiKey.
 * @returns {JSX.Element | null} The rendered BusinessFooter component or null if siteInfo is not provided.
 */
BusinessFooter.propTypes = {
	siteInfo: PropTypes.shape({
		name: PropTypes.string,
		email: PropTypes.string,
		telephone: PropTypes.string,
		url: PropTypes.string,
		address: PropTypes.shape({
			streetAddress: PropTypes.string,
			addressLocality: PropTypes.string,
			addressRegion: PropTypes.string,
			postalCode: PropTypes.string,
			addressCountry: PropTypes.string,
		}),
		openingHours: PropTypes.oneOfType([
			PropTypes.string,
			PropTypes.arrayOf(PropTypes.string),
			PropTypes.arrayOf(
				PropTypes.shape({
					day: PropTypes.string.isRequired,
					open: PropTypes.string,
					close: PropTypes.string,
					hours: PropTypes.string,
					closed: PropTypes.bool,
				})
			),
		]),
	}),
	googleMapsApiKey: PropTypes.string,
};
export type BusinessFooterType = InferProps<typeof BusinessFooter.propTypes>;
export function BusinessFooter(props: BusinessFooterType) {
	const { siteInfo, googleMapsApiKey } = props;
	if (!siteInfo) return null;

	const addressQuery = buildAddressQuery(siteInfo?.address ?? undefined);
	const mapsUrl = addressQuery ? buildGoogleMapsUrl(addressQuery) : undefined;
	const embedUrl = addressQuery ? buildGoogleMapsEmbedUrl(addressQuery, googleMapsApiKey ?? undefined) : undefined;
	const hours = buildOpeningHoursDisplay(siteInfo.openingHours);
	const hasHours = hours.length > 0;

	return (
		<PageSection className="business-footer-section" id="business-footer" layoutType="grid" columns={3} gap="24px" padding="40px 20px">
			<div className="business-footer-column business-footer-summary">
				<PageSectionHeader title={siteInfo.name || 'Business Info'} />
				{siteInfo.address ? (
					<>
						{mapsUrl ? (
							<a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="business-footer-address-link">
								{siteInfo.address.streetAddress}
							</a>
						) : (
							<div>{siteInfo.address.streetAddress}</div>
						)}
						<div>
							{siteInfo.address.addressLocality}, {siteInfo.address.addressRegion} {siteInfo.address.postalCode}
						</div>
					</>
				) : null}
				<PageSectionHeader title="Contact Us" />
				{siteInfo.telephone ? (
					<div><a href={`tel:${siteInfo.telephone}`}>{siteInfo.telephone}</a></div>
				) : null}
				{siteInfo.email ? (
					<div><a href={`mailto:${siteInfo.email}`}>{siteInfo.email}</a></div>
				) : null}
			</div>

			<div className="business-footer-column business-footer-map">
				{embedUrl ? (
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
				)}
			</div>

			<div className="business-footer-column business-footer-hours">
				<h3>Hours</h3>
				{hasHours ? (
					<div className="business-footer-hours-list">
						{hours.map((line, index) => (
							<div key={index}>{line}</div>
						))}
					</div>
				) : (
					<div>Hours not available</div>
				)}
			</div>
		</PageSection>
	);
}
