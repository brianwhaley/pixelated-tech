import { beforeEach, describe, expect, it, vi } from 'vitest';

const launch = vi.hoisted(() => vi.fn());
vi.mock('puppeteer', () => ({ default: { launch } }));

import { closePuppeteerBrowser, launchPuppeteerBrowser, openPuppeteerPage } from '../components/integrations/puppeteer.server';

describe('Puppeteer helpers', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('launches a browser with defaults and forwards explicit options', async () => {
		const browser = { newPage: vi.fn(), close: vi.fn() };
		launch.mockResolvedValue(browser);

		await expect(launchPuppeteerBrowser()).resolves.toBe(browser);
		await expect(launchPuppeteerBrowser({ headless: false, executablePath: '/browser/chrome' })).resolves.toBe(browser);

		expect(launch).toHaveBeenNthCalledWith(1, {
			headless: true,
			executablePath: undefined,
			defaultViewport: { width: 1200, height: 772 },
		});
		expect(launch).toHaveBeenNthCalledWith(2, {
			headless: false,
			executablePath: '/browser/chrome',
			defaultViewport: { width: 1200, height: 772 },
		});
	});

	it('opens a page and applies the publishing timeouts', async () => {
		const page = {
			setDefaultNavigationTimeout: vi.fn(),
			setDefaultTimeout: vi.fn(),
		};
		const browser = { newPage: vi.fn().mockResolvedValue(page) };

		await expect(openPuppeteerPage(browser as never)).resolves.toBe(page);

		expect(browser.newPage).toHaveBeenCalledOnce();
		expect(page.setDefaultNavigationTimeout).toHaveBeenCalledWith(30000);
		expect(page.setDefaultTimeout).toHaveBeenCalledWith(15000);
	});

	it('swallows browser cleanup failures', async () => {
		const browser = { close: vi.fn().mockRejectedValue(new Error('browser already closed')) };

		await expect(closePuppeteerBrowser(browser as never)).resolves.toBeUndefined();
		expect(browser.close).toHaveBeenCalledOnce();
	});
});
