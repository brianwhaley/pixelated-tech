import { NextResponse } from 'next/server';
import { loadSitesConfig } from '@pixelated-tech/components/server';
import { discoverComponentsFromLibrary, analyzeComponentUsage } from '@pixelated-tech/components/adminserver';

const CACHE_TTL_MS = 5 * 60 * 1000; // cache results for 5 minutes
let cachedComponentUsage: { timestamp: number; result: any } | null = null;

// Get all components from the library (dynamic discovery)
async function getComponents() {
	return await discoverComponentsFromLibrary();
}

export async function GET() {
	try {
		if (cachedComponentUsage && Date.now() - cachedComponentUsage.timestamp < CACHE_TTL_MS) {
			return NextResponse.json(cachedComponentUsage.result);
		}

		const components = await getComponents();
		const sites = await loadSitesConfig();
		const siteList = sites.map(site => ({ name: site.name, localPath: site.localPath }));

		const result = await analyzeComponentUsage(components, siteList);
		cachedComponentUsage = { timestamp: Date.now(), result };

		return NextResponse.json(result);
	} catch (error) {
		console.error('Error in component-usage API:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}