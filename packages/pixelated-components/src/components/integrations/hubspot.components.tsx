'use client';

import React, { useEffect } from 'react';
import PropTypes, { InferProps } from 'prop-types';
import { usePixelatedConfig } from '../config/config.client';
import { smartFetch } from '../foundation/smartfetch';




export function initializeHubSpotScript(region: string, portalId: string) {
	if (typeof document === 'undefined') return;
	const scriptId = `hubspot-script-${region}-${portalId}`;
	if (document.getElementById(scriptId)) return;
	const script = document.createElement('script');
	script.id = scriptId;
	script.src = `https://js-${region}.hsforms.net/forms/embed/${portalId}.js`;
	// script.async = true;
	script.defer = true;
	document.head.appendChild(script);
}

/**
 * HubSpotForm — Embed a HubSpot form by injecting the HubSpot script and creating a form instance.
 *
 * @param {string} [props.target] - CSS selector target for where the form will be injected (overrides containerId).
 * @param {string} [props.containerId] - ID of the container element to mount the form into (default: 'hubspot-form-container').
 */
HubSpotForm.propTypes = {
	/** CSS selector or target element for the form */
	target: PropTypes.string,
	/** DOM ID of the container element for the form */
	containerId: PropTypes.string,
};
export type HubSpotFormType = InferProps<typeof HubSpotForm.propTypes>;
export function HubSpotForm({ target, containerId = 'hubspot-form-container' }: HubSpotFormType) {
	const config = usePixelatedConfig();

	const finalRegion = config?.integrations?.hubspot?.region || 'na1';
	const finalPortalId = config?.integrations?.hubspot?.portalId || '';
	const finalFormId = config?.integrations?.hubspot?.formId || '';
	const formTarget = target || `#${containerId}`;

	if (!finalPortalId || !finalFormId) {
		return (
			<div className="smart-error-boundary-fallback">
				<p>HubSpot form configuration is missing. Check your Pixelated config provider settings.</p>
			</div>
		);
	}

	useEffect(() => {
		if (typeof window === 'undefined') return;

		initializeHubSpotScript(finalRegion, finalPortalId);

		const createHubspotForm = () => {
			const win = window as any;
			if (win.hbspt && win.hbspt.forms) {
				win.hbspt.forms.create({
					region: finalRegion,
					portalId: finalPortalId,
					formId: finalFormId,
					target: formTarget
				});
			}
		};

		createHubspotForm();
		const interval = window.setInterval(() => {
			createHubspotForm();
			if ((window as any).hbspt && (window as any).hbspt.forms) {
				window.clearInterval(interval);
			}
		}, 500);

		return () => window.clearInterval(interval);
	}, [finalRegion, finalPortalId, finalFormId, formTarget]);

	return <div 
		className="hs-form-frame" 
		data-region={finalRegion} 
		data-form-id={finalFormId}
		data-portal-id={finalPortalId} 
	/>;
}




/**
 * HubspotTrackingCode — Inject the HubSpot tracking script for the given portal ID.
 *
 * @param - no params
 * @returns {JSX.Element} The HubSpot tracking script element.
 */
HubspotTrackingCode.propTypes = {
	/** No props */
};
export type HubspotTrackingCodeType = InferProps<typeof HubspotTrackingCode.propTypes>;
export function HubspotTrackingCode(_props: HubspotTrackingCodeType) {
	const config = usePixelatedConfig();
	const hubID = config?.integrations?.hubspot?.portalId;
	const hubRegion = config?.integrations?.hubspot?.region || 'na2';

	if (!hubID) {
		return (
			<div className="smart-error-boundary-fallback">
				<p>Sorry, something went wrong loading HubspotTrackingCode.</p>
			</div>
		);
	}

	return (
		<>
			{ /* <!-- Start of HubSpot Embed Code --> */ }
			<script
				type="text/javascript"
				id="hs-script-loader"
				async
				defer
				src={`//js-${hubRegion}.hs-scripts.com/${hubID}.js`}
			/>
			{ /* <!-- End of HubSpot Embed Code -->*/ }
		</>
	);
}





/**
 * getHubspotFormSubmissions — Retrieve submissions for a HubSpot form via the HubSpot Forms API (proxied).
 *
 * @param {string} [props.proxyURL] - Proxy base URL used to avoid CORS (must include trailing slash if required by proxy).
 * @param {string} [props.formGUID] - HubSpot form GUID to fetch submissions for.
 * @param {string} [props.apiToken] - HubSpot API token used for authorization.
 */
getHubspotFormSubmissions.propTypes = {
/** Proxy base URL to route the request through */
	proxyURL: PropTypes.string.isRequired,
	/** HubSpot form GUID */
	formGUID: PropTypes.string.isRequired,
	/** Bearer API token for HubSpot requests */
	apiToken: PropTypes.string.isRequired,
};
export type getHubspotFormSubmissionsType = InferProps<typeof getHubspotFormSubmissions.propTypes>;
export async function getHubspotFormSubmissions(props: getHubspotFormSubmissionsType) {
	const url = `${props.proxyURL}https://api.hubapi.com/form-integrations/v1/submissions/forms/${props.formGUID}`;
	try {
		const data = await smartFetch(url, {
			requestInit: {
				method: 'GET',
				headers: {
					Authorization: "Bearer " + props.apiToken,
				},
			}
		});
		return data;
	} catch (error) {
		console.error('Error fetching HubSpot form submissions:', error);
		return null;
	}
}
