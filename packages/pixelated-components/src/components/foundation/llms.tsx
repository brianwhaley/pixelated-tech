import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createPageURLs, createSiteConfigServiceAreaURLs, createSiteConfigServiceURLs, type SitemapEntry } from './sitemap';
import type { SiteInfoType } from '../config/config.types';
import { getFullPixelatedConfig } from '../config/config';
import { sanitizeString } from './utilities';
import PropTypes, { InferProps } from 'prop-types';


const excludedRoutePatterns = [
	/404/i,
	/admin/i,
	/api/i,
	/blogcalendar/i,
	/dashboard/i,
	// /humans/i,
	// /legal/i,
	/manifest/i,
	/not-found/i,
	/preview/i,
	// /privacy/i,
	// /robots/i,
	// /security/i,
	// /services/i,
	// /service-areas/i,
	/styleguide/i,
	/style-guide/i,
	// /terms/i,
	/updates/i,
	/\.txt$/i, // covers humans, robots, security, ai, llms
];

  
/**
     * LLMSTxt — Generates a text file listing site URLs and AI/LLM usage policy for the site.
     * @param {object} [props] - Props object.
     * @Returns {NextResponse} - A NextResponse object containing the generated text file.
*/
LLMSTxt.propTypes = {
	/** no props */
};
export type LLMSTxtType= InferProps<typeof LLMSTxt.propTypes>;
export async function LLMSTxt(props: LLMSTxtType): Promise<NextResponse> {

	const config = getFullPixelatedConfig();
	const siteInfo = config.siteInfo as SiteInfoType;
	const routes = Array.isArray(config.routes) ? config.routes : [];
	const baseUrl = sanitizeString(siteInfo.url ?? '').replace(/\/$/, '');

	const serviceEntries = await createSiteConfigServiceURLs(config, baseUrl);
	const serviceUrls = serviceEntries.map((entry) => entry.url).filter(Boolean) as string[];

	const serviceAreaEntries = await createSiteConfigServiceAreaURLs(config, baseUrl);
	const serviceAreaUrls = serviceAreaEntries.map((entry) => entry.url).filter(Boolean) as string[];

	const pageRouteEntries = (await createPageURLs(routes, baseUrl))
		.filter((entry) => typeof entry.url === 'string')
		.filter((entry) => !excludedRoutePatterns.some((pattern) => pattern.test(entry.url)))
		.filter((entry) => !serviceUrls.includes(entry.url) && !serviceAreaUrls.includes(entry.url)) as SitemapEntry[];

	const optionalRouteEntries = (await createPageURLs(routes, baseUrl))
		.filter((entry) => typeof entry.url === 'string')
		.filter((entry) => excludedRoutePatterns.some((pattern) => pattern.test(entry.url)))
		.filter((entry) => !serviceUrls.includes(entry.url) && !serviceAreaUrls.includes(entry.url)) as SitemapEntry[];

	const formatLink = (entry: {name?: string | null; url: string}) => {
		return `- [${sanitizeString(entry.name ?? entry.url)}](${entry.url})`;
	};

	const lines: string[] = [];
	lines.push(`# ${sanitizeString(siteInfo.name ?? 'Site Name')}`);
	lines.push('');
	lines.push(`> ${sanitizeString(siteInfo.description ?? siteInfo.name)}`);
	lines.push('');
	lines.push(`This file serves as a directory of machine-readable context for AI agents, crawlers, and LLM search systems looking to accurately analyze ${sanitizeString(siteInfo.name ?? 'the site')}.`);
	lines.push('');

	lines.push('## Page Links');
	if (pageRouteEntries.length) {
		pageRouteEntries.forEach((entry) => lines.push(formatLink(entry) + ": " + sanitizeString(entry.description ?? '')));
	} else {
		lines.push('- none');
	}
	lines.push('');

	lines.push('## Services');
	if (serviceEntries.length) {
		serviceEntries.forEach((entry) => lines.push(formatLink(entry) + ": " + sanitizeString(entry.description ?? '')));
	} else {
		lines.push('- none');
	}
	lines.push('');

	lines.push('## Service Areas');
	if (serviceAreaEntries.length) {
		serviceAreaEntries.forEach((entry) => lines.push(formatLink(entry) + ": " + sanitizeString(entry.description ?? '')));
	} else {
		lines.push('- none');
	}
	lines.push('');

	lines.push('## Optional');
	if (optionalRouteEntries.length) {
		optionalRouteEntries.forEach((entry) => lines.push(formatLink(entry) + ": " + sanitizeString(entry.description ?? '')));
	} else {
		lines.push('- none');
	}
	lines.push('');


	lines.push('## AI / LLM Usage Policy');
	lines.push('Training: yes');
	lines.push('Attribution: required');
	lines.push('Reuse: allowed');
	lines.push('Cache: allowed');
	lines.push('Indexing: allowed');
	lines.push('Derivatives: allowed');
	lines.push('Transformations: allowed');
	lines.push('Source: required');
	lines.push('Commercial-Use: disallowed');
	lines.push('');

	lines.push('## Contact');
	lines.push(`Contact: mailto:${sanitizeString(siteInfo.email ?? '')}`);
	lines.push('');

	lines.push('## Generated');
	lines.push(`Generated: ${new Date().toISOString()}`);

	return new NextResponse(lines.join('\n'), {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
		},
	});
}


/**
 	* AITxt — Generates an ai.txt file containing AI crawler usage policy.
 	* @param {object} [props] - Props object.
 	* @returns {Promise<NextResponse>} A text file response with default AI crawler directives.
 */
AITxt.propTypes = {
	/** no props */
};
export type AITxtType = InferProps<typeof AITxt.propTypes>;
export async function AITxt(props: AITxtType): Promise<NextResponse> {
	const config = getFullPixelatedConfig();
	const siteInfo = config.siteInfo as SiteInfoType;
	const siteName = sanitizeString(siteInfo.name ?? 'Site Name');
	const contactEmail = sanitizeString(siteInfo.email ?? '');

	const lines: string[] = [];
	lines.push(`# ai.txt — AI crawler policy for ${siteName}`);
	lines.push(`# Generated: ${new Date().toISOString()}`);
	lines.push('');

	lines.push('User-agent: *');
	lines.push('Allow-Train: /');
	lines.push('Allow-RAG: /');
	lines.push('');

	lines.push('# Custom AI Licensing Meta-Data');
	lines.push('# ---------------------------------');
	lines.push('# Training: yes');
	lines.push('# Attribution: required');
	lines.push('# Reuse: allowed');
	lines.push('# Cache: allowed');
	lines.push('# Indexing: allowed');
	lines.push('# Derivatives: allowed');
	lines.push('# Transformations: allowed');
	lines.push('# Source: required');
	lines.push('# Commercial-Use: disallowed');
	lines.push('');

	if (contactEmail) {
		lines.push(`# Contact: mailto:${contactEmail}`);
		lines.push('');
	}

	return new NextResponse(lines.join('\n'), {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
		},
	});
}
