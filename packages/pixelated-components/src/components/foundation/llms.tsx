import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { contentfulValueToSlug } from '../integrations/contentful.delivery';
import { getServicePathPrefix } from '../elements/services.functions';
import type { SiteInfoType, Route } from '../config/config.types';
import { getFullPixelatedConfig } from '../config/config';
import { sanitizeString } from './utilities';
import PropTypes, { InferProps } from 'prop-types';

import { buildUrl } from './urlbuilder';


const excludedRoutePatterns = [
	/admin/i,
	/api/i,
	/blogcalendar/i,
	/dashboard/i,
	/humans/i,
	/legal/i,
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
export function LLMSTxt(props: LLMSTxtType): NextResponse {

	const config = getFullPixelatedConfig();
	const siteInfo = config.siteInfo as SiteInfoType;
	const routes = Array.isArray(config.routes) ? config.routes : [];
	const baseUrl = sanitizeString(siteInfo.url ?? '').replace(/\/$/, '');

	const servicePathPrefix = getServicePathPrefix(siteInfo);
	const services = Array.isArray(siteInfo.services) ? siteInfo.services : [];
	const serviceAreas = Array.isArray(siteInfo.serviceAreas) ? siteInfo.serviceAreas : [];

	const serviceUrls = services
		.map((service) => {
			const slug = contentfulValueToSlug({ value: service.slug ?? service.name });
			const rawPath = `${servicePathPrefix}/${slug}`;
			return buildUrl({ baseUrl: baseUrl, pathSegments: [rawPath] });
		})
		.filter(Boolean) as string[];

	const serviceAreaUrls = serviceAreas
		.map((serviceArea) => {
			const rawPath =
				serviceArea.url ||
				serviceArea.path ||
				`/service-areas/${contentfulValueToSlug({ value: serviceArea.slug ?? serviceArea.name })}`;
			return buildUrl({ baseUrl: baseUrl, pathSegments: [rawPath] });
		})
		.filter(Boolean) as string[];

	const otherRouteUrls = routes
		.map((route) => {
			const rawPath = route.path ?? route.pathname ?? route.url;
			return rawPath ? buildUrl({ baseUrl: baseUrl, pathSegments: [rawPath] }) : undefined;
		})
		.filter((path): path is string => !!path)
		.filter((url) => !excludedRoutePatterns.some((pattern) => pattern.test(url)))
		.filter((url) => !serviceUrls.includes(url) && !serviceAreaUrls.includes(url));

	const lines: string[] = [];
	lines.push(`# ${sanitizeString(siteInfo.name ?? 'Site Name')}`);
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

	lines.push('## Other Links');
	if (otherRouteUrls.length) {
		otherRouteUrls.forEach((url) => lines.push(`- ${url}`));
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
