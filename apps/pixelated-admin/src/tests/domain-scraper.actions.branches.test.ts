import { beforeEach, describe, expect, it, vi } from 'vitest';

const page = {
	goto: vi.fn(),
	url: vi.fn(() => 'https://example.com/start'),
	title: vi.fn(),
	$eval: vi.fn(),
	content: vi.fn(),
	waitForSelector: vi.fn(),
};
const browser = {};
const launchBrowser = vi.fn(async () => browser);
const openNewPage = vi.fn(async () => page);
const closeBrowser = vi.fn(async () => undefined);

vi.mock('@/lib/puppeteer', () => ({ launchBrowser, openNewPage, closeBrowser }));

describe('domain scraper action branches', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
		page.goto.mockResolvedValue({ status: () => 200, url: () => 'https://example.com/start', headers: () => ({}) });
		page.title.mockResolvedValue('Example');
		page.$eval.mockResolvedValue('');
		page.content.mockResolvedValue('<p>Jane Doe - jane@example.com</p><a href="/start#top">same</a><a href="mailto:x@example.com">mail</a>');
		page.waitForSelector.mockResolvedValue(undefined);
	});

	it('rejects invalid and unsupported URLs before launching a browser', async () => {
		const { scrapeDomain } = await import('@/app/(pages)/domain-scraper/actions.server');
		const invalid = await scrapeDomain(new FormData());
		expect(invalid.error).toContain('valid http or https');
		const unsupported = new FormData();
		unsupported.set('url', 'ftp://example.com');
		expect((await scrapeDomain(unsupported)).error).toContain('valid http or https');
		expect(launchBrowser).not.toHaveBeenCalled();
	});

	it('scrapes visible and mailto emails, deduplicates links, and respects limits', async () => {
		const { scrapeDomain } = await import('@/app/(pages)/domain-scraper/actions.server');
		const form = new FormData();
		form.set('url', 'https://example.com/start');
		form.set('maxPages', '1');
		form.set('maxDepth', '1');
		const result = await scrapeDomain(form);
		expect(result.pagesCrawled).toBe(1);
		expect(result.records).toEqual([{ name: 'Jane Doe', email: 'jane@example.com', sourceUrl: 'https://example.com/start' }, { name: '', email: 'x@example.com', sourceUrl: 'https://example.com/start' }]);
		expect(closeBrowser).toHaveBeenCalledWith(browser);
	});

	it('classifies failed HTTP responses without aborting the crawl', async () => {
		page.goto.mockResolvedValueOnce({ status: () => 404, url: () => 'https://example.com/start', headers: () => ({}) });
		page.title.mockResolvedValueOnce('Not found');
		page.$eval.mockResolvedValueOnce('missing');
		const { scrapeDomain } = await import('@/app/(pages)/domain-scraper/actions.server');
		const form = new FormData();
		form.set('url', 'https://example.com/start');
		const result = await scrapeDomain(form);
		expect(result.pagesCrawled).toBe(1);
		expect(result.logs.some((log) => log.includes('HTTP_404'))).toBe(true);
	});

	it('stops after repeated rate limits', async () => {
		page.goto.mockResolvedValue({ status: () => 429, url: () => 'https://example.com/start', headers: () => ({ 'retry-after': '0' }) });
		const { scrapeDomain } = await import('@/app/(pages)/domain-scraper/actions.server');
		const form = new FormData();
		form.set('url', 'https://example.com/start');
		const result = await scrapeDomain(form);
		expect(result.logs.some((log) => log.includes('RATE_LIMIT_STOP'))).toBe(true);
	});
});
