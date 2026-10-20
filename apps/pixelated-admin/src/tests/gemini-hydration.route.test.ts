import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFs = vi.hoisted(() => ({
	existsSync: vi.fn(),
	readFileSync: vi.fn(),
	writeFileSync: vi.fn(),
	renameSync: vi.fn(),
}));
const mockConfig = vi.hoisted(() => vi.fn());
const mockFetch = vi.hoisted(() => vi.fn());

vi.mock('fs', () => ({ default: mockFs }));
vi.mock('@pixelated-tech/components/server', () => ({
	buildUrl: vi.fn(({ baseUrl, pathSegments, params }) => `${baseUrl}/${pathSegments.join('/')}?key=${params.key}`),
	getDomain: vi.fn((value: string) => new URL(value).hostname),
	getFullPixelatedConfig: mockConfig,
	smartFetch: mockFetch,
}));

const request = (query = '') => ({ nextUrl: { searchParams: new URLSearchParams(query) } }) as never;

describe('Gemini hydration route', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		// Test fixture intentionally mirrors the config provider's secret key.
		// eslint-disable-next-line pixelated/no-hardcoded-config-keys
		mockConfig.mockReturnValue({ integrations: { googleGemini: { api_key: 'gemini-key' } } });
		mockFs.existsSync.mockReturnValue(false);
		mockFs.writeFileSync.mockImplementation(() => undefined);
		mockFs.renameSync.mockImplementation(() => undefined);
	});

	it('rejects a missing source file', async () => {
		const { GET } = await import('../app/api/scrape-gemini-hydration/route');
		const response = await GET(request('file=missing.json'));
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ error: 'File not found' });
	});

	it('rejects a missing Gemini API key', async () => {
		mockFs.existsSync.mockReturnValueOnce(true);
		mockConfig.mockReturnValue({ integrations: {} });
		const { GET } = await import('../app/api/scrape-gemini-hydration/route');
		const response = await GET(request('file=leads.json'));
		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({ error: 'Google Gemini API key not configured' });
	});

	it('hydrates a lead, merges fields, and writes the result', async () => {
		mockFs.existsSync.mockReturnValueOnce(true).mockReturnValueOnce(false);
		mockFs.readFileSync.mockReturnValue(JSON.stringify({ results: [{
			company: 'Acme',
			website: 'https://acme.example',
			emails: ['old@acme.example'],
			phone: '',
			address: 'Old address',
		}] }));
		mockFetch.mockResolvedValue({ candidates: [{ content: { parts: [{ text: '```json\n[{"index":0,"company":"Acme","website":"https://new.example, https://acme.example","emails":"new@acme.example; old@acme.example","phone":"555-1212","address":{"streetAddress":"1 Main St","city":"Town"}}]\n```' }] } }] });

		const { GET } = await import('../app/api/scrape-gemini-hydration/route');
		const response = await GET(request('file=leads.json&batchSize=1'));
		const body = await response.json();
		expect(response.status).toBe(200);
		expect(body.totalProcessed).toBe(1);
		expect(body.updatedCount).toBe(1);
		expect(body.processed[0]).toMatchObject({ company: 'Acme', phone: '555-1212', address: '1 Main St, Town' });
		expect(body.processed[0].emails).toEqual(['old@acme.example', 'new@acme.example']);
		expect(mockFs.writeFileSync).toHaveBeenCalled();
		expect(mockFs.renameSync).toHaveBeenCalled();
	});

	it('records failed Gemini batches without failing the request', async () => {
		mockFs.existsSync.mockReturnValueOnce(true).mockReturnValueOnce(false);
		mockFs.readFileSync.mockReturnValue(JSON.stringify({ leads: [{ company: 'Acme', website: '', emails: '', phone: '' }] }));
		mockFetch.mockResolvedValue({ candidates: [{ content: { parts: [{ text: 'not json' }] } }] });
		const { GET } = await import('../app/api/scrape-gemini-hydration/route');
		const response = await GET(request('file=leads.json'));
		const body = await response.json();
		expect(response.status).toBe(200);
		expect(body.failedCount).toBe(1);
		expect(body.processed[0].error).toContain('JSON');
	});

	it('reports malformed existing hydrated files', async () => {
		mockFs.existsSync.mockReturnValue(true);
		mockFs.readFileSync.mockReturnValueOnce('{bad hydrated json');
		const { GET } = await import('../app/api/scrape-gemini-hydration/route');
		const response = await GET(request('file=leads.json'));
		expect(response.status).toBe(500);
		expect(await response.json()).toMatchObject({ error: 'Failed to parse existing hydrated file' });
	});

	it('reports malformed source files and missing lead arrays', async () => {
		mockFs.existsSync.mockReturnValueOnce(true).mockReturnValueOnce(false);
		mockFs.readFileSync.mockReturnValueOnce('{bad source json');
		const { GET } = await import('../app/api/scrape-gemini-hydration/route');
		const malformed = await GET(request('file=leads.json'));
		expect(malformed.status).toBe(500);

		mockFs.existsSync.mockReturnValueOnce(true).mockReturnValueOnce(false);
		mockFs.readFileSync.mockReturnValueOnce(JSON.stringify({ other: [] }));
		const empty = await GET(request('file=leads.json'));
		expect(empty.status).toBe(400);
		expect(await empty.json()).toMatchObject({ error: 'Input JSON does not contain a leads or results array' });
	});

	it('uses the Google fallback key and accepts object lead payloads', async () => {
		// Test fixture intentionally mirrors the config provider's secret key.
		// eslint-disable-next-line pixelated/no-hardcoded-config-keys
		mockConfig.mockReturnValue({ integrations: { google: { api_key: 'fallback-key' } } });
		mockFs.existsSync.mockReturnValueOnce(true).mockReturnValueOnce(false);
		mockFs.readFileSync.mockReturnValueOnce(JSON.stringify({ leads: [{ company: 'Fallback Co', website: '', emails: [], phone: '' }] }));
		mockFetch.mockResolvedValue({ candidates: [{ content: { parts: [{ text: '{"leads":[{"index":0,"company":"Fallback Co","website":"https://fallback.example","emails":["hello@fallback.example"],"phone":"555"}]}' }] } }] });
		const { GET } = await import('../app/api/scrape-gemini-hydration/route');
		const response = await GET(request('file=leads.json&maxCalls=1'));
		expect(response.status).toBe(200);
		expect((await response.json()).updatedCount).toBe(1);
	});

	it('extracts valid JSON after prose and escaped nested values', async () => {
		mockFs.existsSync.mockReturnValueOnce(true).mockReturnValueOnce(false);
		mockFs.readFileSync.mockReturnValueOnce(JSON.stringify({ results: [{ company: 'Parser Co', website: '', emails: [], phone: '' }] }));
		mockFetch.mockResolvedValue({ candidates: [{ content: { parts: [{ text: `Here is the result: \`\`\`json
[{"index":0,"company":"Parser Co","website":"https://parser.example","emails":"parser@example.com","phone":"555-0100","address":{"streetAddress":"1 \\"Main\\" St"}}]
\`\`\`` }] } }] });
		const { GET } = await import('../app/api/scrape-gemini-hydration/route');
		const response = await GET(request('file=leads.json'));
		expect(response.status).toBe(200);
		expect((await response.json()).updatedCount).toBe(1);
	});

	it('records an empty Gemini response as a failed batch', async () => {
		mockFs.existsSync.mockReturnValueOnce(true).mockReturnValueOnce(false);
		mockFs.readFileSync.mockReturnValueOnce(JSON.stringify({ results: [{ company: 'Empty Co' }] }));
		mockFetch.mockResolvedValue({ candidates: [] });
		const { GET } = await import('../app/api/scrape-gemini-hydration/route');
		const response = await GET(request('file=leads.json'));
		expect(response.status).toBe(200);
		expect((await response.json()).failedCount).toBe(0);
	});
});
