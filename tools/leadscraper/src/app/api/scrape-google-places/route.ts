import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { getFullPixelatedConfig, smartFetch, buildUrl } from '@pixelated-tech/components/server';

import { locations } from '../../data/locations';
import { categories } from '../../data/business-categories';

// eslint-disable-next-line pixelated/no-debug-true
const debug = true;

// --- CONFIGURATION ---
const PIXELATED_CONFIG = getFullPixelatedConfig();
const API_KEY = PIXELATED_CONFIG?.google?.api_key ?? '';

const queries: string[] = categories.flatMap((category) =>
	locations.map((location) => `${category} near ${location}`)
);

const REPORTS_DIR = path.join(process.cwd(), 'public', 'reports');
const REPORT_FILE_NAME = `google-places-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
const REPORT_FILE_PATH = path.join(REPORTS_DIR, REPORT_FILE_NAME);

function ensureReportsDir() {
	if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

function writeJsonSafe(filePath: string, data: any) {
	const tmp = `${filePath}.tmp`;
	fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
	fs.renameSync(tmp, filePath);
}

function appendQueryResultToReport(query: string, places: any[], leads: any[], pagesFetched: number) {
	ensureReportsDir();
	let report: any;
	try {
		const raw = fs.readFileSync(REPORT_FILE_PATH, 'utf8');
		report = JSON.parse(raw);
		if (!Array.isArray(report.queries)) report.queries = [];
		if (!Array.isArray(report.places)) report.places = [];
		if (!Array.isArray(report.leads)) report.leads = [];
	} catch {
		report = {
			api: 'google-places',
			runAt: new Date().toISOString(),
			fileName: REPORT_FILE_NAME,
			queries: [],
			places: [],
			leads: []
		};
	}

	report.queries.push({
		query,
		pagesFetched,
		placesCount: places.length,
		leadsCount: leads.length,
		createdAt: new Date().toISOString()
	});

	report.places.push(...places);
	report.leads.push(...leads);
	writeJsonSafe(REPORT_FILE_PATH, report);
}

type Lead = {
	id?: string;
	name?: string;
	phone?: string;
	address?: string;
	website?: string;
	leadType?: string;
};

export async function GET(_req: NextRequest) {
	// const { searchParams } = new URL(req.url);
	// const query = searchParams.get('q') ?? 'epoxy flooring companies in New Jersey';

	if (!API_KEY) {
		return NextResponse.json({ error: 'Missing Google API key', message: 'No Google API key found. Add google.api_key to pixelated.config.json or set GOOGLE_MAPS_API_KEY env var.' }, { status: 500 });
	}

	try {
		// 1. Text Search to get IDs (support pagination to fetch more than one page)
		// const limitParam = Number(searchParams.get('limit') ?? '100');
		const pageSize = 20; // max results per page requested from API
		const maxPages = 10; // safety cap to avoid infinite pagination
		let queryCount = 0;
		let totalPlaces = 0;
		let totalLeads = 0;

		for (const query of queries) {
			queryCount++;
			if (debug) console.debug('DEBUG: Starting query ' + queryCount + ' :', query);
			let pageToken: string | undefined = undefined;
			let consecutiveEmptyPages = 0;
			let pagesFetched = 0;
			const queryPlaces: any[] = [];

			for (let page = 0; page < maxPages; page++) {
				pagesFetched++;
				const queryParams: Record<string, any> = { key: API_KEY };
				if (pageToken) {
					queryParams.pageToken = pageToken;
				}

				const url: string = buildUrl({
					baseUrl: 'https://places.googleapis.com',
					pathSegments: ['v1', 'places:searchText'],
					params: queryParams
				});

				const bodyObj: any = { textQuery: query };
				// include pageSize if provided (the API may or may not honor it)
				if (pageSize > 0) bodyObj.pageSize = pageSize;

				const searchResponse = await smartFetch(url, {
					responseType: 'ok',
					requestInit: {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'X-Goog-FieldMask': 'places(id,displayName,formattedAddress,websiteUri,nationalPhoneNumber,primaryType,rating,userRatingCount),nextPageToken'
						},
						body: JSON.stringify(bodyObj)
					}
				});

				if (!searchResponse.ok) {
					const text = await searchResponse.text();
					console.error('ERROR: Text search failed', searchResponse.status, text, 'url', url, 'body', bodyObj);
					return NextResponse.json({ error: 'Text search failed', details: text }, { status: searchResponse.status });
				}

				const searchData = await searchResponse.json();
				// if (debug) console.debug('DEBUG: search page', page, 'status', searchResponse.status, 'body:', JSON.stringify(searchData));
				const pagePlaces = (Array.isArray(searchData.places) ? searchData.places : []).map((p: any) => p.place ?? p).filter(Boolean);
				if (debug) console.debug('DEBUG: search page', page, 'status', searchResponse.status, 'found places:', pagePlaces.length);

				if (pagePlaces.length === 0) {
					consecutiveEmptyPages++;
				} else {
					consecutiveEmptyPages = 0;
				}

				queryPlaces.push(...pagePlaces);

				pageToken = searchData.nextPageToken ?? searchData.next_page_token ?? searchData.next_page ?? undefined;
				if (!pageToken) {
					if (debug) console.debug('DEBUG: no next page token, ending pagination for query', queryCount);
					break;
				}

				if (consecutiveEmptyPages >= 2) {
					if (debug) console.debug('DEBUG: two empty pages in a row, ending pagination for query', queryCount);
					break;
				}

				if (debug) console.debug('DEBUG: found next page token', pageToken);
				await new Promise((r) => setTimeout(r, 400));
			}

			const leads = await Promise.all(
				queryPlaces.map(async (place: any) => {
					const data = place;
					const website = data.websiteUri ?? '';
					const hasNoWebsite = !website;
					const isSocialOnly = !!website && (website.includes('facebook.com') || website.includes('instagram.com') || website.includes('yelp.com'));
					if (hasNoWebsite || isSocialOnly) {
						const name = typeof data.displayName === 'string' ? data.displayName : data.displayName?.text ?? data.name ?? '';
						return {
							id: data.id ?? '',
							name: name,
							phone: data.nationalPhoneNumber ?? 'N/A',
							address: data.formattedAddress ?? '',
							website: website || '',
							leadType: hasNoWebsite ? 'No Website' : 'Social Media Only',
							category: data.primaryType ?? '',
							rating: data.rating ? String(data.rating) : '',
							'rating count': data.userRatingCount ? String(data.userRatingCount) : ''
						} as Lead;
					}
					return null;
				})
			);
			const filteredLeads = leads.filter(Boolean) as Lead[];
			totalPlaces += queryPlaces.length;
			totalLeads += filteredLeads.length;
			appendQueryResultToReport(query, queryPlaces, filteredLeads, pagesFetched);
			if (debug) console.debug('DEBUG: finished query', queryCount, 'places', queryPlaces.length, 'leads', filteredLeads.length, 'pagesFetched', pagesFetched);
		}

		if (debug) console.debug('DEBUG: total completed queries', queryCount, 'totalPlaces', totalPlaces, 'totalLeads', totalLeads, 'report', REPORT_FILE_NAME);
		return NextResponse.json({
			count: totalLeads,
			queryCount,
			totalPlaces,
			totalLeads,
			reportFile: REPORT_FILE_NAME,
			reportUrl: `/reports/${REPORT_FILE_NAME}`
		});
	} catch (err: unknown) {
		console.error('Fetch Error:', err);
		return NextResponse.json({ error: 'Failed to fetch leads', message: err instanceof Error ? err.message : String(err) }, { status: 500 });
	}
}
