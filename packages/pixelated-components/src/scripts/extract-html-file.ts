import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { extractPeopleFromDocument } from '../components/admin/scraper/domain-scraper.functions';
import {
	PERSON_FIELD_PATTERNS,
	PERSON_FIELD_SELECTORS,
	Person,
	type PersonType
} from '../components/admin/scraper/person.functions';

type PatternSource = { source: string; flags: string };

const inputPath = process.argv[2];
const outputPath = process.argv[3] ?? path.join(process.cwd(), 'sun-city-html-extract.json');
const boundarySelector = process.argv[4];

if (!inputPath || !boundarySelector) {
	console.error('Usage: npx tsx src/scripts/extract-html-file.ts <input.html> [output.json] <boundary-selector>');
	process.exitCode = 1;
} else {
	const pageUrl = 'https://www.suncityhiltonhead.org/Member/46134~10419340';
	const html = fs.readFileSync(inputPath, 'utf8');
	const dom = new JSDOM(html, { url: pageUrl });
	try {
		const patternSources: Record<string, PatternSource[]> = Object.fromEntries(
			Object.entries(PERSON_FIELD_PATTERNS).map(([field, patterns]) => [
				field,
				patterns.map((pattern) => ({ source: pattern.source, flags: pattern.flags }))
			])
		);
		const people = extractPeopleFromDocument(
			dom.window.document,
			PERSON_FIELD_SELECTORS,
			[boundarySelector],
			patternSources,
			new URL(pageUrl).hostname
		);
		const records: PersonType[] = people.map((person) => Person.from({ ...person.fields, sourceUrl: [pageUrl] }).toJSON());
		fs.writeFileSync(outputPath, JSON.stringify({ results: records }, null, 2), 'utf8');
		console.log(`Wrote ${records.length} records to ${outputPath}`);
	} finally {
		dom.window.close();
	}
}