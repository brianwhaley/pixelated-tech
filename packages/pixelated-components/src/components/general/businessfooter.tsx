'use client';

import React from 'react';
import PropTypes, { InferProps } from 'prop-types';
import { PageSection, PageSectionHeader } from './semantic';
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
 * BusinessFooterAddress
 * Displays the business's address and contact information, with a link to Google Maps if an address is provided.
 * 
 * @param {Object} props
 * @param {string} [props.name] - The name of the business or location.
 * @param {Object} [props.address] - The structured address information.
 * @param {string} [props.address.streetAddress] - The street address.
 * @param {string} [props.address.addressLocality] - The city or locality.
 * @param {string} [props.address.addressRegion] - The state or region.
 * @param {string} [props.address.postalCode] - The postal code.
 * @param {string} [props.address.addressCountry] - The country.
 * @param {string} [props.addressAdditionalInfo] - Any additional information about the address (e.g. suite number, landmarks).
 * @param {string} [props.telephone] - The business's telephone number.
 * @param {string} [props.email] - The business's email address.
 * 
 * @returns {JSX.Element}
 */
BusinessFooterAddress.propTypes = {
	name: PropTypes.string,
	address: PropTypes.shape({
		streetAddress: PropTypes.string,
		addressLocality: PropTypes.string,
		addressRegion: PropTypes.string,
		postalCode: PropTypes.string,
		addressCountry: PropTypes.string,
	}),
	addressAdditionalInfo: PropTypes.string,
	telephone: PropTypes.string,
	email: PropTypes.string,
};
export type BusinessFooterAddressType = InferProps<typeof BusinessFooterAddress.propTypes>;
export function BusinessFooterAddress(props: BusinessFooterAddressType) {
	const { name, address, addressAdditionalInfo, telephone, email } = props;
	const addressQuery = buildAddressQuery(address ?? null);
	const mapsUrl = addressQuery ? buildGoogleMapsUrl(addressQuery) : undefined;

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
 * 
 * @param {Object} props
 * @param {Object} [props.address] - The structured address information.
 * @param {string} [props.address.streetAddress] - The street address.
 * @param {string} [props.address.addressLocality] - The city or locality.
 * @param {string} [props.address.addressRegion] - The state or region.
 * @param {string} [props.address.postalCode] - The postal code.
 * @param {string} [props.address.addressCountry] - The country.
 * @param {string} [props.googleMapsApiKey] - The Google Maps API key.
 * 
 * @returns {JSX.Element}
 */
BusinessFooterMap.propTypes = {
	address: PropTypes.shape({
		streetAddress: PropTypes.string,
		addressLocality: PropTypes.string,
		addressRegion: PropTypes.string,
		postalCode: PropTypes.string,
		addressCountry: PropTypes.string,
	}),
	googleMapsApiKey: PropTypes.string,
};
export type BusinessFooterMapType = InferProps<typeof BusinessFooterMap.propTypes>;
export function BusinessFooterMap(props: BusinessFooterMapType) {
	const { address, googleMapsApiKey } = props;
	const addressQuery = buildAddressQuery(address ?? null);
	const embedUrl = addressQuery ? buildGoogleMapsEmbedUrl(addressQuery, googleMapsApiKey ?? undefined) : undefined;

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
 * 
 * @param {Object} props
 * @param {string|Array} [props.openingHours] - The opening hours information, which can be a string, an array of strings, or an array of objects with detailed hours information.
 * @param {string} [props.openingHoursAdditionalInfo] - Any additional information about the opening hours (e.g. holiday closures, seasonal variations).
 * 
 * @returns {JSX.Element}
 */
BusinessFooterHours.propTypes = {
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
	openingHoursAdditionalInfo: PropTypes.string,
};
export type BusinessFooterHoursType = InferProps<typeof BusinessFooterHours.propTypes>;
export function BusinessFooterHours(props: BusinessFooterHoursType) {
	const { openingHours, openingHoursAdditionalInfo } = props;
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
 * Displays business contact information, opening hours, and an embedded Google Map based on the provided siteInfo prop.
 * It uses the PageSection component for layout and supports an optional Google Maps API key for enhanced map embedding.
 * The component gracefully handles missing data and provides fallback content when necessary.
 * 
 * @param {Object} props
 * @param {Object} [props.siteInfo] - The business's site information.
 * @param {string} [props.googleMapsApiKey] - The Google Maps API key.
 * 
 * @returns {JSX.Element}
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
		openingHoursAdditionalInfo: PropTypes.string,
		addressAdditionalInfo: PropTypes.string,
	}),
	googleMapsApiKey: PropTypes.string,
};
export type BusinessFooterType = InferProps<typeof BusinessFooter.propTypes>;
export function BusinessFooter(props: BusinessFooterType) {
	const { siteInfo, googleMapsApiKey } = props;
	if (!siteInfo) return null;

	return (
		<PageSection className="business-footer-section" id="business-footer" layoutType="grid" columns={3} gap="24px" padding="40px 20px">
			<div className="business-footer-column business-footer-summary">
				<BusinessFooterAddress
					name={siteInfo.name}
					address={siteInfo.address}
					addressAdditionalInfo={siteInfo.addressAdditionalInfo}
					telephone={siteInfo.telephone}
					email={siteInfo.email}
				/>
			</div>

			<div className="business-footer-column business-footer-map">
				<BusinessFooterMap address={siteInfo.address} googleMapsApiKey={googleMapsApiKey} />
			</div>

			<div className="business-footer-column business-footer-hours">
				<BusinessFooterHours
					openingHours={siteInfo.openingHours}
					openingHoursAdditionalInfo={siteInfo.openingHoursAdditionalInfo}
				/>
			</div>
		</PageSection>
	);
}
