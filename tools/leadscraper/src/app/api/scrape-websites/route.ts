import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { readCompaniesFromJson, extractWebsiteFromResults } from '../../../lib/extract-functions';
import { upsertCompanyToFile, makeDefaultFileNameFromUrl } from '../../../lib/json-store';
import { launchBrowser, closeBrowser } from '../../../lib/puppeteer';
import { searchMainColumnHtml } from '../../../lib/google-ai-search';
// eslint-disable-next-line pixelated/no-debug-true
const debug = true;

async function requestHandler(req: NextRequest): Promise<NextResponse | undefined> {
	let page = parseInt(req.nextUrl.searchParams.get('page') || '1');
	const perPage = parseInt(req.nextUrl.searchParams.get('perPage') || '100');
	// allow caller to specify a JSON file in /public, default to this example name
	const fileName = req.nextUrl.searchParams.get('file') || 'companies-nj-coc.json';
	const addl_query = /* req.nextUrl.searchParams.get('query') || */ ' new jersey full website url';

	// determine output filename for upserts (use json if provided, else generate from scrape url)
	const outFileName = (fileName && fileName.endsWith('.json')) ? fileName : makeDefaultFileNameFromUrl("https://www.google.com");

	const filePath = path.join(process.cwd(), 'public', 'data', fileName);
	console.log('Looking for companies file at:', filePath);
	if (!fs.existsSync(filePath)) {
		console.error(`Companies file not found: ${filePath}`);
		return NextResponse.json({ error: 'Companies file not found', filePath }, { status: 400 });
	}

	// parse companies using shared helper
	let companies: string[];
	try {
		companies = readCompaniesFromJson(filePath);
	} catch (err) {
		console.error(`Error reading companies from ${filePath}:`, err);
		return NextResponse.json({ error: 'Invalid companies file' }, { status: 400 });
	}

	if (debug) console.log('Parsed companies sample:', companies.slice(0, 5));

	const companyPages = Math.ceil(companies.length / perPage);
	if (debug) console.log(`Total companies: ${companies.length}, Total pages: ${companyPages}`);
	const results: Array<{ company: string; website: string | null; }> = [];

	try {
		for (let i = 1; i <= companyPages; i++ ) {
			const browser = await launchBrowser({ headless: false, defaultViewport: null });
			for (let k = (((page - 1) * perPage)); k < (page * perPage); k++ ) {
				if (k >= companies.length) break;

				const company = companies[k];
				console.log(`Searching for website for #${k}: ${company}`);
				const query = company + ' ' + addl_query;

				let mainHtml = '';
				try {
					mainHtml = await searchMainColumnHtml(browser, query);
				} catch (err) {
					if (debug) console.log(`Error searching for ${company}:`, err);
				}

				const website: string | null = extractWebsiteFromResults(mainHtml);

				if (website) {
					if (debug) console.log(`Found website for ${company}: ${website}`);
					results.push({ company, website });
					// upsert to file (fills only missing fields)
					try {
						const res = upsertCompanyToFile(outFileName, { company, website });
						if (debug) console.log('Upsert result:', res);
					} catch (e) {
						console.error('Failed to upsert company to file:', e);
					}
				}
			}
			await closeBrowser(browser);
			page++;
		}
		return NextResponse.json({ results: results }, { status: 200 });
	} catch (err) {
		console.error(err);
		return NextResponse.json({ error: 'Scraping failed' }, { status: 500 });
	} finally {
		// cleanup
	}
}

export { requestHandler as GET };