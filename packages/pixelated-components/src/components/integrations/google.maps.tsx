import React from "react";
import PropTypes, { InferProps } from "prop-types";
import { usePixelatedConfig } from "../config/config.client";
import { SmartErrorBoundary } from "../foundation/smarterrorboundary";

// https://developers.google.com/maps/documentation/embed/embedding-map

const googleMapsPropTypes = {
	/** Accessible iframe title */
	title: PropTypes.string,
	/** iframe width (pixels or %) */
	width: PropTypes.string,
	/** iframe height (pixels) */
	height: PropTypes.string,
	/** iframe frameBorder attribute */
	frameBorder: PropTypes.string,
	/** Inline style object for the iframe */
	style: PropTypes.object,
	/** Maps embed mode (required) */
	map_mode: PropTypes.string.isRequired,
	/** Additional query parameters for the embed URL */
	parameters: PropTypes.string,
};

/**
 * GoogleMaps — Embed a Google Maps iframe using the Maps Embed API.
 *
 * @param {GoogleMapsType} props - Component properties.
 */
export function GoogleMaps(props: GoogleMapsType) {
	const config = usePixelatedConfig();
	const apiKey = config?.integrations?.google?.api_key || config?.integrations?.googleMaps?.apiKey;

	if (!apiKey) {
		return (
			<div className="smart-error-boundary-fallback">
				<p>Sorry, something went wrong loading GoogleMaps.</p>
			</div>
		);
	}

	return (
		<SmartErrorBoundary boundaryName="GoogleMaps">
			<div className="gmap" suppressHydrationWarning>
				<iframe
					title={props.title || "Google Map"}
					width={props.width || "600"}
					height={props.height || "400"}
					frameBorder={props.frameBorder || "0"}
					style={props.style || { border: 0 } as React.CSSProperties}
					referrerPolicy="no-referrer-when-downgrade"
					src={`https://www.google.com/maps/embed/v1/${props.map_mode}?key=${apiKey}&${props.parameters}`}
					allowFullScreen
				/>
			</div>
		</SmartErrorBoundary>
	);
}

GoogleMaps.propTypes = googleMapsPropTypes;
export type GoogleMapsType = InferProps<typeof googleMapsPropTypes>;
