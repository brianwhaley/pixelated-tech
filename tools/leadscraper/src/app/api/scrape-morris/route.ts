import { launchBrowser, closeBrowser } from '../../../lib/puppeteer';
import { appendOrMergeResults, makeDefaultFileNameFromUrl } from '../../../lib/json-store';
import { NextRequest, NextResponse } from 'next/server';

async function requestHandler(req: NextRequest): Promise<NextResponse> {
	const url = 'https://web.morrischamber.org/allcategories';
	const outFileName = req.nextUrl.searchParams.get('file') || makeDefaultFileNameFromUrl(url);
	appendOrMergeResults(outFileName, []);
	const browser = await launchBrowser({ headless: false });
	const page = await browser.newPage();
	const businesses = [];
	try {
		await page.goto(url, { waitUntil: 'networkidle2' });
		await page.waitForSelector('.ListingCategories_AllCategories_CONTAINER');
		const categoryMaps = await page.evaluate(() => {
			const anchors = document.querySelectorAll('.ListingCategories_AllCategories_CONTAINER ul li a');
			return Array.from(anchors).map((anchor: Element) => { 
				const href = (anchor as HTMLAnchorElement).getAttribute('href');
				return { href };
			});
		});
		for (const { href } of categoryMaps) {
			await page.goto("https://web.morrischamber.org" + href, { waitUntil: 'networkidle2' });
			// tabbertab even gets the tabs that are hidden with style tabbertabhide
			const pageData = await page.$$eval('.tabbertab .ListingResults_All_CONTAINER', members =>
				members.map(member => {
					const category = new URL(window.location.href).pathname.split('/')[1].replace(/-/g, ' ');
					const companyname = member.querySelector('.ListingResults_All_ENTRYTITLELEFTBOX a')?.textContent?.trim();
					const membername = member.querySelector('.ListingResults_Level5_MAINCONTACT a')?.textContent?.trim();
					const streetaddress = member.querySelector('[itemprop="street-address"]')?.textContent?.trim();
					const locality = member.querySelector('[itemprop="locality"]')?.textContent?.trim();
					const region = member.querySelector('[itemprop="region"]')?.textContent?.trim();
					const postalcode = member.querySelector('[itemprop="postal-code"]')?.textContent?.trim();
					const phone = member.querySelector('.ListingResults_Level5_PHONE1')?.textContent?.trim();
					const website = member.querySelector('.ListingResults_Level5_VISITSITE a')?.getAttribute('href') || null;
					const newmember = { category, companyname, membername, streetaddress, locality, region, postalcode, phone, website };
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
		await browser.close();
		return NextResponse.json({ businesses });
	} catch (err) {
		console.error(err);
		await closeBrowser(browser);
		return NextResponse.json({ error: 'Scraping failed' });
	}
}

export { requestHandler as GET };
