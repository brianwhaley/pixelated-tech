import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFs = vi.hoisted(() => ({
	existsSync: vi.fn(),
	readFileSync: vi.fn(),
	writeFileSync: vi.fn(),
	renameSync: vi.fn(),
	mkdirSync: vi.fn(),
}));
const mockSearch = vi.hoisted(() => vi.fn());
const mockExtractEmails = vi.hoisted(() => vi.fn());
const mockExtractWebsite = vi.hoisted(() => vi.fn());
const mockReadCompanies = vi.hoisted(() => vi.fn());
const mockUpsert = vi.hoisted(() => vi.fn());
const mockAppend = vi.hoisted(() => vi.fn());
const mockLaunch = vi.hoisted(() => vi.fn());
const mockClose = vi.hoisted(() => vi.fn());

vi.mock('fs', () => ({ default: mockFs }));
vi.mock('../lib/extract-functions', () => ({
	readCompaniesFromJson: mockReadCompanies,
	extractEmailsFromResults: mockExtractEmails,
	extractWebsiteFromResults: mockExtractWebsite,
}));
vi.mock('../lib/json-store', () => ({
	upsertCompanyToFile: mockUpsert,
	appendOrMergeResults: mockAppend,
	makeDefaultFileNameFromUrl: vi.fn(() => 'generated.json'),
}));
vi.mock('@pixelated-tech/components/server', () => ({
	launchPuppeteerBrowser: mockLaunch,
	closePuppeteerBrowser: mockClose,
}));
vi.mock('../lib/google-ai-search', () => ({ searchMainColumnHtml: mockSearch }));

const request = (query = '') => ({ nextUrl: { searchParams: new URLSearchParams(query) } }) as never;

describe('company search scraper routes', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mockFs.existsSync.mockReturnValue(true);
		mockReadCompanies.mockReturnValue(['Acme']);
		mockUpsert.mockReturnValue({ created: false, updated: true });
		mockLaunch.mockResolvedValue({});
		mockClose.mockResolvedValue(undefined);
	});

	it('returns a useful error when the email source file is missing', async () => {
		mockFs.existsSync.mockReturnValue(false);
		const { GET } = await import('../app/api/scrape-emails/route');
		const response = await GET(request('file=missing.txt'));
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ error: 'Companies file not found' });
	});

	it('scrapes and stores emails for each company', async () => {
		mockSearch.mockResolvedValue('<p>contact@acme.example</p>');
		mockExtractEmails.mockReturnValue(['contact@acme.example']);
		const { GET } = await import('../app/api/scrape-emails/route');
		const response = await GET(request('file=companies.json&perPage=1'));
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ results: [{ company: 'Acme', emails: ['contact@acme.example'] }] });
		expect(mockUpsert).toHaveBeenCalled();
		expect(mockClose).toHaveBeenCalled();
	});

	it('handles invalid website source JSON', async () => {
		mockReadCompanies.mockImplementation(() => { throw new Error('invalid'); });
		const { GET } = await import('../app/api/scrape-websites/route');
		const response = await GET(request('file=companies.json'));
		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: 'Invalid companies file' });
	});

	it('scrapes and stores a discovered website', async () => {
		mockExtractWebsite.mockReturnValue('https://acme.example');
		mockSearch.mockResolvedValue('<a href="https://acme.example">site</a>');
		const { GET } = await import('../app/api/scrape-websites/route');
		const response = await GET(request('file=companies.json'));
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ results: [{ company: 'Acme', website: 'https://acme.example' }] });
	});

	it('keeps companies without a discovered website and tolerates search failures', async () => {
		mockSearch.mockRejectedValue(new Error('search unavailable'));
		mockExtractWebsite.mockReturnValue(null);
		const { GET } = await import('../app/api/scrape-websites/route');
		const response = await GET(request('file=companies.json'));
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ results: [] });
	});
});

