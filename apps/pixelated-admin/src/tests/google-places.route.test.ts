import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFs = vi.hoisted(() => ({
	existsSync: vi.fn(),
	mkdirSync: vi.fn(),
	readFileSync: vi.fn(),
	writeFileSync: vi.fn(),
	renameSync: vi.fn(),
}));
const mockConfig = vi.hoisted(() => vi.fn());
const mockFetch = vi.hoisted(() => vi.fn());

vi.mock('fs', () => ({ default: mockFs }));
vi.mock('@pixelated-tech/components/server', () => ({
	buildUrl: vi.fn(({ baseUrl, pathSegments }) => `${baseUrl}/${pathSegments.join('/')}`),
	getFullPixelatedConfig: mockConfig,
	smartFetch: mockFetch,
}));
vi.mock('../app/data/locations', () => ({ locations: ['Town'] }));
vi.mock('../app/data/business-categories', () => ({ categories: ['plumber'] }));

const request = {} as never;

describe('Google Places scraper route', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.resetAllMocks();
		// Test fixture intentionally mirrors the config provider's secret key.
		// eslint-disable-next-line pixelated/no-hardcoded-config-keys
		mockConfig.mockReturnValue({ integrations: { google: { api_key: 'places-key' } } });
		mockFs.existsSync.mockReturnValue(false);
		mockFs.writeFileSync.mockImplementation(() => undefined);
		mockFs.renameSync.mockImplementation(() => undefined);
	});

	it('returns a configuration error when no API key exists', async () => {
		mockConfig.mockReturnValue({ integrations: {} });
		const { GET } = await import('../app/api/scrape-google-places/route');
		const response = await GET(request);
		expect(response.status).toBe(500);
		expect(await response.json()).toMatchObject({ error: 'Missing Google API key' });
	});

	it('returns upstream text search failures', async () => {
		mockFetch.mockResolvedValue({ ok: false, status: 429, text: vi.fn(async () => 'rate limited') });
		const { GET } = await import('../app/api/scrape-google-places/route');
		const response = await GET(request);
		expect(response.status).toBe(429);
		expect(await response.json()).toEqual({ error: 'Text search failed', details: 'rate limited' });
	});

	it('collects no-website leads and writes a report', async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			json: vi.fn(async () => ({
				places: [{ id: 'p1', displayName: { text: 'Acme Plumbing' }, formattedAddress: '1 Main St', nationalPhoneNumber: '555-1212', primaryType: 'plumber', rating: 4.5, userRatingCount: 12 }]
			})),
		});
		const { GET } = await import('../app/api/scrape-google-places/route');
		const response = await GET(request);
		const body = await response.json();
		expect(response.status).toBe(200);
		expect(body).toMatchObject({ count: 1, queryCount: 1, totalPlaces: 1, totalLeads: 1 });
		expect(mockFs.writeFileSync).toHaveBeenCalled();
		expect(mockFs.renameSync).toHaveBeenCalled();
	});

	it('handles pagination and filters social-only websites', async () => {
		mockFetch
			.mockResolvedValueOnce({ ok: true, json: vi.fn(async () => ({ places: [
				{ id: 'social', displayName: 'Social Co', websiteUri: 'https://facebook.com/social' },
				{ id: 'normal', displayName: { text: 'Normal Co' }, websiteUri: 'https://normal.example' },
			], nextPageToken: 'next' })) })
			.mockResolvedValueOnce({ ok: true, json: vi.fn(async () => ({ places: [] })) });
		const { GET } = await import('../app/api/scrape-google-places/route');
		const response = await GET(request);
		const body = await response.json();
		expect(response.status).toBe(200);
		expect(body).toMatchObject({ totalPlaces: 2, totalLeads: 1, count: 1 });
		expect(mockFetch).toHaveBeenCalledTimes(2);
	});

	it('returns a controlled error when Places fetch throws', async () => {
		mockFetch.mockRejectedValue(new Error('service unavailable'));
		const { GET } = await import('../app/api/scrape-google-places/route');
		const response = await GET(request);
		expect(response.status).toBe(500);
		expect(await response.json()).toMatchObject({ error: 'Failed to fetch leads', message: 'service unavailable' });
	});

	it('normalizes sparse Places records and empty result payloads', async () => {
		mockFetch.mockResolvedValue({ ok: true, json: vi.fn(async () => ({ places: [{ id: 'sparse' }] })) });
		const { GET } = await import('../app/api/scrape-google-places/route');
		const sparseResponse = await GET(request);
		expect(sparseResponse.status).toBe(200);
		expect((await sparseResponse.json()).totalPlaces).toBe(1);

		mockFetch.mockResolvedValue({ ok: true, json: vi.fn(async () => ({ places: null })) });
		const emptyResponse = await GET(request);
		expect(emptyResponse.status).toBe(200);
		expect((await emptyResponse.json()).totalPlaces).toBe(0);
	});
});
