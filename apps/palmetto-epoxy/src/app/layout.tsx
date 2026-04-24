import { headers } from "next/headers";
import { getRouteByKey, type Metadata, type SiteInfo, getFullPixelatedConfig } from "@pixelated-tech/components/server";
import { generateMetaTags } from "@pixelated-tech/components/server";
import { WebsiteSchema, LocalBusinessSchema, ServicesSchema, BreadcrumbListSchema } from "@pixelated-tech/components";
import { PixelatedServerConfigProvider } from "@pixelated-tech/components/server";
import { getContentfulEntriesByType, getContentfulEntryByField } from "@pixelated-tech/components";
import { VisualDesignStyles } from "@pixelated-tech/components/server";
import { LayoutClient } from "./elements/layoutclient";
import Header from "@/app/elements/header";
import Footer from "@/app/elements/footer";
import siteConfig from "@/app/data/siteconfig.json";
import "@pixelated-tech/components/css/pixelated.global.css";
import "@pixelated-tech/components/css/pixelated.grid.scss";
import "@/app/styles/globals.css";

/** Capitalize the first letter of each word/segment in `input`. */
export function capitalizeWords(input: string): string {
	if (!input) return input;
	// Match word-like segments (letters plus internal apostrophes/hyphens),
	// using Unicode-aware \p{L} class.
	return input.replace(/\p{L}[\p{L}'’-]*/gu, (w) =>
		w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
	);
}


export default async function RootLayout({children,}: Readonly<{children: React.ReactNode;}>) {
	
	const reqHeaders: Headers = await (headers() as Promise<Headers>);
	const path = reqHeaders.get("x-path") ?? "/";
	const origin = reqHeaders.get("x-origin");
	const url = reqHeaders.get("x-url") ?? `${origin}${path}`;
	const pathname = path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;
	let metadata: Metadata = getRouteByKey(siteConfig.routes, "path", pathname) ?? {};

	const siteInfo = siteConfig.siteInfo;

	// If the route is /projects/:project, prefer the Contentful `carouselCard`
	// metadata (server-side). Fall back to a humanized slug when Contentful
	// is unavailable or returns no match.
	const projectMatch = pathname.match(/^\/projects\/([^/]+)\/?$/i);
	if (projectMatch) {
		const raw = projectMatch[1] ?? '';
		// humanized fallback (used if Contentful lookup fails)
		let decoded: string;
		try { decoded = decodeURIComponent(raw); } catch { decoded = raw; }
		decoded = decoded.replace(/[-_]+/g, ' ').trim();
		if (decoded) metadata = {
			title: `Palmetto Epoxy | Projects - ${capitalizeWords(decoded)}`,
			description: `Palmetto Epoxy Project ${capitalizeWords(decoded)}`,
			keywords: `palmetto epoxy, ${capitalizeWords(decoded)}`,
		};
		// Attempt server-side Contentful lookup for a matching carouselCard
		try {
			const cfg = getFullPixelatedConfig();
			const apiProps = {
				base_url: cfg.contentful?.base_url ?? "",
				space_id: cfg.contentful?.space_id ?? "",
				environment: cfg.contentful?.environment ?? "",
				delivery_access_token: cfg.contentful?.delivery_access_token ?? "",
			};
			const cards = await getContentfulEntriesByType({ apiProps, contentType: 'carouselCard' });
			const card = await getContentfulEntryByField({ cards, searchField: 'title', searchVal: raw });
			if (card?.fields) {
				const title = (card.fields.title ?? '')?.toString()?.trim() || '';
				const desc = (card.fields.description ?? '')?.toString()?.trim() || '';
				// Keywords: support array or string; normalize and drop empties
				let kws = '';
				if (Array.isArray(card.fields.keywords)) {
					kws = card.fields.keywords
						.map((k: any) => (k ?? '').toString().trim())
						.filter(Boolean)
						.join(', ');
				} else {
					const kwRaw = (card.fields.keywords ?? '')?.toString();
					if (kwRaw) {
						// allow comma/semicolon-separated or sentence-style keywords
						kws = kwRaw.split(/[,;]|\.\s+/).map((s: string) => s.trim()).filter(Boolean).join(', ');
					}
				}
				// Fallback values (prefer decoded slug, otherwise route title)
				const fallbackTitle = decoded ? capitalizeWords(decoded) : (metadata?.title ?? 'Projects');
				const fallbackDesc = decoded ? `Palmetto Epoxy Project ${capitalizeWords(decoded)}` : (metadata?.description ?? '');
				const fallbackKeywords = decoded ? `palmetto epoxy, ${capitalizeWords(decoded)}` : (Array.isArray(metadata?.keywords) ? (metadata!.keywords as string[]).join(', ') : (metadata?.keywords ?? ''));
				metadata = {
					title: title ? `Palmetto Epoxy | Projects - ${title}` : `Palmetto Epoxy | Projects - ${fallbackTitle}`,
					description: desc || fallbackDesc,
					keywords: kws || fallbackKeywords,
				};
			} else {
				// no matching card — use humanized slug (if present) or existing route metadata
				// use defaults set already above
			}
		} catch (err) {
			// non-fatal: log and fall back to the humanized slug
			console.warn('projects layout: Contentful lookup failed', err);
			// use defaults set already above
		}
	}

	return (
		<>
			<LayoutClient />
			<html lang="en">
				<head>
					{ generateMetaTags({
						title: metadata?.title ?? "",
						description: metadata?.description ?? "",
						keywords: metadata?.keywords ?? "",
						origin: origin ?? "",
						url: url ?? "",
						siteInfo: siteInfo as unknown as SiteInfo,
					}) }
					<BreadcrumbListSchema routes={siteConfig.routes} currentPath={pathname} siteUrl={siteInfo.url} />
					<WebsiteSchema siteInfo={siteInfo as unknown as SiteInfo} />
					<LocalBusinessSchema siteInfo={siteInfo} />
					<ServicesSchema siteInfo={siteInfo} />
					<VisualDesignStyles visualdesign={siteConfig.visualdesign} />
					<link rel="preload" fetchPriority="high" as="image" type="image/webp" 
						href="https://www.palmetto-epoxy.com/images/logo/palmetto-epoxy-logo.jpg" ></link>
				</head>
				<body>
					<PixelatedServerConfigProvider>
						<header><Header /></header>
						<main>{children}</main>
						<footer><Footer /></footer>
					</PixelatedServerConfigProvider>
				</body>
			</html>
		</>
	);
}
