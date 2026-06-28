import PropTypes, { InferProps } from "prop-types";
import type { MetadataRoute } from 'next';
import type { NextRequest } from 'next/server';
import { encode } from 'html-entities';
import { getAllRoutes } from "./metadata.functions";
import { getWordPressItems, getWordPressItemImages } from "../integrations/wordpress.functions";
import { getContentfulEntriesByType, getContentfulFieldValues, getContentfulImagesFromEntries, getContentfulAssets, contentfulValueToSlug } from "../integrations/contentful.delivery";
import { getEbayAppToken, getEbayItemsSearch } from "../shoppingcart/ebay.functions";
import { getSquareStoreItems } from "../shoppingcart/square";
import { getFullPixelatedConfig } from '../config/config';
import type { PixelatedConfig } from '../config/config.types';
import { CacheManager } from '../foundation/cache-manager';
import { getDomain } from './utilities';
import { smartFetch } from './smartfetch';
import { getServicePathPrefix } from '../elements/services.functions';

const debug = false;

const DEFAULT_CONTENTFUL_IMAGE_FIELDS = ['image', 'images', 'carouselImages'];

export type SitemapEntry = MetadataRoute.Sitemap[number];
/* export type SitemapEntry = {
	url: string;
	lastModified?: string;
	changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
	priority?: number;
	images?: string[];
}; */



export type SitemapConfig = {
	createPageURLs?: boolean;
	createWordPressURLs?: boolean;
	createWordPressImageURLs?: boolean;
	createImageURLs?: boolean;
	createImageURLsFromJSON?: boolean;
	createContentfulURLs?: boolean;
	createContentfulAssetURLs?: boolean;
	createPageBuilderURLs?: boolean;
	createEbayItemURLs?: boolean;
	createSquareItemURLs?: boolean;
	wordpress?: { site?: string };
	imageJson?: { path?: string };
	contentful?: any; // contentful api props object
	siteConfig?: any; // Unified pixelated.config.json data
};

/**
 * Builds a SitemapConfig object based on the pixelated.config.json
 * Automatically enables features based on what's configured
 */
export function buildSitemapConfig(
	pixelatedConfig?: any,
	overrides: any = {}
): SitemapConfig {
	const config = {
		...(pixelatedConfig ?? getFullPixelatedConfig()),
		...(typeof overrides === 'object' && overrides ? overrides : {}),
	};
	const integrations = config?.integrations || {};
	const sitemapConfig: SitemapConfig = {
		siteConfig: config,
		createPageURLs: true,
		createImageURLsFromJSON: true,
	};

	// WordPress integration
	const wordpress = integrations.wordpress;
	if (wordpress?.site) {
		sitemapConfig.wordpress = { site: wordpress.site };
		sitemapConfig.createWordPressURLs = true;
		sitemapConfig.createWordPressImageURLs = true;
	}

	// Contentful integration
	const contentful = integrations.contentful;
	if (contentful?.space_id) {
		const contentfulConfig: any = {
			base_url: contentful.base_url ?? '',
			space_id: contentful.space_id ?? '',
			environment: contentful.environment ?? '',
			access_token: contentful.delivery_access_token ?? '',
		};

		const sitemapProps = [
			'sitemapContentType',
			'sitemapField',
			'sitemapRoutePrefix',
			'sitemapRouteTemplate',
		] as const;
		for (const key of sitemapProps) {
			const value = contentful[key];
			if (value) {
				contentfulConfig[key] = value;
			}
		}

		if (contentful.sitemap) {
			contentfulConfig.sitemap = {
				...contentful.sitemap,
				...(contentful.sitemap.imageFields ? { imageFields: [...contentful.sitemap.imageFields] } : {}),
			};
		}

		if (contentful.sitemapImageFields) {
			contentfulConfig.sitemapImageFields = [...contentful.sitemapImageFields];
		}

		sitemapConfig.contentful = contentfulConfig;
		sitemapConfig.createContentfulURLs = !!(contentful.sitemap || contentful.sitemapContentType);
		sitemapConfig.createContentfulAssetURLs = !!(contentful.space_id && contentful.delivery_access_token);
	}

	// eBay integration
	if (integrations.ebay?.appId) {
		sitemapConfig.createEbayItemURLs = true;
	}

	// Square catalog sitemap integration
	if (integrations.square?.squareItemCategoryId) {
		sitemapConfig.createSquareItemURLs = true;
	}

	return sitemapConfig;
}




export function getOriginFromHeaders(headersProp?: { get: (k: string) => string | null } | undefined): string | undefined {
	try {
		if (!headersProp) return undefined;

		// Prefer explicit origin sources when present
		const candKeys = ['x-origin', 'origin', 'x-url'];
		for (const k of candKeys) {
			try {
				const v = headersProp.get(k);
				if (v) {
					try {
						return new URL(String(v)).origin;
					} catch {
						// ignore parse error and continue
					}
				}
			} catch {
				// ignore header access errors
			}
		}

		const hostHeader = headersProp.get('x-forwarded-host') || headersProp.get('host') || undefined;
		if (hostHeader) {
			const first = String(hostHeader).split(',')[0].trim();
			if (first) {
				const hostname = first.split(':')[0];
				if (hostname) {
					const proto = headersProp.get('x-forwarded-proto') || 'https';
					return `${proto}://${hostname}`;
				}
			}
		}

		return undefined;
	} catch (e) {
		console.log('Error getting origin from headers:', e);
		return undefined;
	}
}

export type RuntimeEnv = 'auto' | 'local' | 'prod';

export function getRuntimeEnvFromHeaders(headersProp?: { get: (k: string) => string | null } | undefined): RuntimeEnv {
	const origin = getOriginFromHeaders(headersProp);
	if (!origin) return 'auto';
	if (origin.includes('localhost') || origin.includes('127.0.0.1')) return 'local';
	return 'prod';
}

/**
 * Next-specific async helper: getOriginFromNextHeaders
 * - Convenience wrapper that dynamically imports `next/headers` and calls our `getOriginFromHeaders` function
 * - Falls back to `fallbackOrigin` if `next/headers` not available or on error
 */
export async function getOriginFromNextHeaders() {
	try {
		// dynamic import ensures we don't require 'next/headers' in non-Next environments
		const mod = await import('next/headers');
		if (mod && typeof mod.headers === 'function') {
			const hdrs = await mod.headers();
			return getOriginFromHeaders(hdrs);
		}
	} catch (e) {
		console.log("Error getting origin from Next headers:", e);
		// Not in a Next environment or module not found; return fallback
	}
	return undefined;
}



export function flattenRoutes(routes: any) {
	// Convenience wrapper for the project-level getAllRoutes helper
	return getAllRoutes(routes, 'routes');
}



export function jsonToSitemapEntries(entries: SitemapEntry[]){
	return entries.map(
		(entry: SitemapEntry) => 
			`<url>
				<loc>${entry.url}</loc>
				<lastmod>${entry.lastModified}</lastmod>
				<changefreq>${entry.changeFrequency}</changefreq>
				<priority>${entry.priority}</priority>
			</url>`
	).join('');
}



/**
 * generateSitemap: compose the individual create* functions based on toggles in SitemapConfig.
 * - Keep this minimal for the MVP: no retries/caching here. Add TODOs for later.
 */
export async function generateSitemap(originInput?: string): Promise<MetadataRoute.Sitemap> {
	const resolvedConfig = buildSitemapConfig();
	const origin = originInput ?? await getOriginFromNextHeaders();
	const sitemapEntries: any[] = [];

	// Defaults: pages true, image json true, others false
	const usePages = resolvedConfig.createPageURLs ?? true;
	const useWP = resolvedConfig.createWordPressURLs ?? false;
	const useWPImages = resolvedConfig.createWordPressImageURLs ?? false;
	const useImageJSON = resolvedConfig.createImageURLsFromJSON ?? true;
	const useContentful = resolvedConfig.createContentfulURLs ?? false;
	const useContentfulAssets = resolvedConfig.createContentfulAssetURLs ?? false;
	const usePageBuilder = resolvedConfig.createPageBuilderURLs ?? false;
	const useEbay = resolvedConfig.createEbayItemURLs ?? false;
	const useSquare = resolvedConfig.createSquareItemURLs ?? false;

	// ORDER IS IMPORTANT - THIS IS THE ORDER THEY WILL APPEAR IN THE SITEMAP

	// Pages
	if (usePages) {
		const routes = resolvedConfig.siteConfig?.routes;
		if (routes) {
			const flat = flattenRoutes(routes);
			sitemapEntries.push(...(await createPageURLs(flat, origin)));
		}
	}
	// Dynamic service and service-area pages from optional siteconfig.json data
	if (resolvedConfig.siteConfig) {
		sitemapEntries.push(...(await createSiteConfigURLs(resolvedConfig.siteConfig, origin)));
	}
	// Contentful (pages)
	if (useContentful && resolvedConfig.contentful) {
		sitemapEntries.push(...(await createContentfulURLs({ apiProps: resolvedConfig.contentful, origin })));
	}
	// Ebay items
	if (useEbay) {
		sitemapEntries.push(...(await createEbayItemURLs(origin)));
	}
	// Square catalog items
	if (useSquare) {
		sitemapEntries.push(...(await createSquareItemURLs(origin)));
	}
	// Page Builder (existing helper in package not always present)
	if (usePageBuilder && resolvedConfig.contentful) {
		// TODO: wire createContentfulPageBuilderURLs if needed; skipping for MVP
	}
	// WordPress
	if (useWP && resolvedConfig.wordpress?.site) {
		sitemapEntries.push(...(await createWordPressURLs({ site: resolvedConfig.wordpress.site, includeImages: useWPImages })));
	}
	// Image JSON
	if (useImageJSON) {
		sitemapEntries.push(...(await createImageURLsFromJSON(origin, resolvedConfig.imageJson?.path ?? 'public/site-images.json')));
	}
	// Contentful assets (images and videos)
	if (useContentfulAssets && resolvedConfig.contentful) {
		sitemapEntries.push(...(await createContentfulAssetURLs({ apiProps: resolvedConfig.contentful, origin })));
	}
	// Deduplicate by URL and properly merge images arrays if present
	const map = new Map<string, any>();
	for (const entry of sitemapEntries.flat()) {
		if (!entry || !entry.url) continue;
		const key = (entry.url as string).toLowerCase();
		const existing = map.get(key);
		if (!existing) {
			map.set(key, { ...entry });
		} else {
			// Merge images
			if (entry.images && entry.images.length) {
				existing.images = Array.from(new Set([...(existing.images || []), ...entry.images]));
			}
			// Keep the earliest lastModified? Use whichever is present (prefer existing)
			existing.lastModified = existing.lastModified || entry.lastModified;
			existing.priority = existing.priority || entry.priority;
			existing.changeFrequency = existing.changeFrequency || entry.changeFrequency;
			map.set(key, existing);
		}
	}
	const entries = Array.from(map.values()) as SitemapEntry[];
	return entries as unknown as MetadataRoute.Sitemap;
}




export async function createPageURLs(routes: { path: string }[], origin?: string) {
	const sitemap: SitemapEntry[] = [];
	const allRoutes = getAllRoutes(routes, "routes");
	for ( const route of allRoutes ){
		if(route.path.substring(0, 4).toLowerCase() !== 'http') {
			const base = origin ? `${origin}` : '';
			const path = route.path.startsWith('/') ? route.path : `/${route.path}`;
			sitemap.push({
				url: `${base}${path}` ,
				lastModified: new Date(),
				changeFrequency: "hourly",
				priority: 1.0,
			});
		}
	}
	return sitemap;
}





export async function createSiteConfigURLs(siteConfig: any, origin?: string): Promise<SitemapEntry[]> {
	const sitemap: SitemapEntry[] = [];
	if (!siteConfig || typeof siteConfig !== 'object' || !siteConfig.siteInfo) {
		return sitemap;
	}

	const services = Array.isArray(siteConfig.siteInfo.services) ? siteConfig.siteInfo.services : [];
	const serviceAreas = Array.isArray(siteConfig.siteInfo.serviceAreas) ? siteConfig.siteInfo.serviceAreas : [];

	const servicePathPrefix = getServicePathPrefix(siteConfig?.siteInfo);
	for (const service of services) {
		const rawPath = `${servicePathPrefix}/${contentfulValueToSlug({ value: service.slug ?? service.name })}`;
		const path = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
		const url = typeof rawPath === 'string' && rawPath.startsWith('http') ? rawPath : `${origin ? origin : ''}${path}`;
		if (url) {
			sitemap.push({
				url,
				lastModified: new Date(),
				changeFrequency: 'hourly',
				priority: 0.8,
			});
		}
	}

	for (const serviceArea of serviceAreas) {
		const rawPath = serviceArea.url || serviceArea.path || `/service-areas/${contentfulValueToSlug({ value: serviceArea.slug ?? serviceArea.name })}`;
		const path = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
		const url = typeof rawPath === 'string' && rawPath.startsWith('http') ? rawPath : `${origin ? origin : ''}${path}`;
		if (url) {
			sitemap.push({
				url,
				lastModified: new Date(),
				changeFrequency: 'hourly',
				priority: 0.8,
			});
		}
	}

	return sitemap;
}

export async function createImageURLsFromJSON(origin?: string, jsonPath = 'public/site-images.json'): Promise<SitemapEntry[]>{
	const sitemap: any[] = [];
	try {
		let urlPath = jsonPath;
		if (urlPath.startsWith('public/')) urlPath = urlPath.slice('public/'.length);
		if (!urlPath.startsWith('/')) urlPath = `/${urlPath}`;
		const base = origin ? origin : '';
		const json = await smartFetch(`${base}${urlPath}`);
		let imgs: string[] = [];
		if (Array.isArray(json)) {
			imgs = json;
		} else if (json && Array.isArray(json.images)) {
			imgs = json.images;
		} else {
			return sitemap;
		}

		// Use an array of URL strings so the sitemap serializer writes the URL text
		const newImages = imgs.map(i => {
			const rel = i.startsWith('/') ? i : `/${i}`;
			return encode(`${origin}${rel}`);
		});
		sitemap.push({
			url: `${origin ? origin : ''}/images`,
			images: newImages,
		});
	} catch /* (e) */ {
		// During build time, fetch will fail - suppress the error to avoid build noise
		// The function returns an empty array, which is acceptable
	}
	return sitemap;
}




export async function createWordPressURLs(props: {site: string, includeImages?: boolean}){
	const sitemap: SitemapEntry[] = [];
	const blogPosts = await getWordPressItems({site: props.site});
	for await (const post of blogPosts ?? []) {
		// Next.js sitemap only supports string URLs for images, so we map to .url
		const images = props.includeImages
			? getWordPressItemImages(post).map(img => encode(img.url))
			: [];
		sitemap.push({
			url: post.URL ,
			lastModified: post.modified ? new Date(post.modified) : new Date(),
			changeFrequency: "hourly" as const,
			priority: 1.0,
			images: images.length > 0 ? images : undefined
		});
	}
	return sitemap;
}




/**
 * createContentfulURLs — Create sitemap entries for Contentful content by fetching a content type field.
 *
 * @param {shape} [props.apiProps] - Contentful API props: { base_url, space_id, environment, delivery_access_token }.
 * @param {string} [props.base_url] - Contentful base API URL.
 * @param {string} [props.space_id] - Contentful space id.
 * @param {string} [props.environment] - Contentful environment (e.g., 'master').
 * @param {string} [props.delivery_access_token] - Delivery API token (read-only) for Contentful.
 * @param {string} [props.origin] - Origin to prefix generated URLs (e.g., 'https://example.com').
 */
createContentfulURLs.propTypes = {
/** Contentful API properties */
	apiProps: PropTypes.shape({
		/** Contentful base URL */
		base_url: PropTypes.string.isRequired,
		/** Contentful space id */
		space_id: PropTypes.string.isRequired,
		/** Contentful environment */
		environment: PropTypes.string.isRequired,
		/** Delivery API token */
		delivery_access_token: PropTypes.string.isRequired,
		/** Contentful sitemap configuration */
		sitemap: PropTypes.shape({
			contentType: PropTypes.string,
			field: PropTypes.string,
			routePrefix: PropTypes.string,
			routeTemplate: PropTypes.string,
			imageFields: PropTypes.arrayOf(PropTypes.string),
		}),
		/** Flattened Contentful sitemap config for pixelated.config.json */
		sitemapContentType: PropTypes.string,
		sitemapField: PropTypes.string,
		sitemapRoutePrefix: PropTypes.string,
		sitemapRouteTemplate: PropTypes.string,
		sitemapImageFields: PropTypes.arrayOf(PropTypes.string),
	}).isRequired,
	/** Origin used to build absolute URLs */
	origin: PropTypes.string,
	/** Optional override for Contentful content type */
	contentType: PropTypes.string,
	/** Optional override for field used to generate page slugs */
	field: PropTypes.string,
	/** Optional image field names to resolve asset references from entries */
	imageFields: PropTypes.arrayOf(PropTypes.string),
	/** Optional route prefix for generated URLs */
	routePrefix: PropTypes.string,
	/** Optional route template for generated URLs */
	routeTemplate: PropTypes.string,
};
export type createContentfulURLsType = InferProps<typeof createContentfulURLs.propTypes>;
export async function createContentfulURLs(props: createContentfulURLsType){
	const sitemap: SitemapEntry[] = [];
	const config = getFullPixelatedConfig() as PixelatedConfig;
	const providerContentfulApiProps = config?.integrations?.contentful;
	const mergedApiProps = { ...props.apiProps, ...providerContentfulApiProps };
	const sitemapConfig = props.apiProps || {} as any;

	const contentType = props.contentType ?? sitemapConfig.sitemapContentType ?? sitemapConfig.sitemap?.contentType;
	const field = props.field ?? sitemapConfig.sitemapField ?? sitemapConfig.sitemap?.field;
	const routePrefix = props.routePrefix ?? sitemapConfig.sitemapRoutePrefix ?? sitemapConfig.sitemap?.routePrefix;
	const normalizedRoutePrefix = routePrefix?.replace(/\/$$/, '');
	const routeTemplate = props.routeTemplate ?? sitemapConfig.sitemapRouteTemplate ?? sitemapConfig.sitemap?.routeTemplate;
	const imageFieldsSource = props.imageFields ?? sitemapConfig.sitemapImageFields ?? sitemapConfig.sitemap?.imageFields;

	if (!contentType || !field || (!routeTemplate && !routePrefix)) {
		return sitemap;
	}
	const imageFields = Array.isArray(imageFieldsSource) && imageFieldsSource.length > 0
		? imageFieldsSource.filter((field): field is string => typeof field === 'string')
		: DEFAULT_CONTENTFUL_IMAGE_FIELDS;

	const entries = await getContentfulEntriesByType({ apiProps: mergedApiProps, contentType });
	if (!entries?.items?.length) {
		return sitemap;
	}

	for ( const entry of entries.items ){
		const value = entry?.fields?.[field];
		if (value === undefined || value === null || String(value).trim() === '') {
			continue;
		}

		const slugValue = contentfulValueToSlug({ value: String(value) });
		const relativePath = routeTemplate
			? routeTemplate.replace(/\$\{value\}/g, slugValue)
			: `${normalizedRoutePrefix}/${slugValue}`;
		const normalizedPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

		const imageRefs: any[] = [];
		for (const imageField of imageFields) {
			const fieldValue = entry.fields?.[imageField];
			if (!fieldValue) continue;
			imageRefs.push(...(Array.isArray(fieldValue) ? fieldValue : [fieldValue]));
		}

		const images = imageRefs.length > 0
			? await getContentfulImagesFromEntries({ images: imageRefs, assets: entries.includes?.Asset })
			: [];
		const imageUrls = images
			.map((image: any) => image.image ? encode(image.image) : image.image)
			.filter(Boolean);

		const base = props.origin ? props.origin : '';
		const sitemapEntry: any = {
			url: `${base}${normalizedPath}` ,
			lastModified: new Date(),
			changeFrequency: 'hourly',
			priority: 1.0,
		};
		if (imageUrls.length > 0) {
			sitemapEntry.images = imageUrls;
		}
		sitemap.push(sitemapEntry);
	}
	return sitemap;
}



/**
 * createContentfulPageBuilderURLs — Generate page URLs for Contentful Page Builder pages.
 *
 * @param {shape} [props.apiProps] - Contentful API props (base_url, space_id, environment, delivery_access_token).
 * @param {string} [props.base_url] - Contentful base API URL.
 * @param {string} [props.space_id] - Contentful space id.
 * @param {string} [props.environment] - Contentful environment.
 * @param {string} [props.delivery_access_token] - Delivery API token for read-only access.
 * @param {string} [props.origin] - Origin used to build absolute page URLs.
 */
createContentfulPageBuilderURLs.propTypes = {
/** Contentful API properties */
	apiProps: PropTypes.shape({
		/** Contentful base URL */
		base_url: PropTypes.string.isRequired,
		/** Contentful space id */
		space_id: PropTypes.string.isRequired,
		/** Contentful environment */
		environment: PropTypes.string.isRequired,
		/** Delivery API token */
		delivery_access_token: PropTypes.string.isRequired,
	}).isRequired,
	/** Origin used to build absolute URLs */
	origin: PropTypes.string,
};
export type createContentfulPageBuilderURLsType = InferProps<typeof createContentfulPageBuilderURLs.propTypes>;
export async function createContentfulPageBuilderURLs(props: createContentfulPageBuilderURLsType){
	const sitemap: SitemapEntry[] = [];
	const contentType = "page"; 
	const field = "pageName";
	const pageNames = await getContentfulFieldValues({
		apiProps: props.apiProps, contentType: contentType, field: field
	});
	for ( const pageName of pageNames ){
		const base = props.origin ? props.origin : '';
		sitemap.push({
			url: `${base}/${encodeURIComponent(pageName)}` ,
			lastModified: new Date(),
			changeFrequency: "hourly",
			priority: 1.0,
		});
	}
	return sitemap;
}





/**
 * createContentfulAssetURLs — Fetch Contentful assets and generate absolute image and video URLs for the sitemap.
 *
 * @param {shape} [props.apiProps] - Contentful API props (proxyURL optional, base_url, space_id, environment, access_token).
 * @param {string} [props.proxyURL] - Optional proxy base URL to route asset requests through.
 * @param {string} [props.base_url] - Contentful base API URL.
 * @param {string} [props.space_id] - Contentful space id.
 * @param {string} [props.environment] - Contentful environment.
 * @param {string} [props.access_token] - Access token to read assets from Contentful.
 * @param {string} [props.origin] - Origin used to convert relative asset paths to absolute URLs.
 */
createContentfulAssetURLs.propTypes = {
/** Contentful API properties */
	apiProps: PropTypes.shape({
		/** Optional proxy URL */
		proxyURL: PropTypes.string,
		/** Contentful base URL */
		base_url: PropTypes.string.isRequired,
		/** Contentful space id */
		space_id: PropTypes.string.isRequired,
		/** Contentful environment */
		environment: PropTypes.string.isRequired,
		/** Access token to read assets */
		access_token: PropTypes.string.isRequired,
	}).isRequired,
	/** Origin used to convert relative URLs to absolute */
	origin: PropTypes.string,
};
export type createContentfulAssetURLsType = InferProps<typeof createContentfulAssetURLs.propTypes>;
export async function createContentfulAssetURLs(props: createContentfulAssetURLsType): Promise<SitemapEntry[]> {
	const sitemap: SitemapEntry[] = [];
	const config = getFullPixelatedConfig() as PixelatedConfig;
	const providerContentfulApiProps = config?.integrations?.contentful;
	// Changed order: provider config overrides apiProps for security (tokens)
	const mergedApiProps = { ...props.apiProps, ...providerContentfulApiProps };
	try {
		const rawAssets = await getContentfulAssets({ apiProps: mergedApiProps });
		if (!Array.isArray(rawAssets?.items) || rawAssets.items.length === 0) {
			return sitemap;
		}

		// Process assets into images and videos by content type
		const imageAssets = rawAssets.items.filter((a: any) => 
			a.fields?.file?.contentType?.startsWith('image/')
		);
		// Process image assets
		if (imageAssets.length > 0) {
			const imageURLs = imageAssets.map((a: any) => {
				let url = a.fields?.file?.url || '';
				if (!url) return '';
				if (url.startsWith('//')) url = `https:${url}`;
				else {
					const base = props.origin ? props.origin : '';
					if (url.startsWith('/')) url = `${base}${url}`;
					else if (!url.startsWith('http://') && !url.startsWith('https://')) url = `${base}/${url}`;
				}
				return encode(url);
			}).filter(Boolean);
			if (imageURLs.length > 0) {
				sitemap.push({
					url: `${props.origin ? props.origin : ''}/images`,
					lastModified: new Date(),
					changeFrequency: 'always',
					priority: 1.0,
					images: imageURLs,
				});
			}
		}

		const videoAssets = rawAssets.items.filter((a: any) => 
			a.fields?.file?.contentType?.startsWith('video/')
		);
		// Process video assets
		if (videoAssets.length > 0) {

			if (debug) console.log("Video Assets", videoAssets);

			sitemap.push({
				url: `${props.origin}/videos`,
				lastModified: new Date(),
				changeFrequency: 'always',
				priority: 1.0,
				// videos: videoURLs,
				videos: videoAssets.map((a: any) => {
					let url = a.fields?.file?.url || '';
					if (!url) return null;
					if (url.startsWith('//')) url = `https:${url}`;
					else {
						const base = props.origin ? props.origin : '';
						if (url.startsWith('/')) url = `${base}${url}`;
						else if (!url.startsWith('http://') && !url.startsWith('https://')) url = `${base}/${url}`;
					}
					return { 
						title: a.fields?.title || 'Untitled Video',
						thumbnail_loc: `${props.origin ? props.origin : ''}/images/placeholder.png`,
						description: a.fields?.description || 'No description available',
						publication_date: a.sys?.createdAt || new Date().toISOString(),
						content_loc: encode(url),
						player_loc: encode(url),
						family_friendly: 'yes',
						// duration: 600,
					};
				})
			});
		}

	} catch(e) {
		if (typeof console !== 'undefined') console.warn('createContentfulAssetURLs failed', e);
	}
	return sitemap as SitemapEntry[];
}



export async function createEbayItemURLs(origin?: string) {
	const sitemap: SitemapEntry[] = [];

	// Load configuration
	const config = getFullPixelatedConfig() as PixelatedConfig;
	const globalProxy = config.integrations?.global?.proxyUrl;
	const ebay = config?.integrations?.ebay;

	const ebayProps = { 
		...(globalProxy ? { proxyURL: globalProxy } : {}),
		...ebay 
	};

	const cacheTTL = getEbayCacheTTL(ebay?.cacheTTL);
	let items;
	try {
		items = await fetchCachedEbayItems(ebayProps, cacheTTL);
	} catch (error) {
		if (typeof console !== 'undefined') console.warn('createEbayItemURLs skipped; unable to fetch items', error);
		return sitemap;
	}
	if (!items || !items.length) {
		return sitemap;
	}
	const base = origin ? origin : '';
	for (const item of items) {
		sitemap.push({
			url: `${base}/store/${item.legacyItemId}` ,
			lastModified: item.itemCreationDate ? new Date(item.itemCreationDate) : new Date(),
			changeFrequency: "hourly",
			priority: 1.0,
		});
	}
	return sitemap;
}

export async function createSquareItemURLs(origin?: string) {
	const sitemap: SitemapEntry[] = [];
	const config = getFullPixelatedConfig() as PixelatedConfig;
	if (!config?.integrations?.square?.squareItemCategoryId) {
		return sitemap;
	}

	const cacheTTL = SITEMAP_TTL;
	let items;
	try {
		items = await fetchCachedSquareItems(cacheTTL);
	} catch (error) {
		if (typeof console !== 'undefined') console.warn('createSquareItemURLs skipped; unable to fetch items', error);
		return sitemap;
	}
	if (!items || !items.length) {
		return sitemap;
	}
	for (const item of items) {
		if (!item?.itemURL) continue;

		const imageUrls: string[] = [];
		if (Array.isArray(item.itemImageURLs)) {
			imageUrls.push(...item.itemImageURLs.filter((img: any) => typeof img === 'string' && img.trim().length > 0));
		} else if (typeof item.itemImageURL === 'string' && item.itemImageURL.trim().length > 0) {
			imageUrls.push(item.itemImageURL);
		}

		const base = origin ? origin : '';
		const normalizedImages = imageUrls
			.map((img) => img.trim())
			.filter(Boolean)
			.map((img) => img.startsWith('http') ? img : `${base}${img.startsWith('/') ? img : `/${img}`}`)
			.map((img) => encode(img));

		const entry: any = {
			url: item.itemURL.startsWith('http') ? item.itemURL : `${base}${item.itemURL}`,
			lastModified: new Date(),
			changeFrequency: 'hourly',
			priority: 1.0,
		};
		if (normalizedImages.length > 0) {
			entry.images = normalizedImages;
		}
		sitemap.push(entry);
	}
	return sitemap;
}

async function fetchCachedSquareItems(cacheTTL: number) {
	const cached = squareSitemapCache.get<any[]>(SQUARE_SITE_SITEMAP_KEY);
	if (cached) {
		return cached;
	}
	try {
		const response = await getSquareStoreItems();
		const items = response?.items ?? [];
		if (items.length) {
			squareSitemapCache.set(SQUARE_SITE_SITEMAP_KEY, items, cacheTTL);
		}
		return items;
	} catch (error) {
		console.error('Error fetching Square items for sitemap:', error);
		throw error;
	}
}

const SITEMAP_TTL = 24 * 60 * 60 * 1000; // one day
const EBAY_SITE_SITEMAP_KEY = 'ebay_sitemap_items';
const ebaySitemapCache = new CacheManager({ mode: 'memory', domain: getDomain(), namespace: 'ebaySitemap', ttl: SITEMAP_TTL });
const SQUARE_SITE_SITEMAP_KEY = 'square_sitemap_items';
const squareSitemapCache = new CacheManager({ mode: 'memory', domain: getDomain(), namespace: 'squareSitemap', ttl: SITEMAP_TTL });

function getEbayCacheTTL(configTTL?: number) {
	if (typeof configTTL === 'number' && configTTL > 0) {
		return configTTL;
	}
	return SITEMAP_TTL;
}

async function fetchCachedEbayItems(apiProps: any, cacheTTL: number) {
	const cached = ebaySitemapCache.get<any[]>(EBAY_SITE_SITEMAP_KEY);
	if (cached) {
		return cached;
	}
	try {
		const token = await getEbayAppToken({ apiProps });
		const data = await getEbayItemsSearch({ apiProps, token });
		const items = data?.itemSummaries ?? [];
		if (items.length) {
			ebaySitemapCache.set(EBAY_SITE_SITEMAP_KEY, items, cacheTTL);
		}
		return items;
	} catch (error) {
		console.error('Error fetching eBay items for sitemap:', error);
		throw error;
	}
}

export function clearEbaySitemapCache() {
	ebaySitemapCache.clear();
}

export function clearSquareSitemapCache() {
	squareSitemapCache.clear();
}

