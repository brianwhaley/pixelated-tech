'use client';

import React from 'react';
import PropTypes, { InferProps } from 'prop-types';
import { usePixelatedConfig } from "../config/config.client";
import { SmartErrorBoundary } from "../foundation/smarterrorboundary";
import { SmartImage } from '../elements/smartimage';


/**
 * GoogleMap — Embed a Google Map with custom configuration.
 *
 * @param {GoogleMapType} props - Component properties.
 */
GoogleMap.propTypes = {
	/** Query for the map (address or coordinates) */
	q: PropTypes.string.isRequired,
	/** Map mode: place, search, directions, streetview */
	mode: PropTypes.oneOf(['place', 'search', 'directions', 'streetview']),
	/** Additional query parameters for directions mode */
	origin: PropTypes.string,
	destination: PropTypes.string,
	waypoints: PropTypes.string,
	/** Map zoom level */
	zoom: PropTypes.string,
	/** Display center of the map */
	center: PropTypes.string,
	/** Map language */
	language: PropTypes.string,
	/** Map region */
	region: PropTypes.string,
	/** Map type: roadmap or satellite */
	maptype: PropTypes.oneOf(['roadmap', 'satellite']),
	/** Width of the map iframe */
	width: PropTypes.string,
	/** Height of the map iframe */
	height: PropTypes.string,
	/** Title for the map iframe */
	title: PropTypes.string,
	/** Whether to show a frame around the map */
	frameBorder: PropTypes.string,
	/** Loading behavior for the map iframe */
	loading: PropTypes.oneOf(['eager', 'lazy']),
	/** Inline style for the map iframe */
	style: PropTypes.object,
};
export type GoogleMapType = InferProps<typeof GoogleMap.propTypes>;
export function GoogleMap(props: GoogleMapType) {
	const config = usePixelatedConfig();
	const apiKey = config?.integrations?.google?.api_key || config?.integrations?.googleMaps?.apiKey;

	const mode = props.mode || 'place';
	const zoom = props.zoom ? `&zoom=${props.zoom}` : '';
	const center = props.center ? `&center=${props.center}` : '';
	const maptype = props.maptype ? `&maptype=${props.maptype}` : '';
	const language = props.language ? `&language=${props.language}` : '';
	const region = props.region ? `&region=${props.region}` : '';

	// Directions specific parameters
	const origin = props.origin ? `&origin=${encodeURIComponent(props.origin)}` : '';
	const destination = props.destination ? `&destination=${encodeURIComponent(props.destination)}` : '';
	const waypoints = props.waypoints ? `&waypoints=${encodeURIComponent(props.waypoints)}` : '';
	
	const q = encodeURIComponent(props.q);
	const src = `https://www.google.com/maps/embed/v1/${mode}?key=${apiKey}&q=${q}${zoom}${center}${maptype}${language}${region}${origin}${destination}${waypoints}`;

	if (!apiKey) {
		return (
			<div className="smart-error-boundary-fallback">
				<p>Sorry, something went wrong loading GoogleMap.</p>
			</div>
		);
	}

	return (
		<SmartErrorBoundary boundaryName="GoogleMap">
			<div className="gmap" suppressHydrationWarning>
				<iframe
					title={props.title || "Google Map"}
					width={props.width || "600"}
					height={props.height || "450"}
					frameBorder={props.frameBorder || "0"}
					loading={props.loading === 'lazy' || props.loading === 'eager' ? props.loading : undefined}
					style={props.style || { border: 0 }}
					src={src}
					allowFullScreen
					referrerPolicy="no-referrer-when-downgrade"
				/>
			</div>
		</SmartErrorBoundary>
	);
}

/**
 * GoogleStaticMap — Render a Google Static Maps image with an optional Maps link.
 */
GoogleStaticMap.propTypes = {
	/** Address or location query for the map */
	query: PropTypes.string.isRequired,
	/** Static map image width */
	width: PropTypes.number,
	/** Static map image height */
	height: PropTypes.number,
	/** Static map zoom level */
	zoom: PropTypes.string,
	/** Static map type */
	maptype: PropTypes.oneOf(['roadmap', 'satellite']),
	/** Static map marker definition */
	marker: PropTypes.string,
	/** Accessible image title */
	title: PropTypes.string,
	/** Accessible image alt text */
	alt: PropTypes.string,
	/** Whether to link the image to Google Maps search */
	link: PropTypes.bool,
};
export type GoogleStaticMapType = InferProps<typeof GoogleStaticMap.propTypes>;
export function GoogleStaticMap({
	query: queryProp,
	width: widthProp,
	height: heightProp,
	zoom: zoomProp,
	maptype: maptypeProp,
	marker: markerProp,
	title: titleProp,
	alt: altProp,
	link: linkProp,
}: GoogleStaticMapType) {
	const config = usePixelatedConfig();
	const apiKey = config?.integrations?.google?.api_key || config?.integrations?.googleMaps?.apiKey;
	const query = queryProp ?? '';
	const width = widthProp ?? 400;
	const height = heightProp ?? 400;
	const zoom = zoomProp ?? '15';
	const maptype = maptypeProp ?? 'roadmap';
	const marker = markerProp ?? undefined;
	const title = titleProp ?? 'Open business location in Google Maps';
	const alt = altProp ?? 'Map showing business location';
	const link = linkProp ?? true;
	const normalizedQuery = query.trim();
	const encodedQuery = encodeURIComponent(normalizedQuery);
	const markerValue = encodeURIComponent(marker || `color:red|${normalizedQuery}`);
	const staticMapUrl = normalizedQuery && apiKey
		? `https://maps.googleapis.com/maps/api/staticmap?center=${encodedQuery}&zoom=${zoom}&size=${width}x${height}&maptype=${maptype}&markers=${markerValue}&key=${encodeURIComponent(apiKey)}`
		: undefined;
	const mapsUrl = normalizedQuery
		? `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`
		: undefined;

	if (!staticMapUrl || (link && !mapsUrl)) {
		return <div className="business-footer-map-placeholder">Map unavailable</div>;
	}

	const image = (
		<SmartImage
			src={staticMapUrl}
			alt={alt}
			title={title}
			width={width}
			height={height}
			loading="lazy"
			decoding="async"
			variant="img"
		/>
	);

	return link && mapsUrl ? (
		<a href={mapsUrl} target="_blank" rel="noopener noreferrer" aria-label={title}>
			{image}
		</a>
	) : image;
}
