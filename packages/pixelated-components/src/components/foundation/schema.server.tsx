import React from 'react';
import { headers } from 'next/headers';
import PropTypes, { InferProps } from 'prop-types';
import { getFullPixelatedConfig } from '../config/config';
import type { Route } from './metadata.functions';
import { getRouteByKey } from './metadata.functions';
import { getFallbackMetadataFromPath } from './metadata.server';
import type { Metadata } from './metadata.functions';






function SchemaScript({ schema }: { schema: any }) {
	return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}






/* ========================================
    BREADCRUMB SCHEMA COMPONENTS
======================================== */

interface BreadcrumbListItem {
    '@type': string;
    'position': number;
    'name': string;
    'item': string;
}

interface BreadcrumbListJsonLD {
    '@context': string;
    '@type': string;
    'itemListElement': BreadcrumbListItem[];
}


/**
 * BreadcrumbListSchema — Server-rendered breadcrumb JSON-LD.
 *
 * This component derives the current path from `next/headers` using the
 * `x-path` header and renders schema.org BreadcrumbList JSON-LD.
 *
 * @param - no props .
 * @returns A script tag containing the BreadcrumbList JSON-LD.
 */
BreadcrumbListSchema.propTypes = { /** no props */};
export type BreadcrumbListSchemaProps = InferProps<typeof BreadcrumbListSchema.propTypes>;
export async function BreadcrumbListSchema() {
	const reqHeaders: Headers = await (headers() as Promise<Headers>);
	const path = reqHeaders.get('x-path') ?? '/';
	const pathname = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;
	const config = getFullPixelatedConfig();
	const finalRoutes: Route[] = Array.isArray(config?.routes) ? (config.routes as Route[]) : [];
	const pathSegments: string[] = ['/'];
	if (pathname !== '/') {
		const parts = pathname.split('/').filter(Boolean);
		let accumulated = '';
		for (const part of parts) {
			accumulated += '/' + part;
			pathSegments.push(accumulated);
		}
	}

	const finalSiteUrl = config?.siteInfo?.url || 'https://example.com';

	const itemListElement = pathSegments.map((path, index) => {
		const segment = path.split('/').filter(Boolean).pop() || 'Home';
		const route = finalRoutes.find((r) => r.path && r.path === path);
		const name = route ? route.name || segment : segment
			.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
		return {
			'@type': 'ListItem',
			position: index + 1,
			name: path === '/' ? 'Home' : name,
			item: `${finalSiteUrl.replace(/\/$/, '')}${path}`,
		};
	});

	const jsonLD = {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		'itemListElement': itemListElement,
	};

	return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLD) }} />;
}





/* ========================================
	WEBPAGE SCHEMA COMPONENTS
======================================== */

SchemaWebPage.propTypes = {
	title: PropTypes.string,
	description: PropTypes.string,
	keywords: PropTypes.oneOfType([
		PropTypes.string,
		PropTypes.arrayOf(PropTypes.string),
	]),
	url: PropTypes.string,
};
export type SchemaWebPageType = InferProps<typeof SchemaWebPage.propTypes>;
export async function SchemaWebPage({ title, description, keywords, url }: SchemaWebPageType) {
	const reqHeaders: Headers = await (headers() as Promise<Headers>);
	const path = reqHeaders.get('x-path') ?? '/';
	const pathname = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;
	const config = getFullPixelatedConfig();
	const siteInfo = config?.siteInfo;
	const baseUrl = siteInfo?.url?.replace(/\/$/, '') || '';

	const routeMetadata = getRouteByKey(config.routes, 'path', pathname) ?? {};
	const fallbackMetadata = getFallbackMetadataFromPath(pathname, siteInfo) as Metadata ?? {} as Metadata;

	const pageUrl = url ?? (baseUrl && pathname ? `${baseUrl}${pathname}` : undefined);
	const pageTitle = title ?? routeMetadata.title ?? fallbackMetadata.title;
	const pageDescription = description ?? routeMetadata.description ?? fallbackMetadata.description;
	const keywordsValue = Array.isArray(keywords)
		? keywords.filter(Boolean).join(', ')
		: typeof keywords === 'string'
			? keywords
			: routeMetadata.keywords ?? fallbackMetadata.keywords;

	if (!pageUrl || !pageTitle) {
		return null;
	}

	const schemaData: any = {
		'@context': 'https://schema.org',
		'@type': 'WebPage',
		'@id': pageUrl,
		url: pageUrl,
		...(pageTitle && { name: pageTitle }),
		...(pageDescription && { description: pageDescription }),
		...(keywordsValue && { keywords: keywordsValue }),
	};

	return <SchemaScript schema={schemaData} />;
}

