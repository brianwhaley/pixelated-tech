import { describe, expect, it, vi } from 'vitest';

const launch = vi.hoisted(() => vi.fn());
vi.mock('puppeteer', () => ({ default: { launch } }));
vi.mock('@pixelated-tech/components/server', async () => {
	const actual = await vi.importActual<typeof import('@pixelated-tech/components/server')>('@pixelated-tech/components/server');
	return actual;
});

describe('Puppeteer helpers', () => {
	it('launches, configures, and closes browsers', async () => {
		const page = { bringToFront: vi.fn(), setDefaultNavigationTimeout: vi.fn(), setDefaultTimeout: vi.fn() };
		const browser = { newPage: vi.fn(async () => page), close: vi.fn(async () => undefined) };
		launch.mockResolvedValue(browser);
		const { launchPuppeteerBrowser, openPuppeteerPage, closePuppeteerBrowser } = await import('@pixelated-tech/components/server');
		expect(await launchPuppeteerBrowser({ headless: true, defaultViewport: null })).toBe(browser);
		expect(launch).toHaveBeenCalledWith({ headless: true, executablePath: undefined, defaultViewport: null });
		expect(await openPuppeteerPage(browser as never, { bringToFront: true, navigationTimeout: 0, timeout: 0 })).toBe(page);
		expect(page.setDefaultNavigationTimeout).toHaveBeenCalledWith(0);
		expect(page.setDefaultTimeout).toHaveBeenCalledWith(0);
		await closePuppeteerBrowser(browser as never);
		expect(browser.close).toHaveBeenCalled();
	});

	it('uses defaults when browser options are omitted or partial', async () => {
		const browser = { newPage: vi.fn(async () => ({ setDefaultNavigationTimeout: vi.fn(), setDefaultTimeout: vi.fn() })), close: vi.fn(async () => undefined) };
		launch.mockResolvedValue(browser);
		const { launchPuppeteerBrowser } = await import('@pixelated-tech/components/server');
		await launchPuppeteerBrowser();
		await launchPuppeteerBrowser({ headless: false });
		expect(launch).toHaveBeenCalledWith({ headless: false, executablePath: undefined, defaultViewport: { width: 1200, height: 772 } });
	});

	it('ignores browser close failures', async () => {
		const browser = { close: vi.fn(async () => { throw new Error('closed'); }) };
		const { closePuppeteerBrowser } = await import('@pixelated-tech/components/server');
		await expect(closePuppeteerBrowser(browser as never)).resolves.toBeUndefined();
	});
});
