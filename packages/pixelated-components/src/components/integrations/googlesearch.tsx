'use client';

import React, { useEffect } from "react";
import PropTypes, { InferProps } from 'prop-types';
import { usePixelatedConfig } from "../config/config.client";
import { SmartErrorBoundary } from "../foundation/smarterrorboundary";
import "./googlesearch.css";



/**
 * GoogleSearch — Embed a Google Programmable Search box and results.
 *
 * @param {GoogleSearchType} props - Component properties.
 */
GoogleSearch.propTypes = {
	/** no props */
};
export type GoogleSearchType = InferProps<typeof GoogleSearch.propTypes>;
export function GoogleSearch(props: GoogleSearchType) {
	const config = usePixelatedConfig();
	const id = config?.integrations?.googleSearch?.id || config?.integrations?.googleSearchConsole?.id;

	useEffect(() => {
		if (!id) return;
		const head = document.querySelector("head");
		const script = document.createElement("script");
		script.setAttribute("src", "https://cse.google.com/cse.js?cx=" + id);
		script.setAttribute("async", "true");
		if (head) head.appendChild(script);
	}, [id]);

	if (!id) {
		return (
			<div className="smart-error-boundary-fallback">
				<p>Sorry, something went wrong loading GoogleSearch.</p>
			</div>
		);
	}

	return (
		<SmartErrorBoundary boundaryName="GoogleSearch">
			<div className="gcse-search" suppressHydrationWarning={true}></div>
		</SmartErrorBoundary>
	);
}

