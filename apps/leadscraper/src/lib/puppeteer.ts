import puppeteer, { Browser, Page } from 'puppeteer';

export async function launchBrowser(opts?: { headless?: boolean; defaultViewport?: any; }): Promise<Browser> {
	const { headless = false, defaultViewport = null } = opts || {};
	return await puppeteer.launch({ headless, defaultViewport });
}

export async function openNewPage(browser: Browser): Promise<Page> {
	const page = await browser.newPage();
	await page.setDefaultNavigationTimeout(0);
	await page.setDefaultTimeout(0);
	return page;
}

export async function closeBrowser(browser: Browser) {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	try { await browser.close(); } catch (_e) { /* ignore */ }
}
