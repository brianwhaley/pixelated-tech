import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createPageURLs, createSiteConfigServiceAreaURLs, createSiteConfigServiceURLs, type SitemapEntry } from './sitemap';
import type { SiteInfoType } from '../config/config.types';
import { getFullPixelatedConfig } from '../config/config';
import { sanitizeString } from './utilities';
import { decode } from 'html-entities';
import { getWordPressItems } from '../integrations/wordpress.functions';
import { getEbayAppToken, getEbayItemsSearch } from '../shoppingcart/ebay.functions';
import { getSquareStoreItems, getSquareEventItems } from '../shoppingcart/square.server';
import { contentfulValueToSlug } from '../integrations/contentful.delivery';
import { buildServiceUrl, getServicePathPrefix } from '../elements/services.functions';
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



/* ========================================
    LLMS.TXT GENERATOR
======================================== */

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






/* ========================================
    LLMS-FULL.TXT GENERATOR
======================================== */

/**
     * LLMSFullTxt — Generates a text file listing site URLs and AI/LLM usage policy for the site.
     * @param {object} [props] - Props object.
     * @Returns {NextResponse} - A NextResponse object containing the generated text file.
*/
LLMSFullTxt.propTypes = {
	/** no props */
};
export type LLMSFullTxtType= InferProps<typeof LLMSFullTxt.propTypes>;
export async function LLMSFullTxt(props: LLMSFullTxtType): Promise<NextResponse> {

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

	const externalContentByUrl = new Map<string, string>();
	if (config.integrations?.wordpress?.site) {
		try {
			const posts = await getWordPressItems({ site: config.integrations.wordpress.site });
			for (const post of posts ?? []) {
				if (!post?.URL) continue;
				const content = sanitizeString(decode(String(post.content || post.excerpt || '').replace(/<[^>]*>/g, ' ')));
				if (content) externalContentByUrl.set(post.URL, content);
			}
		} catch {
			// ignore WordPress fetch failures for full text
		}
	}

	if (config.integrations?.ebay?.appId) {
		try {
			const token = await getEbayAppToken({ apiProps: config.integrations.ebay });
			if (token) {
				const data = await getEbayItemsSearch({ apiProps: config.integrations.ebay, token });
				const items = data?.itemSummaries ?? [];
				for (const item of items) {
					const itemId = item?.legacyItemId || item?.itemId;
					if (!itemId) continue;
					const url = `${baseUrl}/store/${itemId}`;
					const description = sanitizeString(item?.description || item?.shortDescription || item?.title || '');
					if (description) externalContentByUrl.set(url, description);
				}
			}
		} catch {
			// ignore eBay fetch failures for full text
		}
	}

	if (config.integrations?.square?.squareItemCategoryId) {
		try {
			const response = await getSquareStoreItems();
			for (const item of response?.items ?? []) {
				if (!item?.itemURL) continue;
				const url = item.itemURL.startsWith('http') ? item.itemURL : `${baseUrl}${item.itemURL}`;
				const description = sanitizeString(item?.itemDescription || '');
				if (description) externalContentByUrl.set(url, description);
			}
		} catch {
			// ignore Square store item fetch failures for full text
		}
	}

	try {
		const events = await getSquareEventItems();
		for (const item of events ?? []) {
			const title = item?.fields?.title;
			if (!title) continue;
			const slug = contentfulValueToSlug({ value: title });
			if (!slug) continue;
			const url = `${baseUrl}/events/${slug}`;
			const description = sanitizeString(item?.fields?.description || '');
			if (description) externalContentByUrl.set(url, description);
		}
	} catch {
		// ignore Square event fetch failures
	}

	const getFullContent = (entry: SitemapEntry) => {
		if (serviceUrls.includes(entry.url)) {
			const service = Array.isArray(siteInfo.services)
				? siteInfo.services.find((service) => {
					const url = buildServiceUrl(service, siteInfo?.servicesPathPrefix);
					return url && `${baseUrl}${url}` === entry.url;
				})
				: undefined;
			if (service) {
				return Array.isArray(service.description)
					? service.description.map(sanitizeString).filter(Boolean).join(' ')
					: sanitizeString(service.description ?? '');
			}
			return sanitizeString(entry.description ?? '');
		}

		if (serviceAreaUrls.includes(entry.url)) {
			const area = Array.isArray(siteInfo.serviceAreas)
				? siteInfo.serviceAreas.find((area) => {
					const rawPath = area.url || area.path || `/service-areas/${contentfulValueToSlug({ value: area.slug ?? area.name })}`;
					const url = rawPath.startsWith('http') ? rawPath : `${baseUrl}${rawPath.startsWith('/') ? rawPath : `/${rawPath}`}`;
					return url === entry.url;
				})
				: undefined;
			if (area) {
				const description = Array.isArray(area.description)
					? area.description.map(sanitizeString).filter(Boolean).join(' ')
					: sanitizeString(area.description ?? '');
				const highlights = Array.isArray(area.highlights)
					? area.highlights.map(sanitizeString).filter(Boolean)
					: [];
				return highlights.length > 0
					? `${description}\n#### Highlights:\n${highlights.map((item) => `- ${item}`).join('\n')}\n`
					: description || sanitizeString(entry.description ?? '');
			}
			return sanitizeString(entry.description ?? '');
		}

		return externalContentByUrl.get(entry.url) ?? sanitizeString(entry.description ?? '');
	};

	const renderEntryLine = (entry: SitemapEntry) => {
		const content = getFullContent(entry);
		const link = `- [${sanitizeString(entry.name ?? entry.url)}](${entry.url})`;
		return content ? `${link}: ${content}` : link;
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
		pageRouteEntries.forEach((entry) => lines.push(renderEntryLine(entry)));
	} else {
		lines.push('- none');
	}
	lines.push('');

	lines.push('## Services');
	if (serviceEntries.length) {
		serviceEntries.forEach((entry) => lines.push(renderEntryLine(entry)));
	} else {
		lines.push('- none');
	}
	lines.push('');

	lines.push('## Service Areas');
	lines.push('');
	if (serviceAreaEntries.length) {
		serviceAreaEntries.forEach((entry) => {
			lines.push(`### ${sanitizeString(entry.name ?? entry.url)}`);
			lines.push(renderEntryLine(entry));
		});
	} else {
		lines.push('- none');
	}
	lines.push('');

	lines.push('## Optional');
	if (optionalRouteEntries.length) {
		optionalRouteEntries.forEach((entry) => lines.push(renderEntryLine(entry)));
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





/* ========================================
    AI.TXT GENERATOR
======================================== */

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
