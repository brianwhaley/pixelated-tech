export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import type { MetadataRoute } from 'next';
import { generateSitemap } from "@pixelated-tech/components/server";

export default async function SiteMapXML(): Promise<MetadataRoute.Sitemap> {
	return generateSitemap();
}
