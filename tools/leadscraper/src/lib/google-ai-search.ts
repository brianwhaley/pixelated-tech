import { Browser } from 'puppeteer';
import { openNewPage } from './puppeteer';

/**
 * Run a Google search for `query` and return the innerHTML of [data-container-id="main-col"].
 * The helper opens and closes a single page; the browser is provided by the caller.
 */
export async function searchMainColumnHtml(browser: Browser, query: string): Promise<string> {
	const page = await openNewPage(browser);
	try {
		const url = 'https://www.google.com/search?udm=50';
		await page.goto(url, { waitUntil: 'networkidle2' });
		await page.keyboard.type(query);
		await page.keyboard.press('Enter');

		// wait for 'mstk' param to appear (same heuristic used previously)
		try {
			await page.waitForFunction((id) => {
				const url = new URL(window.location.href);
				return url.searchParams.get(id) !== null;
			}, {}, 'mstk');
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch (_err) {
			// fall back if it doesn't appear
		}

		try {
			await page.waitForSelector('[data-container-id="main-col"]', { timeout: 8000 });
			const html = await page.$eval('[data-container-id="main-col"]', (el) => (el as HTMLElement).innerHTML);
			return html || '';
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch (_err) {
			// if selector isn't found, return empty string so callers can handle
			return '';
		}
	} finally {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		try { await page.close(); } catch (_e) { /* ignore */ }
	}
}
