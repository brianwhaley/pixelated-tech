import { NextRequest, NextResponse } from 'next/server';
import { getFullPixelatedConfig, smartFetch, buildUrl } from '@pixelated-tech/components/server';

// eslint-disable-next-line pixelated/no-debug-true
const debug = true;

// --- CONFIGURATION ---
const PIXELATED_CONFIG = getFullPixelatedConfig();
const API_KEY = PIXELATED_CONFIG?.google?.api_key ?? '';
const terms = [
	'epoxy flooring companies',
	'home improvement companies',
	'landscaping companies',
	'lawn care services',
];
const locations = [
	'Denville, New Jersey',
	'New Brunswick, New Jersey',
	'Hopewell, New Jersey',
	'Point Pleasant, New Jersey',
	'Vineland, New Jersey',
	'Hilton Head Island, South Carolina',
	'Bluffton, South Carolina',
	'Charleston, South Carolina',
	'Savannah, Georgia',
];
const queries: string[] = terms.flatMap((term) =>
	locations.map((location) => `${term} near ${location}`)
);

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
		let collectedPlaces: any[] = [];

		for (const query of queries) {
			queryCount++;
			if (debug) console.debug('DEBUG: Starting query ' + queryCount + ' :', query);
			let pageToken: string | undefined = undefined;

			for (let page = 0; page < maxPages; page++) {
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
				if (debug) console.debug('DEBUG: search page', page, 'status', searchResponse.status, 'found places:', (Array.isArray(searchData.places) ? searchData.places.length : 0));

				const pagePlaces = (Array.isArray(searchData.places) ? searchData.places : []).map((p: any) => p.place ?? p).filter(Boolean);
				collectedPlaces = collectedPlaces.concat(pagePlaces);

				// Check for next page token in common naming variants
				pageToken = searchData.nextPageToken ?? searchData.next_page_token ?? searchData.next_page ?? undefined;
				if (!pageToken) break; // no more pages
				// if (debug) console.debug('DEBUG: found next page token', pageToken);
				if (debug) console.debug('DEBUG: found next page token');
				// The API may require a short delay before the next page token becomes valid; wait a bit
				await new Promise((r) => setTimeout(r, 400));
			}
		}

		// Trim to requested limit
		const places = collectedPlaces.slice(0);
		if (debug) console.debug('DEBUG: total places collected', collectedPlaces.length, 'returning', places.length);

		// 2. Map through places to check details concurrently
		const leads = await Promise.all(
			places.map(async (place: any) => {
				const data = place; // using place data directly since we requested fields in the search
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
				return null; // businesses that HAVE a website
			})
		);
		const filteredLeads = leads.filter(Boolean) as Lead[];
		return NextResponse.json({ count: filteredLeads.length, queries: queries, places: places, leads: filteredLeads });
	} catch (err: unknown) {
		console.error('Fetch Error:', err);
		return NextResponse.json({ error: 'Failed to fetch leads', message: err instanceof Error ? err.message : String(err) }, { status: 500 });
	}
}
