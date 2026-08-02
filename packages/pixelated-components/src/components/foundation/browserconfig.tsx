import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createPageURLs, createSiteConfigServiceAreaURLs, createSiteConfigServiceURLs, type SitemapEntry } from './sitemap';
import type { SiteInfoType } from '../config/config.types';
import { getFullPixelatedConfig } from '../config/config';
import { sanitizeString } from './utilities';
import PropTypes, { InferProps } from 'prop-types';


  
/**
     * BrowserConfigXML — Generates a browserconfig.xml file for the site.
     * @param {object} [props] - Props object.  No current props.
     * @returns {Promise<NextResponse>} - A NextResponse object containing the generated XML file.
*/
BrowserConfigXML.propTypes = {
	/** no props */
};
export type BrowserConfigXMLType = InferProps<typeof BrowserConfigXML.propTypes>;
export async function BrowserConfigXML(props: BrowserConfigXMLType): Promise<NextResponse> {

	const config = getFullPixelatedConfig();
	const siteInfo = config.siteInfo as SiteInfoType;
	const baseUrl = sanitizeString(siteInfo.url ?? '').replace(/\/$/, '');

	const lines: string[] = [];
	lines.push(`
<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <!-- Square Tiles -->
      <square70x70logo src="${siteInfo.image}"/>
      <square150x150logo src="${siteInfo.image}"/>
      <square310x310logo src="${siteInfo.image}"/>
      <!-- Wide Tile -->
      <wide310x150logo src="${siteInfo.image}"/>
      <!-- Background Color for the Tiles -->
      <TileColor>${siteInfo.theme_color}</TileColor>
    </tile>
  </msapplication>
</browserconfig>
`);

	return new NextResponse(lines.join('\n').trim(), {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
		},
	});
}
