import React from "react";
import { headers } from "next/headers";

import { assertSiteInfo } from '../config/config.validators';
import { getFullPixelatedConfig } from '../config/config';
import type { SiteInfo } from '../config/config.types';
import { getRouteByKey } from './metadata.functions';

export type GenerateMetaTagsProps = {
	title: string;
	description: string;
	keywords: string;
	origin: string;
	url: string;
};

async function getPageMetaTagsProps(): Promise<GenerateMetaTagsProps> {
	const reqHeaders = await headers();
	const path = reqHeaders.get('x-path') ?? '/';
	const origin = reqHeaders.get('x-origin') ?? '';
	const url = reqHeaders.get('x-url') ?? `${origin}${path}`;
	const pathname = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;
	const metadata = getRouteByKey(getFullPixelatedConfig().routes, 'path', pathname) || {};

	return {
		title: metadata?.title ?? '',
		description: metadata?.description ?? '',
		keywords: metadata?.keywords ?? '',
		origin,
		url,
	};
}

export async function generateMetaTags() {
	const metaTagsProps = await getPageMetaTagsProps();
	const { title, description, keywords, origin, url } = metaTagsProps;
	const siteInfo = getFullPixelatedConfig().siteInfo as SiteInfo;

	let newOrigin: string | undefined;
	try {
		newOrigin = origin ? new URL(origin).hostname : undefined;
	} catch {
		newOrigin = undefined;
	}

	assertSiteInfo(siteInfo);

	const site_name = siteInfo.name;
	const email = siteInfo.email;
	const image = siteInfo.image;
	const image_height = siteInfo.image_height;
	const image_width = siteInfo.image_width;
	const favicon = siteInfo.favicon;

	return (
		<>
			<title>{title}</title>

			<meta charSet="UTF-8" />
			<meta httpEquiv="content-type" content="text/html; charset=UTF-8" />
			<meta httpEquiv='Expires' content='0' />
			<meta httpEquiv='Pragma' content='no-cache' />
			<meta httpEquiv='Cache-Control' content='no-cache' />

			<meta name="application-name" content={site_name} />
			<meta name="author" content={site_name + ", " + email} />
			<meta name='copyright' content={site_name} />
			<meta name="creator" content={site_name} />
			<meta name="description" content={description} />
			<meta name="keywords" content={keywords} />
			<meta name='language' content='EN' />
			<meta name='owner' content={site_name} />
			<meta name="publisher" content={site_name} />
			<meta name='rating' content='General' />
			<meta name='reply-to' content={email ?? undefined} />
			<meta name="robots" content="index, follow" />
			<meta name='url' content={url} />
			<meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no" />

			<meta property="og:description" content={description} />
			<meta property='og:email' content={email ?? undefined} />
			<meta property="og:image" content={image ?? undefined} />
			<meta property="og:image:height" content={image_height != null ? String(image_height) : undefined} />
			<meta property="og:image:width" content={image_width != null ? String(image_width) : undefined} />
			<meta property="og:locale" content="en_US" />
			<meta property="og:site_name" content={site_name} />
			<meta property="og:title" content={title} />
			<meta property="og:type" content="website" />
			<meta property="og:url" content={url} />

			<meta itemProp="name" content={site_name} />
			<meta itemProp="url" content={url} />
			<meta itemProp="description" content={description} />
			<meta itemProp="thumbnailUrl" content={image ?? undefined} />

			<meta property="twitter:domain" content={newOrigin} />
			<meta property="twitter:url" content={url} />
			<meta name="twitter:card" content="summary_large_image" />
			<meta name="twitter:creator" content={site_name} />
			<meta name="twitter:description" content={description} />
			<meta name="twitter:image" content={image ?? undefined} />
			<meta name="twitter:image:height" content={image_height != null ? String(image_height) : undefined} />
			<meta name="twitter:image:width" content={image_width != null ? String(image_width) : undefined} />
			<meta name="twitter:title" content={title} />

			<link rel="alternate" type="application/rss+xml" title="Sitemap RSS" href="/rss.xml" />
			<link rel="author" fetchPriority="high" href="humans.txt" />
			<link rel="canonical" fetchPriority="high" href={url} />
			<link rel="icon" fetchPriority="high" type="image/x-icon" href={favicon ?? undefined} />
			<link rel="shortcut icon" fetchPriority="high" type="image/x-icon" href={favicon ?? undefined} />
			<link rel="manifest" fetchPriority="high" href="/manifest.webmanifest" />

			<link rel="preconnect" fetchPriority="high" href="https://images.ctfassets.net/" />
			<link rel="preconnect" fetchPriority="high" href="https://res.cloudinary.com/" />
			<link rel="preconnect" fetchPriority="high" href="https://farm2.static.flickr.com" />
			<link rel="preconnect" fetchPriority="high" href="https://farm6.static.flickr.com" />
			<link rel="preconnect" fetchPriority="high" href="https://farm8.static.flickr.com" />
			<link rel="preconnect" fetchPriority="high" href="https://farm66.static.flickr.com" />

		</>
	);
}

export async function PageMetaTags() {
	return generateMetaTags();
}
