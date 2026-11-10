import { beforeEach, describe, expect, it, vi } from 'vitest';

const page = {
	goto: vi.fn(),
	url: vi.fn(() => 'https://example.com/start'),
	title: vi.fn(),
	$: vi.fn(),
	type: vi.fn(),
	click: vi.fn(),
	waitForNavigation: vi.fn(),
	waitForNetworkIdle: vi.fn(),
	evaluate: vi.fn(),
	$eval: vi.fn(),
	$$eval: vi.fn(),
	content: vi.fn(),
	waitForSelector: vi.fn(),
};
const browser = {};
const config = vi.hoisted(() => ({ current: {} as any }));
const extractState = vi.hoisted(() => ({ people: [] as Record<string, unknown>[], checkpoint: null as any }));
const launchBrowser = vi.fn(async () => browser);
const openNewPage = vi.fn(async () => page);
const closeBrowser = vi.fn(async () => undefined);

vi.mock('../../../../packages/pixelated-components/src/components/integrations/puppeteer.server', () => ({ launchPuppeteerBrowser: launchBrowser, openPuppeteerPage: openNewPage, closePuppeteerBrowser: closeBrowser }));
vi.mock('../../../../packages/pixelated-components/src/components/admin/scraper/domain-extract-writer.server', () => ({
	createDomainExtractFileName: vi.fn(() => 'test-extract.jsonl'),
	createDomainExtractFileNameFromDiscoveryFile: vi.fn((fileName: string) => fileName.replace('-discovery.jsonl', '-extract.jsonl')),
	hasDomainExtractFile: vi.fn(() => true),
	initializePeopleExtractFile: vi.fn(() => {
		extractState.people = [];
	}),
	appendPeopleToExtractFile: vi.fn((_fileName: string, people: Record<string, unknown>[]) => {
		extractState.people.push(...people);
	}),
	readPeopleFromExtractFile: vi.fn(() => extractState.people),
	readExtractedSourceUrls: vi.fn(() => new Set<string>()),
	readDomainDiscoveryCheckpoint: vi.fn(() => extractState.checkpoint),
	listDomainDiscoveryFiles: vi.fn(() => []),
	writeDomainDiscoveryCheckpoint: vi.fn((checkpoint: unknown) => {
		extractState.checkpoint = checkpoint;
	}),
}));
vi.mock('../../../../packages/pixelated-components/src/components/config/config', () => ({
	getFullPixelatedConfig: () => config.current,
}));
vi.mock('../../../../packages/pixelated-components/src/components/admin/scraper/person.functions', () => ({
	PERSON_FIELD_PATTERNS: {
		emails: [/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g],
		phone: [/(?:\+?1[\s.-]*)?(?:\(\d{3}\)|\d{3})[\s.-]*\d{3}[\s.-]*\d{4}/g],
		zip: [/\b\d{5}(?:-\d{4})?\b/g]
	},
	PERSON_FIELD_SELECTORS: {
		fullName: ['.person-name'],
		emails: ['.person-email'],
		phone: ['.person-phone'],
		firstName: [],
		lastName: [],
		id: [],
		website: [],
		webDomain: [],
		emailDomain: [],
		streetAddress: [],
		address: [],
		city: [],
		state: [],
		zip: [],
		company: [],
		category: [],
		profileUrl: [],
		sourceUrl: [],
		notes: []
	},
	normalizeEmail: (value: string) => value.trim().toLowerCase()
}));

describe('domain scraper action branches', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
		extractState.people = [];
		extractState.checkpoint = null;
		page.goto.mockResolvedValue({ status: () => 200, url: () => 'https://example.com/start', headers: () => ({}) });
		page.title.mockResolvedValue('Example');
		page.$eval.mockResolvedValue('');
		page.$$eval.mockImplementation(async (selector: string) => selector === 'a[href]' ? ['https://example.com/detail/jane'] : []);
		page.evaluate.mockResolvedValue([{ email: 'jane@example.com', fields: { fullName: 'Jane Doe', emails: ['jane@example.com'] } }]);
		page.content.mockResolvedValue('<p>Jane Doe - jane@example.com</p><a href="/start#top">same</a><a href="mailto:x@example.com">mail</a>');
		page.waitForSelector.mockResolvedValue(undefined);
		page.$.mockResolvedValue(null);
		page.waitForNavigation.mockResolvedValue(undefined);
		page.waitForNetworkIdle.mockResolvedValue(undefined);
		config.current = {
			integrations: {
				domainScraper: {
					sites: {
						example: {
							startUrl: 'https://example.com/start',
							detailUrlPattern: '^/detail/',
							detailPersonIdentifier: '.person-card'
						}
					}
				}
			}
		};
	});

	it('rejects invalid and unsupported URLs before launching a browser', async () => {
		const { scrapeDomain } = await import('../../../../packages/pixelated-components/src/components/admin/scraper/domain-scraper.server');
		const invalid = await scrapeDomain(new FormData());
		expect(invalid.error).toContain('valid http or https');
		const unsupported = new FormData();
		unsupported.set('url', 'ftp://example.com');
		expect((await scrapeDomain(unsupported)).error).toContain('valid http or https');
		expect(launchBrowser).not.toHaveBeenCalled();
	});

	it('discovers detail links before extracting one page record', async () => {
		const { scrapeDomain } = await import('../../../../packages/pixelated-components/src/components/admin/scraper/domain-scraper.server');
		const form = new FormData();
		form.set('url', 'https://example.com/start');
		form.set('maxPages', '2');
		form.set('maxDepth', '1');
		const result = await scrapeDomain(form);
		expect(result.pagesCrawled).toBe(2);
		expect(result.records).toEqual([{ name: 'Jane Doe', email: 'jane@example.com', sourceUrl: ['https://example.com/detail/jane'], person: { fullName: ['Jane Doe'], firstName: 'Jane', lastName: 'Doe', emails: ['jane@example.com'] } }]);
		expect(extractState.checkpoint.detailUrls).toEqual([]);
		expect(extractState.checkpoint.extractedDetailUrls).toEqual(['https://example.com/detail/jane']);
		expect(result.logs.some((log) => log.includes('PROGRESS:') && log.includes('started=') && log.includes('elapsed='))).toBe(true);
		expect(result.logs.some((log) => log.startsWith('JOB END:') && log.includes('ended=') && log.includes('duration='))).toBe(true);
		expect(closeBrowser).toHaveBeenCalledWith(browser);
	});

	it('uses Kendo page requests and resumes the unfinished menu page', async () => {
		config.current.integrations.domainScraper.sites.example = {
			startUrl: 'https://example.com/start',
			discoveryType: 'menu',
			menuPaginationType: 'kendo',
			detailUrlPattern: '^/Member/',
			detailPersonIdentifier: '.person-card'
		};
		extractState.people = [{ 'full name': ['Jane Doe'], emails: ['jane@example.com'], sourceUrl: ['https://example.com/Member/1~2'] }];
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
			menuPagination: { type: 'kendo', page: 2, totalPages: 2, status: 'fetching' },
			crawlPages: [],
			detailUrls: [],
			extractedDetailUrls: ['https://example.com/Member/1~2'],
			counters: { fetchAttempts: 1, pagesFetched: 1, discoveryPagesFetched: 1, pagesFailed: 0, rateLimitResponses: 0, rateLimitedPages: 0 },
			phase: 'discovery',
			updatedAt: '2026-11-06T14:32:10.000Z'
		};
		page.evaluate.mockImplementation(async (source: unknown, argument?: unknown) => {
			if (typeof source === 'function' && argument && typeof argument === 'object' && 'page' in argument) {
				return { totalPages: 2, members: [{ assnId: '1', memberId: '2' }] };
			}
			return [{ email: 'jane@example.com', fields: { fullName: 'Jane Doe', emails: ['jane@example.com'] } }];
		});
		const { scrapeDomain } = await import('../../../../packages/pixelated-components/src/components/admin/scraper/domain-scraper.server');
		const form = new FormData();
		form.set('url', 'https://example.com/start');
		form.set('recoveryMode', 'true');
		form.set('recoveryFileName', 'resume-discovery.jsonl');
		const result = await scrapeDomain(form);

		expect(result.records).toHaveLength(1);
		expect(page.evaluate).toHaveBeenCalledWith(expect.any(Function), { page: 2, pageSize: 10 });
		expect(extractState.checkpoint.menuPagination).toMatchObject({ type: 'kendo', page: 2, totalPages: 2, status: 'fetched' });
		expect(page.goto).toHaveBeenCalledTimes(0);
	});

	it('resumes interrupted discovery and skips an already extracted detail URL', async () => {
		extractState.people = [{ 'full name': ['Jane Doe'], emails: ['jane@example.com'], sourceUrl: ['https://example.com/detail/jane'] }];
		extractState.checkpoint = {
			version: 1,
			extractFileName: 'resume-extract.jsonl',
			startUrl: 'https://example.com/start',
			siteName: 'example',
			maxPages: 10,
			maxDepth: 3,
			requestDelayMs: 0,
			crawlPages: [{ url: 'https://example.com/start', depth: 0, isDetail: false, status: 'fetching' }],
			detailUrls: [],
			extractedDetailUrls: ['https://example.com/detail/jane'],
			counters: { fetchAttempts: 1, pagesFetched: 0, discoveryPagesFetched: 0, pagesFailed: 0, rateLimitResponses: 0, rateLimitedPages: 0 },
			phase: 'discovery',
			updatedAt: '2026-11-06T14:32:10.000Z'
		};
		const { scrapeDomain } = await import('../../../../packages/pixelated-components/src/components/admin/scraper/domain-scraper.server');
		const form = new FormData();
		form.set('url', 'https://example.com/start');
		form.set('recoveryMode', 'true');
		form.set('recoveryFileName', 'resume-discovery.jsonl');
		const result = await scrapeDomain(form);

		expect(result.records).toHaveLength(1);
		expect(page.goto).toHaveBeenCalledTimes(1);
		expect(page.goto).toHaveBeenCalledWith('https://example.com/start', expect.anything());
		expect(page.waitForSelector).not.toHaveBeenCalled();
		expect(extractState.checkpoint.crawlPages[0].status).toBe('fetched');
	});

	it('applies address, email, and website category rules to extracted records', async () => {
		config.current.integrations.domainScraper.sites.example.categoryRules = [
			{ category: 'Service Area', addressContains: ['Main Street'] },
			{ category: 'Personal Email', emailContains: ['gmail.com'] },
			{ category: 'Social Profile', websiteContains: ['facebook.com'] }
		];
		page.evaluate.mockResolvedValue([{ email: 'jane@gmail.com', fields: {
			fullName: 'Jane Doe',
			emails: ['jane@gmail.com'],
			address: ['10 Main Street\nToronto, ON 12345 Canada'],
			website: 'https://facebook.com/jane'
		} }]);
		const { scrapeDomain } = await import('../../../../packages/pixelated-components/src/components/admin/scraper/domain-scraper.server');
		const form = new FormData();
		form.set('url', 'https://example.com/start');
		form.set('maxPages', '2');
		form.set('maxDepth', '1');
		const result = await scrapeDomain(form);

		expect(result.records[0]?.person?.category).toEqual(['Service Area', 'Personal Email', 'Social Profile']);
	});

	it('excludes authentication exit links during discovery', async () => {
		page.$$eval.mockImplementation(async (selector: string) => selector === 'a[href]' ? [
			'https://example.com/account/logout/12345/sign-out',
			'https://example.com/signout',
			'https://example.com/signoff',
			'https://example.com/sign-off',
			'https://example.com/logout',
			'https://example.com/logoff',
			'https://example.com/log-off',
			'https://example.com/detail/jane'
		] : []);
		const { scrapeDomain } = await import('../../../../packages/pixelated-components/src/components/admin/scraper/domain-scraper.server');
		const form = new FormData();
		form.set('url', 'https://example.com/start');
		form.set('maxPages', '1');
		const result = await scrapeDomain(form);
		expect(result.records).toHaveLength(1);
		expect(page.goto.mock.calls.map(([url]) => url)).toEqual([
			'https://example.com/start',
			'https://example.com/detail/jane'
		]);
	});

	it('keeps one record when a detail page contains multiple configured containers', async () => {
		page.evaluate.mockResolvedValue([
			{ email: 'jane@example.com', fields: { fullName: 'Jane Doe', emails: ['jane@example.com'], phone: ['555-0100'] } },
			{ fields: { fullName: 'Alex Smith', phone: ['555-0200'], address: ['2 Main Street, Denver, CO 80203', '4 Side Street, Denver, CO 80204'] } }
		]);
		const { scrapeDomain } = await import('../../../../packages/pixelated-components/src/components/admin/scraper/domain-scraper.server');
		const form = new FormData();
		form.set('url', 'https://example.com/start');
		form.set('maxPages', '2');
		const result = await scrapeDomain(form);
		expect(result.records).toHaveLength(1);
		expect(result.records[0]).toMatchObject({ name: 'Jane Doe | Alex Smith', email: 'jane@example.com', sourceUrl: ['https://example.com/detail/jane'] });
		expect(result.records[0].person?.fullName).toEqual(['Jane Doe', 'Alex Smith']);
		expect(result.records[0].person?.firstName).toBe('Jane');
		expect(result.records[0].person?.lastName).toBe('Doe');
		expect(result.records[0].person?.address).toEqual(['2 Main Street, Denver, CO 80203', '4 Side Street, Denver, CO 80204']);
	});

	it('extracts the configured detail selector', async () => {
		page.$$eval.mockImplementation(async (selector: string) => {
			if (selector === 'a[href]') return ['https://example.com/detail/jane'];
			if (selector === '.person-name') return ['Jane Selector'];
			if (selector === '.person-email') return ['mailto:jane.selector@example.com'];
			if (selector === '.person-phone') return ['555-0100'];
			return [];
		});
		page.content.mockResolvedValue('<p>jane.selector@example.com</p>');
		page.evaluate.mockResolvedValue([{ email: 'jane.selector@example.com', fields: { fullName: 'Jane Selector', emails: ['jane.selector@example.com'], phone: ['555-0100'] } }]);
		const { scrapeDomain } = await import('../../../../packages/pixelated-components/src/components/admin/scraper/domain-scraper.server');
		const form = new FormData();
		form.set('url', 'https://example.com/start');
		form.set('maxPages', '2');
		const result = await scrapeDomain(form);
		expect(result.records).toEqual([{ name: 'Jane Selector', email: 'jane.selector@example.com', sourceUrl: ['https://example.com/detail/jane'], person: { fullName: ['Jane Selector'], firstName: 'Jane', lastName: 'Selector', emails: ['jane.selector@example.com'], phone: ['555-0100'] } }]);
	});

	it('parses names and member IDs before writing an extracted record', async () => {
		page.$$eval.mockImplementation(async (selector: string) => selector === 'a[href]' ? [
			'https://example.com/Member/46134~10593707',
			'https://example.com/Member/46134~10593708'
		] : []);
		page.evaluate
			.mockResolvedValueOnce([{ email: 'mary@example.com', fields: { fullName: 'Mary Anne Smith-Jones', emails: ['mary@example.com'] } }])
			.mockResolvedValueOnce([{ fields: { fullName: 'Cher', emails: ['cher@example.com'] } }]);
		config.current.integrations.domainScraper.sites.example = {
			startUrl: 'https://example.com/start',
			detailUrlPattern: '^/Member/',
			detailPersonIdentifier: '.person-card'
		};
		const { scrapeDomain } = await import('../../../../packages/pixelated-components/src/components/admin/scraper/domain-scraper.server');
		const form = new FormData();
		form.set('url', 'https://example.com/start');
		form.set('maxPages', '1');
		const result = await scrapeDomain(form);

		expect(result.records).toEqual([
			{ name: 'Cher', email: 'cher@example.com', sourceUrl: ['https://example.com/Member/46134~10593708'], person: { id: '10593708', fullName: ['Cher'], firstName: 'Cher', emails: ['cher@example.com'] } },
			{ name: 'Mary Anne Smith-Jones', email: 'mary@example.com', sourceUrl: ['https://example.com/Member/46134~10593707'], person: { id: '10593707', fullName: ['Mary Anne Smith-Jones'], firstName: 'Mary Anne', lastName: 'Smith-Jones', emails: ['mary@example.com'] } }
		]);
	});

	it('leaves a failed detail URL pending for recovery', async () => {
		page.goto
			.mockResolvedValueOnce({ status: () => 200, url: () => 'https://example.com/start', headers: () => ({}) })
			.mockResolvedValueOnce({ status: () => 500, url: () => 'https://example.com/detail/jane', headers: () => ({}) });
		const { scrapeDomain } = await import('../../../../packages/pixelated-components/src/components/admin/scraper/domain-scraper.server');
		const form = new FormData();
		form.set('url', 'https://example.com/start');
		form.set('maxPages', '1');
		const result = await scrapeDomain(form);

		expect(result.records).toHaveLength(0);
		expect(extractState.checkpoint.detailUrls).toEqual(['https://example.com/detail/jane']);
		expect(extractState.checkpoint.extractedDetailUrls).toEqual([]);
		expect(result.logs.some((log) => log.includes('EXTRACTION FAILED'))).toBe(true);
	});

	it('classifies failed HTTP responses without aborting the crawl', async () => {
		page.goto.mockResolvedValueOnce({ status: () => 404, url: () => 'https://example.com/start', headers: () => ({}) });
		page.title.mockResolvedValueOnce('Not found');
		page.$eval.mockResolvedValueOnce('missing');
		const { scrapeDomain } = await import('../../../../packages/pixelated-components/src/components/admin/scraper/domain-scraper.server');
		const form = new FormData();
		form.set('url', 'https://example.com/start');
		const result = await scrapeDomain(form);
		expect(result.pagesCrawled).toBe(0);
		expect(result.logs.some((log) => log.includes('HTTP_404'))).toBe(true);
	});

	it('stops after repeated rate limits', async () => {
		page.goto.mockResolvedValue({ status: () => 429, url: () => 'https://example.com/start', headers: () => ({ 'retry-after': '0' }) });
		const { scrapeDomain } = await import('../../../../packages/pixelated-components/src/components/admin/scraper/domain-scraper.server');
		const form = new FormData();
		form.set('url', 'https://example.com/start');
		const result = await scrapeDomain(form);
		expect(result.logs.some((log) => log.includes('RATE LIMIT: discovery stopped'))).toBe(true);
	});

	it('uses configured site defaults when form controls are blank', async () => {
		config.current = {
			integrations: {
				domainScraper: {
					sites: {
						charterOne: {
							startUrl: 'https://example.com/start',
							detailUrlPattern: '^/detail/',
							detailPersonIdentifier: '.person-card',
							maxPages: 1,
							maxDepth: 1,
							requestDelay: 0
						}
					}
				}
			}
		};
		page.content.mockResolvedValue('<p>Jane Doe - jane@example.com</p><a href="/second">second</a>');
		const { scrapeDomain } = await import('../../../../packages/pixelated-components/src/components/admin/scraper/domain-scraper.server');
		const form = new FormData();
		form.set('url', 'https://example.com/start');
		const result = await scrapeDomain(form);
		expect(result.pagesCrawled).toBe(2);
		expect(page.goto).toHaveBeenCalledTimes(2);
	});

	it('logs in with configured credentials before crawling the start URL', async () => {
		config.current = {
			integrations: {
				domainScraper: {
					sites: {
						privateDirectory: {
							startUrl: 'https://example.com/start',
							detailUrlPattern: '^/detail/',
							detailPersonIdentifier: '.person-card',
							login: {
								url: 'https://example.com/login',
								username: 'user@example.com',
								password: 'secret'
							}
						}
					}
				}
			}
		};
		page.$.mockImplementation(async (selector: string) => selector.includes('password') || selector.includes('email') || selector.includes('submit') ? {} : null);
		page.url.mockReturnValue('https://example.com/start');
		const { scrapeDomain } = await import('../../../../packages/pixelated-components/src/components/admin/scraper/domain-scraper.server');
		const form = new FormData();
		form.set('url', 'https://example.com/start');
		form.set('maxPages', '1');
		const result = await scrapeDomain(form);
		expect(result.error).toBeUndefined();
		expect(page.type).toHaveBeenCalledWith('input[type="email"]', 'user@example.com');
		expect(page.type).toHaveBeenCalledWith('input[type="password"]', 'secret');
		expect(result.logs.some((log) => log.includes('LOGIN COMPLETE'))).toBe(true);
	});

	it('opens a configured login button before filling credentials', async () => {
		config.current = {
			integrations: {
				domainScraper: {
					sites: {
						privateDirectory: {
							startUrl: 'https://example.com/start',
							detailUrlPattern: '^/detail/',
							detailPersonIdentifier: '.person-card',
							login: {
								url: 'https://login.example.com',
								username: 'user@example.com',
								password: 'secret',
								loginButtonSelectors: ['.open-login'],
								usernameSelectors: ['#username'],
								passwordSelectors: ['#password'],
								submitSelectors: ['#submit']
							}
						}
					}
				}
			}
		};
		let loginFormVisible = false;
		page.$.mockImplementation(async (selector: string) => {
			if (selector === '.open-login') return loginFormVisible ? null : {};
			return loginFormVisible && ['#username', '#password', '#submit'].includes(selector) ? {} : null;
		});
		page.click.mockImplementation(async (selector: string) => {
			if (selector === '.open-login') loginFormVisible = true;
		});
		const { scrapeDomain } = await import('../../../../packages/pixelated-components/src/components/admin/scraper/domain-scraper.server');
		const form = new FormData();
		form.set('url', 'https://example.com/start');
		form.set('maxPages', '1');
		const result = await scrapeDomain(form);
		expect(result.error).toBeUndefined();
		expect(page.click).toHaveBeenCalledWith('.open-login');
		expect(page.type).toHaveBeenCalledWith('#username', 'user@example.com');
	});

	it('rejects a login redirect that remains on the account login path', async () => {
		config.current = {
			integrations: {
				domainScraper: {
					sites: {
						privateDirectory: {
							startUrl: 'https://example.com/start',
							detailUrlPattern: '^/detail/',
							detailPersonIdentifier: '.person-card',
							login: {
								url: 'https://example.com/login',
								username: 'user@example.com',
								password: 'secret'
							}
						}
					}
				}
			}
		};
		page.$.mockImplementation(async (selector: string) => selector.includes('password') || selector.includes('email') || selector.includes('submit') ? {} : null);
		page.url.mockReturnValue('https://example.com/account/login');
		const { scrapeDomain } = await import('../../../../packages/pixelated-components/src/components/admin/scraper/domain-scraper.server');
		const form = new FormData();
		form.set('url', 'https://example.com/start');
		const result = await scrapeDomain(form);
		expect(result.error).toBe('Login did not grant access to the configured start URL');
		expect(result.logs.some((log) => log.includes('LOGIN FAILED'))).toBe(true);
	});
});
