"use server";

import puppeteer, { type Browser, type Page } from 'puppeteer';

export async function launchPuppeteerBrowser(options: { headless?: boolean; executablePath?: string } = {}): Promise<Browser> {
	return puppeteer.launch({
		headless: options.headless ?? true,
		executablePath: options.executablePath,
		defaultViewport: null,
	});
}

export async function openPuppeteerPage(browser: Browser): Promise<Page> {
	const page = await browser.newPage();
	page.setDefaultNavigationTimeout(30000);
	page.setDefaultTimeout(15000);
	return page;
}

export async function closePuppeteerBrowser(browser: Browser): Promise<void> {
	try {
		await browser.close();
	} catch {
		// Browser cleanup must not replace the original publishing error.
	}
}
