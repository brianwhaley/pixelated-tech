import fs from 'fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockBrowser = { close: vi.fn() };
const mockCloseBrowser = vi.fn(async () => undefined);
const mockPage = {
	setDefaultNavigationTimeout: vi.fn(),
	setDefaultTimeout: vi.fn(),
	goto: vi.fn(),
	url: vi.fn(() => 'https://example.com/team'),
	content: vi.fn(),
	waitForSelector: vi.fn(async () => undefined),
	title: vi.fn(async () => 'Example'),
	$eval: vi.fn(async () => 'error body'),
};

vi.mock('../lib/puppeteer', () => ({
	launchBrowser: vi.fn(async () => mockBrowser),
	openNewPage: vi.fn(async () => mockPage),
	closeBrowser: mockCloseBrowser,
}));

describe('lead scraper data helpers', () => {
	it('normalizes and validates company records', async () => {
		const { Company, normalizeEmail, splitEmails, normalizeFlag } = await import('../app/company/Company');

		expect(normalizeEmail(' =JOHN%40EXAMPLE.COM ')).toBe('john@example.com');
		expect(splitEmails('a@example.com; b@example.com\na@example.com')).toEqual(['a@example.com', 'b@example.com', 'a@example.com']);
		expect(normalizeFlag('yes')).toBe(true);
		expect(normalizeFlag('no')).toBe(false);
		expect(normalizeFlag('unknown')).toBe(false);
		expect(normalizeFlag(true)).toBe(true);
		expect(normalizeFlag(null)).toBe(false);
		expect(splitEmails(['A@example.com', ''])).toEqual(['a@example.com']);
		expect(Company.validate({})).toEqual({ valid: false, errors: { company: ['required'] } });
		expect(Company.validate({ company: 4, emails: ['not-an-email'], customer: 'maybe' }).valid).toBe(false);
		expect(Company.validate({ company: 'Valid', emails: [], website: 4, customer: 'true', partner: '1', 'first group': 'x', 'different domains': 'no' }).valid).toBe(false);

		const company = Company.from({
			company: ' Example ',
			emails: 'A@EXAMPLE.COM, a@example.com',
			website: [' https://example.com ', ''],
			customer: 'yes',
			partner: '0',
			'first group': false,
			'different domains': 'yes',
		});
		expect(company.toJSON()).toMatchObject({ company: 'Example', emails: ['a@example.com'], website: ['https://example.com'], customer: true, partner: false });
		company.normalizeInPlace();
		expect(company.toJSON().company).toBe('Example');
	});

	it('reads company files and extracts result links', async () => {
		const { readCompaniesFromTxt, readCompaniesFromJson, extractWebsiteFromResults, extractEmailsFromResults } = await import('../lib/extract-functions');
		const existsSpy = vi.spyOn(fs, 'existsSync').mockReturnValue(true);
		const readSpy = vi.spyOn(fs, 'readFileSync');
		readSpy.mockReturnValueOnce(' One \n\nTwo ' as never);
		expect(readCompaniesFromTxt('/tmp/companies.txt')).toEqual(['One', 'Two']);
		readSpy.mockReturnValueOnce(JSON.stringify(['A', { company: 'B' }]) as never);
		expect(readCompaniesFromJson('/tmp/companies.json')).toEqual(['A', 'B']);
		readSpy.mockReturnValueOnce(JSON.stringify({ results: [{ company: 'C' }], companies: ['D'] }) as never);
		expect(readCompaniesFromJson('/tmp/companies.json')).toEqual(['C']);
		readSpy.mockReturnValueOnce(JSON.stringify({ companies: ['D', '', 4] }) as never);
		expect(readCompaniesFromJson('/tmp/companies.json')).toEqual(['D', '4']);
		readSpy.mockReturnValueOnce(JSON.stringify({ nested: { company: 'E' }, values: ['F', { company: 'G' }], label: 'H' }) as never);
		expect(readCompaniesFromJson('/tmp/companies.json')).toEqual(['E', 'F', 'G', 'H']);
		readSpy.mockReturnValueOnce('{bad json' as never);
		expect(readCompaniesFromJson('/tmp/companies.json')).toEqual([]);
		expect(extractWebsiteFromResults('<a href="/url?q=https%3A%2F%2Fexample.com%2Fhome%26x=1">x</a>')).toBe('https://example.com/home&x=1');
		expect(extractWebsiteFromResults('<a href="https://direct.example">x</a>')).toBe('https://direct.example');
		expect(extractWebsiteFromResults('<a href="/url?q=%E0%A4%A">bad</a> https://fallback.example')).toBe('https://fallback.example');
		expect(extractWebsiteFromResults('Visit https://fallback.example/path ')).toBe('https://fallback.example/path');
		expect(extractWebsiteFromResults('')).toBeNull();
		expect(extractEmailsFromResults('A@EXAMPLE.COM and a@example.com B@test.org')).toEqual(['a@example.com', 'b@test.org']);
		expect(extractEmailsFromResults('')).toEqual([]);
		expect(existsSpy).toHaveBeenCalled();
		expect(readCompaniesFromJson('/tmp/no.json')).toEqual([]);
		existsSpy.mockRestore();
		readSpy.mockRestore();
	});

	it('upserts and merges company JSON records', async () => {
		const { upsertCompanyToFile, appendOrMergeResults, makeDefaultFileNameFromUrl } = await import('../lib/json-store');
		const root = '/tmp/pixelated-leads-test.json';
		vi.spyOn(fs, 'readFileSync').mockImplementation((filePath) => {
			if (String(filePath) === root) return JSON.stringify({ results: [{ company: 'Acme', phone: '123' }] }) as never;
			throw new Error('missing');
		});
		vi.spyOn(fs, 'existsSync').mockReturnValue(true);
		vi.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined);
		vi.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined);
		vi.spyOn(fs, 'renameSync').mockImplementation(() => undefined);
		expect(makeDefaultFileNameFromUrl('bad url')).toMatch(/^scrape-.*\.json$/);
		expect(upsertCompanyToFile(root, { company: 'Acme', website: 'https://acme.test' })).toMatchObject({ created: false, updated: true, file: root });
		expect(appendOrMergeResults(root, [{ company: 'New Co', emails: 'new@example.com' }, { company: 'Acme', address: 'Main St' }])).toMatchObject({ added: 1, updated: 1 });
	});
});

describe('domain scraper', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockPage.goto.mockResolvedValue({ status: () => 200, url: () => 'https://example.com/team', headers: () => ({}) });
		mockPage.content.mockResolvedValue('<a href="/team">Team</a><p>Jane Doe jane@example.com</p><a href="mailto:other@example.com">mail</a>');
	});

	it('rejects invalid URLs', async () => {
		const { scrapeDomain } = await import('../app/(pages)/domain-scraper/actions.server');
		const form = new FormData();
		form.set('url', 'ftp://example.com');
		expect(await scrapeDomain(form)).toMatchObject({ pagesCrawled: 0, error: 'Enter a valid http or https URL.' });
	});

	it('crawls same-host pages and records unique emails', async () => {
		const { scrapeDomain } = await import('../app/(pages)/domain-scraper/actions.server');
		const form = new FormData();
		form.set('url', 'https://example.com/team#top');
		form.set('maxPages', '1');
		const result = await scrapeDomain(form);
		expect(result.startUrl).toBe('https://example.com/team');
		expect(result.pagesCrawled).toBe(1);
		expect(result.records.map(({ email }) => email)).toEqual(['jane@example.com', 'other@example.com']);
		expect(mockCloseBrowser).toHaveBeenCalled();
	});

	it('logs failed browser responses without aborting the result', async () => {
		const { scrapeDomain } = await import('../app/(pages)/domain-scraper/actions.server');
		mockPage.goto.mockResolvedValue({ status: () => 503, url: () => 'https://example.com/team', headers: () => ({}) });
		const form = new FormData();
		form.set('url', 'https://example.com/team');
		const result = await scrapeDomain(form);
		expect(result.pagesCrawled).toBe(1);
		expect(result.records).toEqual([]);
		expect(result.logs.some((log) => log.includes('HTTP_5XX'))).toBe(true);
	});

	it('applies depth limits and ignores external links', async () => {
		const { scrapeDomain } = await import('../app/(pages)/domain-scraper/actions.server');
		mockPage.content.mockResolvedValue('<a href="/team/member">member</a><a href="https://other.example/team">external</a><a href="mailto:skip@example.com">mail</a>');
		const form = new FormData();
		form.set('url', 'https://example.com/team');
		form.set('maxDepth', '1');
		form.set('maxPages', '2');
		const result = await scrapeDomain(form);
		expect(result.pagesCrawled).toBe(2);
		expect(result.logs.some((log) => log.includes('queued 1 allowed link'))).toBe(true);
	});

	it('classifies HTTP 404 failures with evidence', async () => {
		const { scrapeDomain } = await import('../app/(pages)/domain-scraper/actions.server');
		mockPage.goto.mockResolvedValue({ status: () => 404, url: () => 'https://example.com/team', headers: () => ({}) });
		const form = new FormData();
		form.set('url', 'https://example.com/team');
		const result = await scrapeDomain(form);
		expect(result.logs.some((log) => log.includes('HTTP_404'))).toBe(true);
	});

	it('retries rate limits and records duplicate links', async () => {
		const { scrapeDomain } = await import('../app/(pages)/domain-scraper/actions.server');
		mockPage.goto
			.mockResolvedValueOnce({ status: () => 429, url: () => 'https://example.com/team', headers: () => ({ 'retry-after': '0' }) })
			.mockResolvedValueOnce({ status: () => 200, url: () => 'https://example.com/team', headers: () => ({}) });
		mockPage.content.mockResolvedValue('<p>jane@example.com - Jane Doe</p><a href="/team">same</a><a href="/team">duplicate</a>');
		const form = new FormData();
		form.set('url', 'https://example.com/team');
		const result = await scrapeDomain(form);
		expect(result.records[0]).toMatchObject({ name: 'Jane Doe', email: 'jane@example.com' });
		expect(result.logs.some((log) => log.includes('returned 429'))).toBe(true);
		expect(result.logs.some((log) => log.includes('duplicateLinks=1'))).toBe(true);
	});
});
