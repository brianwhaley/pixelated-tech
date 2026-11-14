"use server";

const debug = false;

import { CoreWebVitalsData, PSIScores, PSICategory, PSIAudit } from './site-health-types';
import { getFullPixelatedConfig } from '../../config/config';
import { smartFetch } from '../../foundation/smartfetch';
import { buildUrl } from '../../foundation/urlbuilder';


/**
 * Core Web Vitals Analysis Integration Services
 * Server-side utilities for performing comprehensive Core Web Vitals analysis using Google PageSpeed Insights
 * Note: This makes external HTTP requests and should only be used server-side
 */

interface PSIAuditRef {
	id: string;
}

interface PSIAuditValue {
	numericValue?: number;
	displayValue?: string;
}

function getAuditMetricValue(audit: PSIAuditValue | undefined): number {
	if (typeof audit?.numericValue === 'number') return audit.numericValue;

	const match = audit?.displayValue?.match(/(-?\d+(?:\.\d+)?)\s*(ms|s)?/i);
	if (!match) return 0;

	const value = Number.parseFloat(match[1]);
	return match[2]?.toLowerCase() === 's' ? value * 1000 : value;
}

// Simple in-memory cache for PSI results
interface CacheEntry {
  data: CoreWebVitalsData;
  timestamp: number;
}

const psiCache = new Map<string, CacheEntry>();
const CACHE_TTL_SUCCESS = 60 * 60 * 1000; // 1 hour for successful results
const CACHE_TTL_ERROR = 5 * 60 * 1000; // 5 minutes for error results

// Clean up expired cache entries periodically
setInterval(() => {
	const now = Date.now();
	for (const [key, entry] of psiCache.entries()) {
		const ttl = entry.data.status === 'success' ? CACHE_TTL_SUCCESS : CACHE_TTL_ERROR;
		if (now - entry.timestamp > ttl) {
			psiCache.delete(key);
		}
	}
}, 10 * 60 * 1000); // Clean up every 10 minutes

export async function performCoreWebVitalsAnalysis(
	url: string,
	siteName: string,
	useCache: boolean = true,
	strategy: 'mobile' | 'desktop' = 'mobile'
): Promise<CoreWebVitalsData> {
	try {
		// Check cache first (if caching is enabled)
		const cacheKey = `${siteName}:${url}:${strategy}`;
		if (useCache) {
			const cached = psiCache.get(cacheKey);
			if (cached) {
				const ttl = cached.data.status === 'success' ? CACHE_TTL_SUCCESS : CACHE_TTL_ERROR;
				if ((Date.now() - cached.timestamp) < ttl) {
					return cached.data;
				}
			}
		}

		// Fetch PSI data
		const psiData = await fetchPSIData(url, strategy);

		// Process the PSI data
		const resultData = await processPSIData(psiData, siteName, url);
		// Cache successful results (if caching is enabled)
		if (useCache) {
			psiCache.set(cacheKey, {
				data: resultData,
				timestamp: Date.now()
			});
		}

		return resultData;
	} catch (error) {
		console.warn(`PSI API failed for ${siteName}:`, error);

		// Return error status instead of mock data
		const errorResult: CoreWebVitalsData = {
			site: siteName,
			url: url,
			metrics: {
				cls: 0,
				lcp: 0,
				fcp: 0,
				serverResponseTime: 0,
				speedIndex: 0,
				totalBlockingTime: 0,
			},
			scores: {
				performance: 0,
				accessibility: 0,
				'best-practices': 0,
				seo: 0,
				pwa: 0,
			},
			categories: {
				performance: { id: 'performance', title: 'Performance', score: null, audits: [] },
				accessibility: { id: 'accessibility', title: 'Accessibility', score: null, audits: [] },
				'best-practices': { id: 'best-practices', title: 'Best Practices', score: null, audits: [] },
				seo: { id: 'seo', title: 'SEO', score: null, audits: [] },
				pwa: { id: 'pwa', title: 'PWA', score: null, audits: [] },
			},
			timestamp: new Date().toISOString(),
			status: 'error',
			error: error instanceof Error ? error.message : 'PSI API failed',
		};

		// Cache error results with shorter TTL (5 minutes) (if caching is enabled)
		if (useCache) {
			psiCache.set(`${siteName}:${url}`, {
				data: errorResult,
				timestamp: Date.now()
			});
		}

		return errorResult;
	}
}

export async function fetchPSIData(url: string, strategy: 'mobile' | 'desktop' = 'mobile'): Promise<any> {
	// Require the PSI API key from the unified pixelated.config.json. No environment fallback.
	const apiKey = getFullPixelatedConfig()?.integrations?.googlePSI?.api_key;
	if (!apiKey) {
		throw new Error('Google PSI API key is not set; set integrations.googlePSI.api_key in pixelated.config.json');
	}

	const psiUrl = buildUrl({
		baseUrl: 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed',
		params: {
			url,
			key: apiKey,
			strategy,
			category: ['performance', 'accessibility', 'best-practices', 'seo']
		}
	});

	const fetchWithRetry = async (url: string, maxRetries = 2): Promise<any> => {
		for (let attempt = 0; attempt <= maxRetries; attempt++) {
			try {
				if (debug) console.info(`PSI request attempt=${attempt} url=${url}`);

				const start = Date.now();
				const response = await smartFetch(url, {
					responseType: 'json',
					cacheStrategy: 'next',
					nextCache: { revalidate: 3600 },
					retries: 0,
					timeout: 60000,
					requestInit: {
						headers: {
							'User-Agent': 'Mozilla/5.0 (compatible; SiteHealthMonitor/1.0)'
						}
					}
				});
				const elapsed = Date.now() - start;
				if (debug) console.info(`PSI response: url=${url} status=success elapsed_ms=${elapsed}`);
				return response;
			} catch (error) {
				if (attempt === maxRetries) {
					const errorMessage = error instanceof Error && error.name === 'AbortError'
						? 'PSI API request timed out after 60 seconds'
						: `PSI API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
					if (debug) console.error('PSI request error (final):', { url, error });
					throw new Error(errorMessage, { cause: error });
				}
				// Wait before retry (exponential backoff) - retry on both network errors and timeouts
				if (debug) console.info(`PSI retrying after failure, attempt=${attempt} url=${url}`);
				await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
			}
		}
		throw new Error('Max retries exceeded');
	};

	const psiData = await fetchWithRetry(psiUrl);

	// Check if we have valid data
	if (psiData.lighthouseResult?.audits &&
      Object.keys(psiData.lighthouseResult.audits).length > 0) {
		return psiData;
	} else {
		// PSI API returned data but no audits - likely rate limited or invalid response
		throw new Error('Invalid PSI API response or rate limited');
	}
}

export async function processPSIData(psiData: any, siteName: string, url: string): Promise<CoreWebVitalsData> {
	const audits = psiData.lighthouseResult.audits;
	const categories = psiData.lighthouseResult.categories;
	const fieldMetrics = psiData.loadingExperience?.metrics;

	// Extract metrics with proper fallbacks
	const realMetrics = {
		cls: getAuditMetricValue(audits['cumulative-layout-shift']),
		lcp: getAuditMetricValue(audits['largest-contentful-paint']),
		fcp: getAuditMetricValue(audits['first-contentful-paint']),
		serverResponseTime: getAuditMetricValue(audits['server-response-time']),
		speedIndex: getAuditMetricValue(audits['speed-index']),
		totalBlockingTime: getAuditMetricValue(audits['total-blocking-time']),
		field: fieldMetrics ? {
			cls: fieldMetrics['CUMULATIVE_LAYOUT_SHIFT_SCORE']?.percentile !== undefined
				? fieldMetrics['CUMULATIVE_LAYOUT_SHIFT_SCORE'].percentile / 100
				: undefined,
			lcp: fieldMetrics['LARGEST_CONTENTFUL_PAINT_MS']?.percentile,
			fcp: fieldMetrics['FIRST_CONTENTFUL_PAINT_MS']?.percentile,
			inp: fieldMetrics['INTERACTION_TO_NEXT_PAINT']?.percentile,
		} : undefined,
	};

	// Extract category scores
	const scores: PSIScores = {
		performance: categories?.performance?.score ?? null,
		accessibility: categories?.accessibility?.score ?? null,
		'best-practices': categories?.['best-practices']?.score ?? null,
		seo: categories?.seo?.score ?? null,
		pwa: categories?.pwa?.score ?? null,
	};

	// Extract category details with audits
	const categoryDetails = {
		performance: extractCategoryData(categories?.performance, audits),
		accessibility: extractCategoryData(categories?.accessibility, audits),
		'best-practices': extractCategoryData(categories?.['best-practices'], audits),
		seo: extractCategoryData(categories?.seo, audits),
		pwa: extractCategoryData(categories?.pwa, audits),
	};

	return {
		site: siteName,
		url: url,
		metrics: realMetrics,
		scores: scores,
		categories: categoryDetails,
		timestamp: new Date().toISOString(),
		status: 'success' as const,
	};
}

function extractCategoryData(category: any, audits: any): PSICategory {
	if (!category) {
		return { id: 'unknown', title: 'Unknown', score: null, audits: [] };
	}

	const categoryAudits: PSIAudit[] = category.auditRefs?.map((ref: PSIAuditRef) => {
		const audit = audits[ref.id];
		if (!audit) return null;

		return {
			id: audit.id,
			title: audit.title,
			description: audit.description,
			score: audit.score,
			scoreDisplayMode: audit.scoreDisplayMode,
			displayValue: audit.displayValue,
			numericValue: audit.numericValue,
			details: audit.details,
		};
	}).filter(Boolean) as PSIAudit[] || [];

	return {
		id: category.id,
		title: category.title,
		score: category.score,
		audits: categoryAudits,
	};
}