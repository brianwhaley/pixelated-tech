import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { extractPeopleFromDocument } from '../../../../packages/pixelated-components/src/components/admin/scraper/domain-scraper.functions';
import { PERSON_FIELD_PATTERNS, PERSON_FIELD_SELECTORS } from '../../../../packages/pixelated-components/src/components/admin/scraper/person.functions';

const fixturePath = path.resolve(process.cwd(), 'src/tests/fixtures/sun-city-detail.html');
const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');

describe('Sun City saved detail fixture', () => {
	it('preserves the live DOM boundaries without assuming an extraction selector', () => {
		const dom = new JSDOM(fixtureHtml);
		try {
			expect(dom.window.document.querySelectorAll('#listingContacts')).toHaveLength(1);
			expect(dom.window.document.querySelectorAll('#listing')).toHaveLength(0);
			expect(dom.window.document.querySelectorAll('.memberBlock')).toHaveLength(0);
		} finally {
			dom.window.close();
		}
	});

	it('extracts one page record from the confirmed listing boundary', () => {
		const pageUrl = 'https://www.suncityhiltonhead.org/Member/46134~10419340';
		const dom = new JSDOM(fixtureHtml, { url: pageUrl });
		const patternSources = Object.fromEntries(
			Object.entries(PERSON_FIELD_PATTERNS).map(([field, patterns]) => [
				field,
				patterns.map((pattern) => ({ source: pattern.source, flags: pattern.flags }))
			])
		);
		const people = extractPeopleFromDocument(
			dom.window.document,
			PERSON_FIELD_SELECTORS,
			['#listingInfo'],
			patternSources,
			new URL(pageUrl).hostname
		);
		const records = people.map((person) => ({
			name: Array.isArray(person.fields.fullName) ? person.fields.fullName.join(' | ') : typeof person.fields.company === 'string' ? person.fields.company : '',
			...(person.email ? { email: person.email } : {}),
			sourceUrl: [pageUrl],
			person: person.fields
		}));
		dom.window.close();

		expect(records).toHaveLength(1);
		expect(records[0].name).toContain('Mary (Mary Ann) Sarao');
		expect(records[0].name).toContain('Brian Whaley');
		expect(records[0].person?.fullName).toEqual(['Mary (Mary Ann) Sarao', 'Brian Whaley']);
		expect(records[0].person?.company).toBeUndefined();
		expect(records[0].person?.emails).toEqual(['maryann.sarao@gmail.com', 'brian.whaley@gmail.com']);
		expect(records[0].person?.phone).toEqual(['(973) 722-2601', '(973) 710-8008', '908-930-0793', '908-930-1027']);
		expect(records[0].person?.address).toEqual([
			'4 Raymond Court\nBluffton, NJ 29909',
			'20 Homewood Drive\nMorristown, NJ 07960'
		]);
	});

	it('derives structured address fields including country from address line breaks', () => {
		const dom = new JSDOM('<div class="person"><div class="address">10 Main Street<br>Toronto, ON 12345 Canada</div></div>', { url: 'https://example.com/detail' });
		const people = extractPeopleFromDocument(dom.window.document, { address: ['.address'] }, ['.person'], {}, 'example.com');
		dom.window.close();

		expect(people[0]?.fields).toMatchObject({
			address: ['10 Main Street\nToronto, ON 12345 Canada'],
			streetAddress: '10 Main Street',
			city: 'Toronto',
			state: 'ON',
			zip: '12345',
			country: 'Canada'
		});
	});
});
