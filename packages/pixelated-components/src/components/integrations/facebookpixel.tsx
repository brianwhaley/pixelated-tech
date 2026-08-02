'use client';

import React, { useEffect } from 'react';
import PropTypes, { InferProps } from 'prop-types';
import { SmartErrorBoundary } from '../foundation/smarterrorboundary';
import { SmartImage } from '../elements/smartimage';

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
