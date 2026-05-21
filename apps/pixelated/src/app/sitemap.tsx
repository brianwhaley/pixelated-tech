export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import type { MetadataRoute } from 'next';
import { generateSitemap, getOriginFromNextHeaders, getFullPixelatedConfig, buildSitemapConfig } from "@pixelated-tech/components/server";
import siteConfig from "@/app/data/siteconfig.json";

const pixelatedConfig = getFullPixelatedConfig();

export default async function SiteMapXML(): Promise<MetadataRoute.Sitemap> {
	const origin = await getOriginFromNextHeaders();
	const sitemapConfig = buildSitemapConfig(pixelatedConfig, siteConfig);
	sitemapConfig.siteConfig = siteConfig;
	const sitemap = await generateSitemap(sitemapConfig, origin);
	return sitemap;
}