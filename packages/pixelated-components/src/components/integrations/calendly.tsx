'use client';

import React, { useEffect } from "react";
import PropTypes, { InferProps } from 'prop-types';
import { usePixelatedConfig } from "../config/config.client";
import { SmartErrorBoundary } from "../foundation/smarterrorboundary";

/**
 * Calendly — Embed a Calendly scheduling widget using the provided URL.
 *
 * @param {CalendlyType} props - Component properties.
 * @return A div element containing the Calendly inline widget, with error handling for missing URL or loading issues.
 */
Calendly.propTypes = {
	/** Minimum width for the widget container */
	width: PropTypes.string,
	/** Height for the widget container */
	height: PropTypes.string,
};
export type CalendlyType = InferProps<typeof Calendly.propTypes>;
export function Calendly(props: CalendlyType) {
	const config = usePixelatedConfig();
	const url = config?.integrations?.calendly?.url;

	useEffect(() => {
		if (!url) return;
		const head = document.querySelector("head");
		const script = document.createElement("script");
		script.setAttribute("src", "https://assets.calendly.com/assets/external/widget.js");
		script.setAttribute("type", "text/javascript");
		script.setAttribute("async", "true");
		if (head) head.appendChild(script);
	}, [url]);

	if (!url) {
		return (
			<div className="smart-error-boundary-fallback">
				<p>Sorry, something went wrong loading Calendly.</p>
			</div>
		);
	}

	return (
		<SmartErrorBoundary boundaryName="Calendly">
			<div className="calendly-inline-widget" 
				data-url={url} 
				style={{minWidth: props.width || "320px", height: props.height || "700px"}} 
				data-resize="true"
				suppressHydrationWarning={true}>
			</div>
		</SmartErrorBoundary>
	);
}


