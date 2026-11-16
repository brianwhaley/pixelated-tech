import React from 'react';
import { getFullPixelatedConfig } from '../config/config';
import { extractGoogleFonts, generateGoogleFontsUrl } from './google.fonts.functions';
import PropTypes, { InferProps } from 'prop-types';

/* ========== REACT COMPONENT ========== */

/**
 * Component to handle Google Fonts imports.
 * Extracts fonts from visualdesign configuration provided in pixelated.config.json.
 * Outputs preconnect and one combined stylesheet link for the configured fonts.
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

	return (
		<>
			<link rel="preconnect" href="https://fonts.googleapis.com" />
			<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
			<link href={generateGoogleFontsUrl(uniqueFamilies)} rel="stylesheet" />
		</>
	);
}
