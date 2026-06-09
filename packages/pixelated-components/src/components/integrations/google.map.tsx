'use client';

import React from 'react';
import PropTypes, { InferProps } from 'prop-types';
import { usePixelatedConfig } from "../config/config.client";
import { SmartErrorBoundary } from "../foundation/smarterrorboundary";


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
					style={{ border: 0 }}
					frameBorder={props.frameBorder || "0"}
					src={src}
					allowFullScreen
					referrerPolicy="no-referrer-when-downgrade"
				/>
			</div>
		</SmartErrorBoundary>
	);
}
