'use client';

import React, { useEffect } from 'react';
import PropTypes, { InferProps } from 'prop-types';
import { SmartErrorBoundary } from '../foundation/smarterrorboundary';
import { SmartImage } from '../elements/smartimage';

const FACEBOOK_ATTRIBUTION_STORAGE_KEY = 'pixelated-facebook-attribution';
const FACEBOOK_ATTRIBUTION_PARAMETERS = [
	'fbclid',
	'utm_source',
	'utm_medium',
	'utm_campaign',
	'utm_content',
	'utm_term',
] as const;

export type FacebookAttributionData = Partial<Record<typeof FACEBOOK_ATTRIBUTION_PARAMETERS[number], string>>;

function readStoredFacebookAttribution(): FacebookAttributionData {
	try {
		const stored = window.sessionStorage.getItem(FACEBOOK_ATTRIBUTION_STORAGE_KEY);
		return stored ? JSON.parse(stored) as FacebookAttributionData : {};
	} catch {
		return {};
	}
}

export function captureFacebookAttributionData(): FacebookAttributionData {
	if (typeof window === 'undefined' || typeof document === 'undefined') return {};

	const attribution = readStoredFacebookAttribution();
	const query = new URLSearchParams(window.location.search);
	for (const parameter of FACEBOOK_ATTRIBUTION_PARAMETERS) {
		const value = query.get(parameter);
		if (value) attribution[parameter] = value;
	}
	if (attribution.fbclid && !document.cookie.includes('_fbc=')) {
		document.cookie = `_fbc=fb.1.${Date.now()}.${encodeURIComponent(attribution.fbclid)}; path=/; max-age=7776000; SameSite=Lax`;
	}

	try {
		window.sessionStorage.setItem(FACEBOOK_ATTRIBUTION_STORAGE_KEY, JSON.stringify(attribution));
	} catch {
		// Storage can be unavailable in privacy-restricted browser contexts.
	}
	return attribution;
}

export function getFacebookAttributionData(): FacebookAttributionData {
	if (typeof window === 'undefined') return {};
	return readStoredFacebookAttribution();
}

FacebookPixel.propTypes = {
	/** Facebook Pixel ID */
	pixelId: PropTypes.string.isRequired,
	/** Track the default PageView event */
	trackPageView: PropTypes.bool,
	/** Optional custom event name to track after initialization */
	trackEventName: PropTypes.string,
	/** Optional event payload data */
	eventData: PropTypes.object,
};
export type FacebookPixelType = InferProps<typeof FacebookPixel.propTypes>;
export function FacebookPixel({ pixelId, trackPageView = true, trackEventName, eventData }: FacebookPixelType) {
	useEffect(() => {
		if (!pixelId) return;
		if (typeof window === 'undefined') return;
		if (typeof document === 'undefined') return;
		captureFacebookAttributionData();

		const initScript = document.createElement('script');
		initScript.setAttribute('id', 'facebook-pixel-init');
		initScript.type = 'text/javascript';
		initScript.async = true;

		const eventPayload = eventData ? `, ${JSON.stringify(eventData)}` : '';
		const trackEvent = trackEventName ? `fbq('track', '${trackEventName}'${eventPayload});` : '';

		initScript.text = `!function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${pixelId}');
    ${trackPageView ? "fbq('track', 'PageView');" : ''}
    ${trackEvent}`;

		document.head.appendChild(initScript);
	}, [pixelId, trackPageView, trackEventName, eventData]);

	if (!pixelId) {
		console.warn('FacebookPixel: missing pixelId. FacebookPixel will not be initialized.');
		return null;
	}

	return (
		<SmartErrorBoundary boundaryName="FacebookPixel">
			<div suppressHydrationWarning />
			{trackPageView ? (
				<noscript>
					<SmartImage
						height={1}
						width={1}
						style={{ display: 'none' }}
						src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
						alt=""
					/>
				</noscript>
			) : null}
		</SmartErrorBoundary>
	);
}
