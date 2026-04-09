import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { readCompaniesFromJson, extractEmailsFromResults } from '../../../lib/extract-functions';
import { upsertCompanyToFile, makeDefaultFileNameFromUrl } from '../../../lib/json-store';
import { launchBrowser, closeBrowser } from '../../../lib/puppeteer';
import { searchMainColumnHtml } from '../../../lib/google-ai-search';
async function requestHandler(req: NextRequest): Promise<NextResponse | undefined> {
	// let page = parseInt(req.nextUrl.searchParams.get('page') || '1');
	let page = 1;
	const perPage = parseInt(req.nextUrl.searchParams.get('perPage') || '100');
	const fileName = req.nextUrl.searchParams.get('file') || 'test-companies-nj-coc.json';
	const addl_query = req.nextUrl.searchParams.get('query') || " new jersey contact email address";

	// determine output filename for upserts (if the route's fileName is not a JSON file, generate a new json file name)
	const outFileName = (fileName && fileName.endsWith('.json')) ? fileName : makeDefaultFileNameFromUrl("https://www.google.com");

	const filePath = path.join(process.cwd(), 'public', fileName);
	console.log('Looking for companies file at:', filePath);
	if (!fs.existsSync(filePath)) {
		console.error(`Companies file not found: ${filePath}`);
		return NextResponse.json({ error: 'Companies file not found', filePath }, { status: 400 });
	}
	const companies = readCompaniesFromJson(filePath);
	const companyPages = Math.ceil(companies.length / perPage);
	console.log(`Total companies: ${companies.length}, Total pages: ${companyPages}`);
	const results = [];

	try {
		for (let i = 1; i <= companyPages; i++ ) {
			const browser = await launchBrowser({ headless: false, defaultViewport: null });
			// await new Promise(r => setTimeout(r, 10000));
			for (let k = (((page - 1) * perPage)); k < (page * perPage); k++ ) {
				if (k >= companies.length) break;


				// await puppetPage.setDefaultNavigationTimeout(60000); // Set timeout to 60 seconds
				// await puppetPage.setDefaultTimeout(60000); // Set default timeout to 60 seconds

				const company = companies[k];
				console.log(`Searching for emails for #${k}: ${company}`);
				const query = company + ' ' + addl_query;
				// navigation delegated to search helper (searchMainColumnHtml)
				// keyboard input delegated to search helper

				// waiting for search results delegated to search helper

				/* 
				https://www.google.com/search?
				udm=50
				&sei=B7x_acjGDaaFw8cPxqe2WQ
				&q=360+Smart+Irrigation%2C+Sprinkler+System+company+nj+email+address
				&mstk=AUtExfCv_SWB2pFqD7neWsbEDZnvUMyZZEMyugbHEXVsWsxFZZB1NjKOnl5_q6fO82yzep95ufidYXYfLqkmPhfQU-N6dNvFc4_aATSq9LOn85ZB_6SlXllKPVe7AIZ5hiRpzzwl7HpEYTBlPtJpSvcfoYxquILR5e98ulQ
				&csuir=1
				*/

				console.log(`Loaded search results for ${company}, extracting emails...`);

				let emailsHTML = '';
				try {
					emailsHTML = await searchMainColumnHtml(browser, query);
				} catch (err) {
					console.log(`Failed to read main-col HTML for ${company}:`, err);
				}
				
				console.log(`Extracted HTML for ${company}:`, emailsHTML ? emailsHTML.substring(0, 200) : '(no html)'); // Log first 200 characters
				
				const emailData = extractEmailsFromResults(emailsHTML);
				for (const email of emailData) {
					results.push({
						company: company,
						email: email
					});
				}

				// upsert to file with emails (fills only missing fields)
				try {
					const res = upsertCompanyToFile(outFileName, { company, emails: emailData });
					console.log('Upsert result:', res);
				} catch (e) {
					console.error('Failed to upsert company to file:', e);
				}

	
			}
			await closeBrowser(browser);
			page++;
		}
		return NextResponse.json({ results: results }, { status: 200 });
		// return NextResponse.json({ companies });
	} catch (err) {
		// await puppetPage.close();
		console.error(err);
		return NextResponse.json({ error: 'Scraping failed' }, { status: 500 });
	} finally {
		// await browser.close();
	}
}

export { requestHandler as GET };
