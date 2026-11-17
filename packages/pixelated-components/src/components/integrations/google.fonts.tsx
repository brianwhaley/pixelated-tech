import React from 'react';
import Script from 'next/script';
import { getFullPixelatedConfig } from '../config/config';
import { extractGoogleFonts, generateGoogleFontsUrls } from './google.fonts.functions';
import { InferProps } from 'prop-types';

/* ========== REACT COMPONENT ========== */

/**
 * Component to handle Google Fonts imports.
 * Extracts fonts from visualdesign configuration provided in pixelated.config.json.
 * Outputs preconnect and one non-blocking stylesheet preload per configured font family.
 */
/**
 * @param props Component props are intentionally unused; font settings come from pixelated.config.json.
 */
GoogleFonts.propTypes = {
	/** no props */
};
export type GoogleFontsType = InferProps<typeof GoogleFonts.propTypes>;
export function GoogleFonts(props: GoogleFontsType) {
	void props;
	const visualdesign = getFullPixelatedConfig()?.visualdesign;
	if (!visualdesign) return null;
	const uniqueFamilies = extractGoogleFonts(visualdesign);
	if (uniqueFamilies.length === 0) return null;
	const stylesheetUrls = generateGoogleFontsUrls(uniqueFamilies);

	return (
		<>
			<link rel="preconnect" href="https://fonts.googleapis.com" />
			<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
			{stylesheetUrls.map((stylesheetUrl) => (
				<link key={stylesheetUrl} href={stylesheetUrl} rel="stylesheet" />
			))}
		</>
	);
}



/**
 * Component to handle Google Fonts imports.
 * Extracts fonts from visualdesign configuration provided in pixelated.config.json.
 * Outputs preconnect and one non-blocking stylesheet preload per configured font family.
 */
/**
 * @param props Component props are intentionally unused; font settings come from pixelated.config.json.
 */
GoogleFontsPreload.propTypes = {
	/** no props */
};
export type GoogleFontsPreloadType = InferProps<typeof GoogleFontsPreload.propTypes>;
export function GoogleFontsPreload(props: GoogleFontsPreloadType) {
	void props;
	const visualdesign = getFullPixelatedConfig()?.visualdesign;
	if (!visualdesign) return null;
	const uniqueFamilies = extractGoogleFonts(visualdesign);
	if (uniqueFamilies.length === 0) return null;
	const stylesheetUrls = generateGoogleFontsUrls(uniqueFamilies);

	return (
		<>
			<link rel="preconnect" href="https://fonts.googleapis.com" />
			<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
			{stylesheetUrls.map((stylesheetUrl) => (
				<link
					key={stylesheetUrl}
					data-pixelated-google-fonts-preload=""
					href={stylesheetUrl}
					rel="preload"
					as="style"
				/>
			))}
			<Script id="pixelated-google-fonts" strategy="beforeInteractive">
				{`
(function () {
	var links = document.querySelectorAll('link[data-pixelated-google-fonts-preload]');
	links.forEach(function (link) {
		link.addEventListener('load', function () {
			link.rel = 'stylesheet';
		}, { once: true });
	});
})();
`}
			</Script>
			<noscript>
				{stylesheetUrls.map((stylesheetUrl) => (
					<link key={stylesheetUrl} href={stylesheetUrl} rel="stylesheet" />
				))}
			</noscript>
		</>
	);
}
