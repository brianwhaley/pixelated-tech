import type { MetadataRoute } from 'next';
import type { SiteInfo } from '../config/config.types';
import { getFullPixelatedConfig } from '../config/config';

export interface ManifestOptions {
	customProperties?: Partial<MetadataRoute.Manifest>;
}

/**
 * Generates a PWA manifest from pixelated.config.json siteInfo configuration
 * @param options - Optional custom manifest properties to merge into the manifest
 * @returns Next.js manifest object
 */
export function generateManifest(options: ManifestOptions = {}): MetadataRoute.Manifest {
	const { customProperties = {} } = options;
	const pixelatedConfig = getFullPixelatedConfig();
	const siteInfo = pixelatedConfig.siteInfo as SiteInfo | undefined;
	if (!siteInfo) {
		throw new Error('pixelated.config.json must include siteInfo to generate a manifest.');
	}

	const baseManifest: MetadataRoute.Manifest = {
		// @ts-expect-error - 'author' is not in standard Manifest type but used by some PWA implementations
		author: siteInfo.author,
		background_color: siteInfo.background_color ?? undefined,
		default_locale: siteInfo.default_locale,
		description: siteInfo.description,
		developer: {
			name: siteInfo.author || "Developer",
			url: siteInfo.url
		},
		display: siteInfo.display as "standalone" | "fullscreen" | "minimal-ui" | "browser" || "standalone",
		homepage_url: siteInfo.url,
		icons: [{
			src: siteInfo.favicon || "/favicon.ico",
			sizes: siteInfo.favicon_sizes || "64x64 32x32 24x24 16x16",
			type: siteInfo.favicon_type || "image/x-icon"
		}],
		name: siteInfo.name,
		short_name: siteInfo.name,
		start_url: ".",
		theme_color: siteInfo.theme_color ?? undefined,
	};

	// Merge with custom properties, allowing overrides
	return { ...baseManifest, ...customProperties };
}

/**
 * Default export for Next.js manifest route
 * @param options - Configuration options
 * @returns Next.js manifest object
 */
export function Manifest(options: ManifestOptions): MetadataRoute.Manifest {
	return generateManifest(options);
}