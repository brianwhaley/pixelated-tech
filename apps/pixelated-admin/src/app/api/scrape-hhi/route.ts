import { launchBrowser, closeBrowser } from '../../../lib/puppeteer';
import { appendOrMergeResults, makeDefaultFileNameFromUrl } from '../../../lib/json-store';
import { NextRequest, NextResponse } from 'next/server';

async function requestHandler(req: NextRequest): Promise<NextResponse> {
	const url = 'https://www.hiltonheadchamber.org/membership/member-directory/';
	const outFileName = req.nextUrl.searchParams.get('file') || makeDefaultFileNameFromUrl(url);
	// ensure output exists (writes an empty results object if absent)
	appendOrMergeResults(outFileName, []);

	const browser = await launchBrowser({ headless: false });
	const page = await browser.newPage();
	const businesses = [];
	let pagenumber = 1;
	try {
		await page.goto(url, { waitUntil: 'networkidle2' });
		let isNext = true;
		await page.waitForSelector('#onetrust-accept-btn-handler');
		await page.click('#onetrust-accept-btn-handler');
		while (isNext) {
			console.log('Scraping page ' + pagenumber);
			await page.waitForSelector('[data-page="' + pagenumber + '"]');
			const pageData = await page.$$eval('[data-page="' + pagenumber + '"] .c-card__member', members =>
				members.map(member => {
					const company = member.querySelector('.c-card__member-title a')?.textContent?.trim();
					const phone = member.querySelector('.c-card__member-links a.phone-link')?.getAttribute('href') || null;
					const website = member.querySelector('.c-card__member-links a.website-link')?.getAttribute('href') || null;
					const newmember = { company, phone, website };
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
			}			await new Promise(r => setTimeout(r, 2000));
			const nextButton = await page.$('.c-members__search-load-more');
			const nextButtonInactive = await page.$('.c-members__search-load-more.in-active');
			if (nextButton && !nextButtonInactive) {
				pagenumber++;
				await Promise.all([
					nextButton.click(),
					page.waitForSelector('[data-page="' + pagenumber + '"]'),
					// page.waitForNavigation({ waitUntil: 'networkidle2' })
					await new Promise(r => setTimeout(r, 2000))
				]);
			} else {
				isNext = false;
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
