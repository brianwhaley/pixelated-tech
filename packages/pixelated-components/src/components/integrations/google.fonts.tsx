import React from 'react';
import { getFullPixelatedConfig } from '../config/config';
import { extractGoogleFonts, encodeFontFamily } from './google.fonts.functions';
import PropTypes, { InferProps } from 'prop-types';


const getSingleFontUrl = (family: string): string => {
	return `https://fonts.googleapis.com/css2?family=${encodeFontFamily(family)}&display=swap`;
};


/* ========== REACT COMPONENT ========== */

/**
 * Component to handle Google Fonts imports.
 * Extracts fonts from visualdesign configuration provided in siteconfig.json.
 * Outputs preconnect and one stylesheet link per font for reliability.
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
			{uniqueFamilies.map(family => (
				<link 
					key={family}
					href={getSingleFontUrl(family)} 
					rel="stylesheet" 
				/>
			))}
		</>
	);
}
