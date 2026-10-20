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
vi.mock('../lib/puppeteer', () => ({
	launchBrowser: mockLaunch,
	closeBrowser: mockClose,
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

describe('directory scraper routes', () => {
	const page = {
		goto: vi.fn(),
		waitForSelector: vi.fn(),
		click: vi.fn(),
		$$eval: vi.fn(),
		evaluate: vi.fn(),
		$: vi.fn(),
		$$: vi.fn(),
		url: vi.fn(() => 'https://njccdirectory.com/index.php/category/all'),
	};
	const browser = { newPage: vi.fn(async () => page), close: vi.fn() };

	beforeEach(() => {
		vi.resetAllMocks();
		mockAppend.mockReturnValue({ added: 1, updated: 0 });
		mockLaunch.mockResolvedValue(browser);
		page.goto.mockResolvedValue(undefined);
		page.waitForSelector.mockResolvedValue(undefined);
		page.click.mockResolvedValue(undefined);
		page.$.mockResolvedValue(null);
		page.$$.mockResolvedValue([]);
		page.evaluate.mockResolvedValue([]);
		page.$$eval.mockResolvedValue([]);
	});

	it('scrapes an HHI page and stops when no next page exists', async () => {
		const member = { querySelector: vi.fn((selector: string) => ({ textContent: selector.includes('title') ? 'Acme' : selector.includes('phone') ? '555-1212' : undefined, getAttribute: () => selector.includes('website') ? 'https://acme.example' : null })) };
		page.$$eval.mockImplementation(async (_selector, callback) => callback([member]));
		const { GET } = await import('../app/api/scrape-hhi/route');
		const response = await GET(request('file=hhi.json'));
		expect(response.status).toBe(200);
		expect((await response.json()).businesses).toHaveLength(1);
		expect(mockAppend).toHaveBeenCalled();
	});

	it('scrapes Morris categories with no members', async () => {
		document.body.innerHTML = '<div class="ListingCategories_AllCategories_CONTAINER"><ul><li><a href="/services">Services</a></li></ul></div>';
		window.history.pushState({}, '', '/services');
		page.evaluate.mockImplementation(async (callback) => callback());
		page.$$eval.mockImplementation(async (_selector, callback) => callback([{ querySelector: vi.fn((selector: string) => ({ textContent: selector.includes('ENTRYTITLE') ? 'Acme' : selector.includes('MAINCONTACT') ? 'Jane Doe' : selector.includes('street-address') ? '1 Main St' : selector.includes('locality') ? 'Town' : selector.includes('region') ? 'NJ' : selector.includes('postal-code') ? '07001' : selector.includes('PHONE1') ? '555-1212' : undefined, getAttribute: () => selector.includes('VISITSITE') ? 'https://acme.example' : null })) }]));
		const { GET } = await import('../app/api/scrape-morris/route');
		const response = await GET(request('file=morris.json'));
		expect(response.status).toBe(200);
		expect((await response.json()).businesses).toHaveLength(1);
	});

	it('handles Morris members with all optional fields absent', async () => {
		document.body.innerHTML = '<div class="ListingCategories_AllCategories_CONTAINER"><ul><li><a href="/services">Services</a></li></ul></div>';
		page.evaluate.mockImplementation(async (callback) => callback());
		page.$$eval.mockImplementation(async (_selector, callback) => callback([{ querySelector: vi.fn(() => undefined) }]));
		const { GET } = await import('../app/api/scrape-morris/route');
		const response = await GET(request('file=morris-sparse.json'));
		expect(response.status).toBe(200);
		expect((await response.json()).businesses[0]).toMatchObject({ website: null, address: '' });
	});

	it('scrapes NJ category pages and normalizes member fields', async () => {
		document.body.innerHTML = '<div id="index"><a href="/category">Category</a></div>';
		window.history.pushState({}, '', '/index.php/category/all');
		page.evaluate.mockImplementation(async (callback) => callback());
		page.$$.mockResolvedValue([]);
		page.$$eval.mockImplementation(async (_selector, callback) => callback([{ querySelector: vi.fn((selector: string) => ({ textContent: selector === '.header a' ? 'Acme' : selector === '.address' ? '1 Main St' : selector.includes('telephone') ? '555-1212' : undefined, getAttribute: () => selector.includes('.website') ? '/acme' : null })) }]));
		const { GET } = await import('../app/api/scrape-nj/route');
		const response = await GET(request('file=nj.json'));
		expect(response.status).toBe(200);
		expect((await response.json()).businesses[0]).toMatchObject({ company: 'Acme', address: '1 Main St', phone: '555-1212', website: 'https://njccdirectory.com/acme' });
	});

	it('fetches additional NJ pagination links and handles missing websites', async () => {
		document.body.innerHTML = '<div id="index"><a href="/category">Category</a></div>';
		page.evaluate.mockImplementation(async (callback, element) => element ? callback(element) : callback());
		page.$$.mockResolvedValue([{}]);
		page.$$eval.mockImplementation(async (_selector, callback) => callback([{ querySelector: vi.fn(() => ({ textContent: 'Acme', getAttribute: () => null })) }]));
		const { GET } = await import('../app/api/scrape-nj/route');
		const response = await GET(request('file=nj-pages.json'));
		expect(response.status).toBe(200);
		expect(page.goto).toHaveBeenCalled();
	});

	it('handles NJ members with sparse directory markup', async () => {
		document.body.innerHTML = '<div id="index"><a href="/category">Category</a></div>';
		page.evaluate.mockImplementation(async (callback) => callback());
		page.$$.mockResolvedValue([]);
		page.$$eval.mockImplementation(async (_selector, callback) => callback([{ querySelector: vi.fn(() => undefined) }]));
		const { GET } = await import('../app/api/scrape-nj/route');
		const response = await GET(request('file=nj-sparse.json'));
		expect(response.status).toBe(200);
		expect((await response.json()).businesses[0]).toMatchObject({ website: null });
	});

	it('returns a controlled error when HHI navigation fails', async () => {
		page.goto.mockRejectedValueOnce(new Error('network failure'));
		const { GET } = await import('../app/api/scrape-hhi/route');
		const response = await GET(request('file=hhi-error.json'));
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ error: 'Scraping failed' });
	});

	it('continues Morris scraping when a page write fails', async () => {
		document.body.innerHTML = '<div class="ListingCategories_AllCategories_CONTAINER"><ul><li><a href="/services">Services</a></li></ul></div>';
		window.history.pushState({}, '', '/services');
		page.evaluate.mockImplementation(async (callback) => callback());
		page.$$eval.mockImplementation(async (_selector, callback) => callback([]));
		mockAppend.mockImplementationOnce(() => ({ added: 0, updated: 0 })).mockImplementationOnce(() => { throw new Error('write failure'); });
		const { GET } = await import('../app/api/scrape-morris/route');
		const response = await GET(request('file=morris-error.json'));
		expect(response.status).toBe(200);
		expect((await response.json()).businesses).toEqual([]);
	});

	it('returns a controlled error when NJ navigation fails', async () => {
		page.goto.mockRejectedValueOnce(new Error('network failure'));
		const { GET } = await import('../app/api/scrape-nj/route');
		const response = await GET(request('file=nj-error.json'));
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ error: 'Scraping failed' });
	});
});
