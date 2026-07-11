import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createPageURLs, createSiteConfigServiceAreaURLs, createSiteConfigServiceURLs } from './sitemap';
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
	/humans/i,
	/legal/i,
	/manifest/i,
	/not-found/i,
	/preview/i,
	/privacy/i,
	/robots/i,
	/security/i,
	/services/i,
	/service-areas/i,
	/sitemap/i,
	/styleguide/i,
	/style-guide/i,
	/terms/i,
	/updates/i,
	/\.txt$/i,
	/\.xml$/i,
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

	const pageRouteUrls = (await createPageURLs(routes, baseUrl))
		.map((entry) => entry.url)
		.filter((url) => typeof url === 'string')
		.filter((url) => !excludedRoutePatterns.some((pattern) => pattern.test(url)))
		.filter((url) => !serviceUrls.includes(url) && !serviceAreaUrls.includes(url)) as string[];

	const lines: string[] = [];
	lines.push(`# ${sanitizeString(siteInfo.name ?? 'Site Name')}`);
	lines.push('');


	lines.push('## Page Links');
	if (pageRouteUrls.length) {
		pageRouteUrls.forEach((url) => lines.push(`- ${url}`));
	} else {
		lines.push('- none');
	}
	lines.push('');

	lines.push('## Services');
	if (serviceUrls.length) {
		serviceUrls.forEach((url) => lines.push(`- ${url}`));
	} else {
		lines.push('- none');
	}
	lines.push('');

	lines.push('## Service Areas');
	if (serviceAreaUrls.length) {
		serviceAreaUrls.forEach((url) => lines.push(`- ${url}`));
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
