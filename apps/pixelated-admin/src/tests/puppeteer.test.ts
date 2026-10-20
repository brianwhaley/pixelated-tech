import { describe, expect, it, vi } from 'vitest';

const launch = vi.hoisted(() => vi.fn());
vi.mock('puppeteer', () => ({ default: { launch } }));

describe('Puppeteer helpers', () => {
	it('launches, configures, and closes browsers', async () => {
		const page = { setDefaultNavigationTimeout: vi.fn(), setDefaultTimeout: vi.fn() };
		const browser = { newPage: vi.fn(async () => page), close: vi.fn(async () => undefined) };
		launch.mockResolvedValue(browser);
		const { launchBrowser, openNewPage, closeBrowser } = await import('../lib/puppeteer');
		expect(await launchBrowser({ headless: true })).toBe(browser);
		expect(launch).toHaveBeenCalledWith({ headless: true, defaultViewport: null });
		expect(await openNewPage(browser as never)).toBe(page);
		expect(page.setDefaultNavigationTimeout).toHaveBeenCalledWith(0);
		expect(page.setDefaultTimeout).toHaveBeenCalledWith(0);
		await closeBrowser(browser as never);
		expect(browser.close).toHaveBeenCalled();
	});

	it('uses defaults when browser options are omitted or partial', async () => {
		const browser = { newPage: vi.fn(async () => ({ setDefaultNavigationTimeout: vi.fn(), setDefaultTimeout: vi.fn() })), close: vi.fn(async () => undefined) };
		launch.mockResolvedValue(browser);
		const { launchBrowser } = await import('../lib/puppeteer');
		await launchBrowser();
		await launchBrowser({ headless: false });
		expect(launch).toHaveBeenCalledWith({ headless: false, defaultViewport: null });
	});

	it('ignores browser close failures', async () => {
		const browser = { close: vi.fn(async () => { throw new Error('closed'); }) };
		const { closeBrowser } = await import('../lib/puppeteer');
		await expect(closeBrowser(browser as never)).resolves.toBeUndefined();
	});
});
