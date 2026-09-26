/**
 * Sites Management Integration Services
 * Server-side utilities for site configuration and data management
 */

import fs from 'fs';
import path from 'path';

export interface SiteConfig {
  name: string;
  /** Optional local path (may be absent for remote-only checks) */
  localPath?: string;
  /** Optional remote (e.g., full URL or owner/repo string) */
  remote?: string;
  /** Optional explicit repository identifier (e.g., "owner/repo" or just "repo") */
  repo?: string;
  /** Optional explicit repo owner */
  owner?: string;
  ga4PropertyId?: string;
  searchConsoleUrl?: string;
  [key: string]: any;
}  

/**
 * Load sites configuration from JSON file
 */
export async function loadSitesConfig(configPath?: string): Promise<SiteConfig[]> {
	try {
		const sitesPath = configPath || path.join(process.cwd(), 'src/app/data/sites.json');

		if (!fs.existsSync(sitesPath)) {
			throw new Error('Sites configuration not found');
		}

		const sitesData = fs.readFileSync(sitesPath, 'utf8');
		const parsed = JSON.parse(sitesData);

		return Array.isArray(parsed) ? parsed : (parsed.sites || []);
	} catch (error) {
		console.error('Error loading sites:', error);
		throw new Error('Failed to load sites configuration', { cause: error });
	}
}

/**
 * Get normalized hostnames from site configuration.
 */
export function getSitesConfigDomains(sites: SiteConfig[]): string[] {
	return sites.map((site) => {
		const value = String(site.url ?? '').trim().toLowerCase();
		if (!value) return '';

		try {
			return new URL(value.includes('://') ? value : `https://${value}`).hostname.replace(/^www\./, '');
		} catch {
			return '';
		}
	}).filter(Boolean);
}

/**
 * Get a specific site configuration by name
 */
export async function getSiteConfig(siteName: string, configPath?: string): Promise<SiteConfig | null> {
	const sites = await loadSitesConfig(configPath);
	return sites.find(site => site.name === siteName) || null;
}
