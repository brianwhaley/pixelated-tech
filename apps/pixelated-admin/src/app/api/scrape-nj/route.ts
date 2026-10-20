import { launchBrowser, closeBrowser } from '../../../lib/puppeteer';
import { appendOrMergeResults, makeDefaultFileNameFromUrl } from '../../../lib/json-store';
import { NextRequest, NextResponse } from 'next/server';

async function requestHandler(req: NextRequest): Promise<NextResponse> {
	const url = 'https://njccdirectory.com/index.php';
	const outFileName = req.nextUrl.searchParams.get('file') || makeDefaultFileNameFromUrl(url);
	appendOrMergeResults(outFileName, []);
	const browser = await launchBrowser({ headless: false });
	const page = await browser.newPage();
	const businesses = [];
	try {
		await page.goto(url, { waitUntil: 'networkidle2' });
		await page.waitForSelector('#index');
		const categoryMaps = await page.evaluate(() => {
			const anchors = document.querySelectorAll('#index a');
			return Array.from(anchors).map((anchor: Element) => {
				const href = (anchor as HTMLAnchorElement).getAttribute('href');
				return { href };
			});
		});
		for (const { href } of categoryMaps) {
			await page.goto("https://njccdirectory.com/index.php" + href + "/all", { waitUntil: 'networkidle2' });
			// tabbertab even gets the tabs that are hidden with style tabbertabhide
			// const pages = await page.$$('.pagination a');
			const pageAnchors = await page.$$('.pagination a');
			const pages = [];
			pages.push(page.url());
			for (const anchor of pageAnchors) {
				const href = await page.evaluate(el => el.getAttribute('href'), anchor);
				pages.push(href);
			}
			for  (let i = 0; i < pages.length; i++) {
				if (pages[i] === page.url()) {
					// do nothing - use the page that has been fetched
				} else {
					// fetch the new page
					await page.goto("https://njccdirectory.com/index.php" + pages[i], { waitUntil: 'networkidle2' });
				}
				// loop through members
				// const members = await page.$$('.lsrow');
				const pageData = await page.$$eval('.lsrow', members =>
					members.map(member => {
						const category = new URL(window.location.href).pathname.split('/')[3].replace(/-/g, ' ');
						const companyname = member.querySelector('.header a')?.textContent?.trim();
						// const membername = member.querySelector('.ListingResults_Level5_MAINCONTACT a')?.textContent?.trim();
						// const streetaddress = member.querySelector('[itemprop="street-address"]')?.textContent?.trim();
						// const locality = member.querySelector('[itemprop="locality"]')?.textContent?.trim();
						// const region = member.querySelector('[itemprop="region"]')?.textContent?.trim();
						// const postalcode = member.querySelector('[itemprop="postal-code"]')?.textContent?.trim();
						const address = member.querySelector('.address')?.textContent?.trim();
						const phone = member.querySelector('.mfieldtype_coretelephone .output')?.textContent?.trim();
						const href = member.querySelector('.website a')?.getAttribute('href');
						const website = href ? `https://njccdirectory.com${href}` : null;
						const newmember = { category, company: companyname, address, phone, website };
						return newmember;
					})
				);
				businesses.push(...pageData);
				// write page results to file (append/merge)
				try {
					const res = appendOrMergeResults(outFileName, pageData);
					console.log('Wrote page results:', res);
				} catch (e) {
					console.error('Failed to write page results:', e);
				}
			}
		}
		await closeBrowser(browser);
		return NextResponse.json({ businesses });
	} catch (err) {
		console.error(err);
		await closeBrowser(browser);
		return NextResponse.json({ error: 'Scraping failed' });
	}
}

export { requestHandler as GET };
