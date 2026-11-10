"use server";

import puppeteer, { type Browser, type Page } from 'puppeteer';

export type PuppeteerBrowserOptions = {
	headless?: boolean;
	executablePath?: string;
	defaultViewport?: { width: number; height: number } | null;
	timeout?: number;
};

export type PuppeteerPageOptions = {
	bringToFront?: boolean;
	navigationTimeout?: number;
	timeout?: number;
};

export async function launchPuppeteerBrowser(options: PuppeteerBrowserOptions = {}): Promise<Browser> {
	return puppeteer.launch({
		headless: options.headless ?? true,
		executablePath: options.executablePath,
		defaultViewport: options.defaultViewport === undefined ? { width: 1200, height: 772 } : options.defaultViewport,
		timeout: options.timeout,
	});
}

export async function openPuppeteerPage(browser: Browser, options: PuppeteerPageOptions = {}): Promise<Page> {
	const page = await browser.newPage();
	if (options.bringToFront) await page.bringToFront();
	page.setDefaultNavigationTimeout(options.navigationTimeout ?? 30000);
	page.setDefaultTimeout(options.timeout ?? 15000);
	return page;
}

export async function closePuppeteerBrowser(browser: Browser): Promise<void> {
	try {
		await browser.close();
	} catch {
		// Browser cleanup must not replace the original publishing error.
	}
}
