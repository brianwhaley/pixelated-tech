import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockConfig } from '../test/test-utils';

const page = {
	goto: vi.fn(),
	url: vi.fn(() => 'https://example.com/start'),
	$: vi.fn(),
	type: vi.fn(),
	click: vi.fn(),
	waitForNavigation: vi.fn(),
	waitForNetworkIdle: vi.fn(),
	evaluate: vi.fn(),
	$$eval: vi.fn(),
	waitForSelector: vi.fn(),
	cookies: vi.fn()
};
const browser = {};
const config = vi.hoisted(() => ({ current: {} as any }));
const extractState = vi.hoisted(() => ({
	people: [] as Record<string, unknown>[],
	checkpoint: null as any,
	launchBrowser: vi.fn(),
	openNewPage: vi.fn(),
	closeBrowser: vi.fn(),
	smartFetch: vi.fn()
}));

vi.mock('../components/integrations/puppeteer.server', () => ({ launchPuppeteerBrowser: extractState.launchBrowser, openPuppeteerPage: extractState.openNewPage, closePuppeteerBrowser: extractState.closeBrowser }));
vi.mock('../components/admin/scraper/domain-extract-writer.server', () => ({
	createDomainExtractFileName: vi.fn(() => 'test-extract.jsonl'),
	createDomainExtractFileNameFromDiscoveryFile: vi.fn((fileName: string) => fileName.replace('-discovery.json', '-extract.jsonl')),
	hasDomainExtractFile: vi.fn(() => true),
	initializePeopleExtractFile: vi.fn(() => { extractState.people = []; }),
	appendPeopleToExtractFile: vi.fn((_fileName: string, people: Record<string, unknown>[]) => { extractState.people.push(...people); }),
	readPeopleFromExtractFile: vi.fn(() => extractState.people),
	readExtractedSourceUrls: vi.fn(() => new Set<string>()),
	readDomainDiscoveryCheckpoint: vi.fn(() => extractState.checkpoint),
	listDomainDiscoveryFiles: vi.fn(() => []),
	writeDomainDiscoveryCheckpoint: vi.fn((checkpoint: unknown) => { extractState.checkpoint = checkpoint; })
}));
vi.mock('../components/config/config', () => ({ getFullPixelatedConfig: () => config.current }));
vi.mock('../components/admin/scraper/person.functions', () => ({
	PERSON_FIELD_PATTERNS: {
		emails: [/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g],
		phone: [/(?:\+?1[\s.-]*)?(?:\(\d{3}\)|\d{3})[\s.-]*\d{3}[\s.-]*\d{4}/g]
	},
	PERSON_FIELD_SELECTORS: { fullName: ['.person-name'], emails: ['.person-email'], phone: ['.person-phone'] },
	normalizeEmail: (value: string) => value.trim().toLowerCase()
}));
vi.mock('../components/foundation/smartfetch', () => ({ smartFetch: extractState.smartFetch }));

import { scrapeDomain } from '../components/admin/scraper/domain-scraper.server';

const baseSite = {
	startUrls: ['https://example.com/start'],
	detailUrlPattern: '^/detail/',
	detailPersonIdentifier: '.person-card'
};

function formWithUrl(): FormData {
	const form = new FormData();
	form.set('url', 'https://example.com/start');
	return form;
}

beforeEach(() => {
	vi.clearAllMocks();
	extractState.launchBrowser.mockResolvedValue(browser);
	extractState.openNewPage.mockResolvedValue(page);
	extractState.closeBrowser.mockResolvedValue(undefined);
	extractState.smartFetch.mockResolvedValue({ Directory: { total_count: 10, member: [{ assn_id: '1', member_id: '2' }] } });
	extractState.people = [];
	extractState.checkpoint = null;
	config.current = createMockConfig({ integrations: { domainScraper: { sites: { example: { ...baseSite } } } } } as any);
	page.goto.mockResolvedValue({ status: () => 200, headers: () => ({}) });
	page.url.mockReturnValue('https://example.com/start');
	page.$.mockResolvedValue(null);
	page.waitForNavigation.mockResolvedValue(undefined);
	page.waitForNetworkIdle.mockResolvedValue(undefined);
	page.waitForSelector.mockResolvedValue(undefined);
	page.cookies.mockResolvedValue([]);
	page.$$eval.mockImplementation(async (selector: string) => selector === 'a[href]' ? ['https://example.com/detail/jane'] : []);
	page.evaluate.mockResolvedValue([{ email: 'jane@example.com', fields: { fullName: 'Jane Doe', emails: ['jane@example.com'] } }]);
});

describe('domain scraper crawl branches', () => {
	it('discovers and extracts a detail page', async () => {
		const form = formWithUrl();
		form.set('maxPages', '2');
		form.set('maxDepth', '1');

		const result = await scrapeDomain(form);

		expect(result.pagesCrawled).toBe(2);
		expect(result.records).toHaveLength(1);
		expect(result.records[0]).toMatchObject({ fullName: ['Jane Doe'], emails: ['jane@example.com'] });
		expect(result.logs.some((log) => log.includes('JOB END:'))).toBe(true);
		expect(extractState.closeBrowser).toHaveBeenCalledWith(browser);
	});

	it('merges multiple person containers and applies category rules', async () => {
		config.current.integrations.domainScraper.sites.example.categoryRules = [
			{ category: 'Service Area', addressContains: ['Main Street'] },
			{ category: 'Personal Email', emailContains: ['gmail.com'] },
			{ category: 'Social Profile', websiteContains: ['facebook.com'] }
		];
		page.evaluate.mockResolvedValue([
			{ email: 'jane@gmail.com', fields: { fullName: 'Jane Doe', emails: ['jane@gmail.com'], address: ['10 Main Street'], website: 'https://facebook.com/jane' } },
			{ fields: { fullName: 'Alex Smith', phone: ['555-0200'] } }
		]);

		const result = await scrapeDomain(formWithUrl());

		expect(result.records[0]).toMatchObject({ fullName: ['Jane Doe', 'Alex Smith'], category: ['Service Area', 'Personal Email', 'Social Profile'] });
	});

	it('leaves failed detail pages pending for recovery', async () => {
		page.goto
			.mockResolvedValueOnce({ status: () => 200, headers: () => ({}) })
			.mockResolvedValueOnce({ status: () => 500, headers: () => ({}) });

		const result = await scrapeDomain(formWithUrl());

		expect(result.records).toHaveLength(0);
		expect(result.logs.some((log) => log.includes('EXTRACTION FAILED'))).toBe(true);
	});

	it('classifies failed discovery responses', async () => {
		page.goto.mockResolvedValueOnce({ status: () => 404, headers: () => ({}) });

		const result = await scrapeDomain(formWithUrl());

		expect(result.pagesCrawled).toBe(0);
		expect(result.logs.some((log) => log.includes('HTTP_404'))).toBe(true);
	});

	it('stops after repeated rate-limit responses', async () => {
		page.goto.mockResolvedValue({ status: () => 429, headers: () => ({ 'retry-after': '0' }) });

		const result = await scrapeDomain(formWithUrl());

		expect(result.logs.some((log) => log.includes('RATE LIMIT: discovery stopped'))).toBe(true);
	});
});

describe('domain scraper menu and login branches', () => {
	it('requests Kendo pages while resuming a discovery checkpoint', async () => {
		config.current.integrations.domainScraper.sites.example = {
			...baseSite,
			discoveryType: 'menu',
			menuPaginationType: 'kendo',
			detailUrlPattern: '^/Member/'
		};
		extractState.checkpoint = {
			version: 1,
			extractFileName: 'resume-extract.jsonl',
			startUrl: 'https://example.com/start',
			siteName: 'example',
			maxPages: 10,
			maxDepth: 3,
			requestDelayMs: 0,
			discoveryType: 'menu',
			menuPaginationType: 'kendo',
			menuPagination: { type: 'kendo', page: 1, totalPages: 1, status: 'fetching' },
			crawlPages: [], detailUrls: [], extractedDetailUrls: [],
			counters: { fetchAttempts: 0, pagesFetched: 0, discoveryPagesFetched: 0, pagesFailed: 0, rateLimitResponses: 0, rateLimitedPages: 0 },
			phase: 'discovery', updatedAt: '2026-11-10T00:00:00.000Z'
		};
		page.evaluate.mockResolvedValue({ totalPages: 1, members: [{ assn_id: '1', member_id: '2' }] });
		const form = formWithUrl();
		form.set('recoveryMode', 'true');
		form.set('recoveryFileName', 'resume-discovery.json');

		const result = await scrapeDomain(form);

		expect(result).toBeDefined();
		expect(extractState.smartFetch).toHaveBeenCalledWith(
			'https://example.com/Member/SearchData',
			expect.objectContaining({ responseType: 'json' })
		);
	});

	it('logs in before crawling with configured credentials', async () => {
		config.current.integrations.domainScraper.sites.example.login = {
			url: 'https://example.com/login', username: 'user@example.com', password: 'secret'
		};
		page.$.mockImplementation(async (selector: string) => selector.includes('password') || selector.includes('email') || selector.includes('submit') ? {} : null);

		const result = await scrapeDomain(formWithUrl());

		expect(result.error).toBeUndefined();
		expect(page.type).toHaveBeenCalledWith('input[type="email"]', 'user@example.com');
		expect(result.logs.some((log) => log.includes('LOGIN COMPLETE'))).toBe(true);
	});

	it('opens a configured login button before submitting credentials', async () => {
		config.current.integrations.domainScraper.sites.example.login = {
			url: 'https://example.com/login', username: 'user@example.com', password: 'secret',
			loginButtonSelectors: ['.open-login'], usernameSelectors: ['#username'], passwordSelectors: ['#password'], submitSelectors: ['#submit']
		};
		let loginFormVisible = false;
		page.$.mockImplementation(async (selector: string) => selector === '.open-login' ? (loginFormVisible ? null : {}) : loginFormVisible && ['#username', '#password', '#submit'].includes(selector) ? {} : null);
		page.click.mockImplementation(async (selector: string) => { if (selector === '.open-login') loginFormVisible = true; });

		const result = await scrapeDomain(formWithUrl());

		expect(result.error).toBeUndefined();
		expect(page.click).toHaveBeenCalledWith('.open-login');
	});

	it('returns a login error when access redirects back to login', async () => {
		config.current.integrations.domainScraper.sites.example.login = {
			url: 'https://example.com/login', username: 'user@example.com', password: 'secret'
		};
		page.$.mockImplementation(async (selector: string) => selector.includes('password') || selector.includes('email') || selector.includes('submit') ? {} : null);
		page.url.mockReturnValue('https://example.com/account/login');

		const result = await scrapeDomain(formWithUrl());

		expect(result.error).toBe('Login did not grant access to the configured start URL');
		expect(result.logs.some((log) => log.includes('LOGIN FAILED'))).toBe(true);
	});

	it('rejects recovery mode without a selected discovery file', async () => {
		const form = formWithUrl();
		form.set('recoveryMode', 'true');

		expect((await scrapeDomain(form)).error).toBe('Select a discovery file for Recovery Mode.');
	});

	it('rejects unsupported menu pagination configuration', async () => {
		config.current.integrations.domainScraper.sites.example.discoveryType = 'menu';
		config.current.integrations.domainScraper.sites.example.menuPaginationType = 'unsupported';

		expect((await scrapeDomain(formWithUrl())).error).toBe('Menu discovery requires a supported menuPaginationType.');
	});

	it('rejects a missing detail selector', async () => {
		config.current.integrations.domainScraper.sites.example.detailPersonIdentifier = '';

		expect((await scrapeDomain(formWithUrl())).error).toBe('The configured site must have a detailPersonIdentifier.');
	});

	it('rejects an invalid detail URL pattern', async () => {
		config.current.integrations.domainScraper.sites.example.detailUrlPattern = '[';

		expect((await scrapeDomain(formWithUrl())).error).toBe('The configured site must have a valid detailUrlPattern.');
	});

});
