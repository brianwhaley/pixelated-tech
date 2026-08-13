"use client";

import React, { useEffect } from "react";
import PropTypes, { InferProps } from "prop-types";
import { usePixelatedConfig } from "../config/config.client";
import { SmartErrorBoundary } from "../foundation/smarterrorboundary";

declare global {
	interface Window {
		dataLayer?: any[];
		gtag?: (...args: any[]) => void;
	}
}

/* eslint-disable-next-line */
function isGA() {
	if (typeof window === 'undefined') return false;
	const hasGtag = typeof window.gtag === 'function';
	const hasDataLayer = typeof window.dataLayer !== 'undefined' && Array.isArray(window.dataLayer);
	const hasGAScript = !!(document.querySelector('script[src*="googletagmanager.com/gtag/js"]'));
	const hasGAScriptID = !!(document.querySelector('script#ga'));
	const hasGAInitScriptID = !!(document.querySelector('script#ga-init'));
	return ( hasGtag || hasDataLayer || hasGAScript || hasGAScriptID || hasGAInitScriptID ) ;
}



/**
 * GoogleAnalytics — Inject Google Analytics gtag script and initialize with the given measurement id.
 *
 * @param {GoogleAnalyticsType} props - Component properties.
 */
GoogleAnalytics.propTypes = {
	/** no props */
};
export type GoogleAnalyticsType = InferProps<typeof GoogleAnalytics.propTypes>;
export function GoogleAnalytics( props: GoogleAnalyticsType ) {
	const config = usePixelatedConfig();
	const id = config?.integrations?.googleAnalytics?.id;
	const adId = config?.integrations?.googleAnalytics?.adId;

	useEffect(() => {
		if (!id) {
			console.warn('GoogleAnalytics is not configured. Skipping Google Analytics script injection.');
			return;
		}
		if (typeof window === 'undefined') { return; }
		if (typeof document === 'undefined') { return; }
		if (isGA()) { return; }

		const gaSRC = "https://www.googletagmanager.com/gtag/js?id=" + id;
		const gaInit = document.createElement("script");
		gaInit.setAttribute("id", "ga-init");
		gaInit.type = "text/javascript";
		gaInit.text = `
window.dataLayer = window.dataLayer || [];
window.gtag = function gtag(){ window.dataLayer.push(arguments); }
window.gtag('js', new Date());
window.gtag('config', '${id}');
${adId ? `window.gtag('config', '${adId}');` : ''}
`;
		document.head.appendChild(gaInit);

		const ga = document.createElement("script");
		ga.setAttribute("id", "ga");
		ga.type = "text/javascript";
		ga.setAttribute("async", "true");
		ga.src = gaSRC;
		document.head.appendChild(ga);
	}, [id, adId]);

	if (!id) {
		return null;
	}

	return (
		<SmartErrorBoundary boundaryName="GoogleAnalytics">
			<div className="ga" suppressHydrationWarning />
		</SmartErrorBoundary>
	);
}




/**
 * GoogleAnalyticsEvent — Trigger a one-off Google Analytics event using gtag.
 *
 * @param {GoogleAnalyticsEventType} props - Component properties.
 */
GoogleAnalyticsEvent.propTypes = {
	/** Event name for gtag */
	event_name: PropTypes.string.isRequired,
	/** Event parameter object */
	event_parameters: PropTypes.object.isRequired,
};
export type GoogleAnalyticsEventType = InferProps<typeof GoogleAnalyticsEvent.propTypes>;
export function GoogleAnalyticsEvent({ event_name, event_parameters }: GoogleAnalyticsEventType) {
	useEffect(() => {
		if (typeof window !== "undefined" && typeof window.gtag === "function") {
			window.gtag("event", event_name, event_parameters);
		}
	}, [event_name, event_parameters]);

	return null;
}

