import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import path from 'path';
import { AxeCoreData } from '@pixelated-tech/components/adminserver';
import * as integrationModule from '@pixelated-tech/components/adminserver';
import { getRuntimeEnvFromHeaders } from '@pixelated-tech/components/server';

const debug = false;

// Simple in-memory cache for axe-core results
interface CacheEntry {
  data: AxeCoreData;
  timestamp: number;
}

interface Site {
  name: string;
  localPath?: string;
  remote?: string;
  healthCheckId?: string;
  url?: string;
}

const axeCache = new Map<string, CacheEntry>();
const CACHE_TTL_SUCCESS = 60 * 60 * 1000; // 1 hour for successful results
const CACHE_TTL_ERROR = 5 * 60 * 1000; // 5 minutes for error results

// Clean up expired cache entries periodically
setInterval(() => {
	const now = Date.now();
	for (const [key, entry] of axeCache.entries()) {
		const ttl = entry.data.status === 'success' ? CACHE_TTL_SUCCESS : CACHE_TTL_ERROR;
		if (now - entry.timestamp > ttl) {
			axeCache.delete(key);
		}
	}
}, 10 * 60 * 1000); // Clean up every 10 minutes



export async function GET(request: NextRequest) {
	try {
		// Read sites configuration
		const sitesPath = path.join(process.cwd(), 'src/app/data/sites.json');
		const sitesData = await fs.promises.readFile(sitesPath, 'utf-8');
		const sites: Site[] = JSON.parse(sitesData);

		// Query params
		const { searchParams } = new URL(request.url);
		const requestedSiteName = searchParams.get('siteName');
		const cacheParam = searchParams.get('cache');
		const purgeParam = searchParams.get('purge');
		const purgeOnlyParam = searchParams.get('purgeOnly');
		const useCache = String(cacheParam).toLowerCase() !== 'false';
		const doPurge = String(purgeParam).toLowerCase() === 'true';
		const purgeOnly = String(purgeOnlyParam).toLowerCase() === 'true';

		if (debug) console.info('Axe-core request params:', { requestedSiteName, cacheParam, purgeParam, useCache, doPurge });
		if (!requestedSiteName) {
			return NextResponse.json({ success: false, error: 'siteName required' }, { status: 400 });
		}

		const sitesToProcess = sites.filter(site => site.name === requestedSiteName && site.url);
		if (debug) console.info('Axe-core route requestedSiteName=', requestedSiteName, 'sitesToProcess.length=', sitesToProcess.length);

		const results: AxeCoreData[] = [];
		let respondedFromCache = false;
		const purgedKeys: string[] = [];

		for (const site of sitesToProcess) {
			let runtime_env: 'auto' | 'local' | 'prod' = 'auto';
			const url = site.url!;
			const cacheKey = `${site.name}:${url}`;
			try {
				if (doPurge) {
					const existed = axeCache.delete(cacheKey);
					if (debug) console.info(`Axe cache purge requested for site="${site.name}", cacheKey="${cacheKey}", purge=true, existed=${existed}`);
					if (existed) purgedKeys.push(cacheKey);
					if (purgeOnly) continue;
				}

				if (useCache) {
					const cached = axeCache.get(cacheKey);
					if (cached) {
						if (debug) console.info('Axe-core cache check:', { cacheKey, cachedExists: Boolean(cached) });
						const ttl = cached.data.status === 'success' ? CACHE_TTL_SUCCESS : CACHE_TTL_ERROR;
						if ((Date.now() - cached.timestamp) < ttl) {
							respondedFromCache = true;
							results.push(cached.data);
							continue;
						}
						axeCache.delete(cacheKey);
					}
				}

				try {
					const fallbackOrigin = request.url ? new URL(request.url).origin : undefined;
					runtime_env = getRuntimeEnvFromHeaders(request.headers as any, fallbackOrigin);
					if (debug) console.info(`Axe-core route detected runtime_env=${runtime_env}`);
				} catch {
					try {
						const fb = request.url ? new URL(request.url).origin : undefined;
						if (fb && (fb.includes('localhost') || fb.includes('127.0.0.1'))) runtime_env = 'local';
						else if (fb) runtime_env = 'prod';
						else runtime_env = 'auto';
					} catch {
						runtime_env = 'auto';
					}
				}

				const result = await integrationModule.performAxeCoreAnalysis(url, runtime_env);
				result.site = site.name;
				if (useCache) axeCache.set(cacheKey, { data: result, timestamp: Date.now() });
				results.push(result);
			} catch (error) {
				if (debug) console.error(`Axe-core analysis failed for ${site.name}:`, error);
				try {
					const errorResult = await integrationModule.performAxeCoreAnalysis(site.url!, runtime_env);
					errorResult.site = site.name;
					if (useCache) axeCache.set(cacheKey, { data: errorResult, timestamp: Date.now() });
					results.push(errorResult);
				} catch {
					results.push({ site: site.name, status: 'error', data: null } as any);
				}
			}
		}

		const headers = new Headers();
		headers.set('x-axe-cache-hit', respondedFromCache ? '1' : '0');
		headers.set('x-axe-use-cache', String(useCache));
		if (purgedKeys.length) headers.set('x-axe-purged', purgedKeys.join(','));
		return NextResponse.json({ success: true, data: results }, { headers });

	} catch (error) {
		if (debug) console.error('Axe-core API error:', error);
		const errMessage = error instanceof Error ? error.message : String(error);
		return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
	}
}