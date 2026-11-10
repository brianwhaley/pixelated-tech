import { describe, expect, it } from 'vitest';
import { createEmptyPerson, getPersonFieldSelectors, matchPersonFieldPatterns, Person, PersonSpec } from '../components/admin/scraper/person.functions';

describe('Person selector registry', () => {
	it('builds a fresh default value for every person schema field', () => {
		const first = createEmptyPerson();
		const second = createEmptyPerson();
		const expected = createEmptyPerson();

		expect(Object.keys(first).sort()).toEqual(Object.keys(PersonSpec).sort());
		expect(first).toEqual(expected);
		expect(second).toEqual(expected);

		(first.fullName as string[]).push('Ada Lovelace');
		(first.socials as Record<string, string>).facebook = 'https://facebook.com/ada';
		expect(second).toEqual(expected);
	});

	it('includes generic semantic and data-attribute candidates', () => {
		expect(getPersonFieldSelectors('fullName')).toContain('[data-name]');
		expect(getPersonFieldSelectors('emails')).toContain('[data-email]');
		expect(getPersonFieldSelectors('phone')).toContain('[data-phone]');
		expect(getPersonFieldSelectors('address')).toContain('[itemtype*="PostalAddress" i]');
		expect(getPersonFieldSelectors('streetAddress')).toContain('[itemprop="street-address"]');
		expect(getPersonFieldSelectors('city')).toContain('[itemprop="locality"]');
		expect(getPersonFieldSelectors('state')).toContain('[itemprop="region"]');
		expect(getPersonFieldSelectors('zip')).toContain('[itemprop="postal-code"]');
		expect(getPersonFieldSelectors('firstName')).toContain('[class*="fld-fname" i]');
		expect(getPersonFieldSelectors('lastName')).toContain('[class*="fld-lname" i]');
		expect(getPersonFieldSelectors('website')).toContain('[class*="website" i]');
		expect(getPersonFieldSelectors('streetAddress')).toContain('[class*="address-line1" i]');
	});

	it('keeps company titles separate from categories', () => {
		expect(getPersonFieldSelectors('company')).toContain('[class*="title" i]');
		expect(getPersonFieldSelectors('category')).not.toContain('[class*="title" i]');
	});

	it('normalizes platform-keyed social URLs', () => {
		expect(Person.from({ socials: { facebook: ' https://facebook.com/example ' } }).toJSON().socials).toEqual({ facebook: 'https://facebook.com/example' });
	});

	it('normalizes array fields from scalar and duplicate values', () => {
		expect(Person.from({ fullName: ['Ada Lovelace', 'Charles Babbage'], phone: '555-111-2222; 555-111-2222', category: ['Engineer', 'Engineer'] }).toJSON()).toMatchObject({ fullName: ['Ada Lovelace', 'Charles Babbage'], phone: ['555-111-2222'], category: ['Engineer'] });
	});

	it('preserves commas inside address values', () => {
		expect(Person.from({
		fullName: 'Ada Lovelace',
		address: ['4 Raymond Court, Bluffton, NJ 29909', '20 Homewood Drive, Morristown, NJ 07960']
	}).toJSON().address).toEqual(['4 Raymond Court, Bluffton, NJ 29909', '20 Homewood Drive, Morristown, NJ 07960']);
	});

	it('normalizes source URLs as an additive array', () => {
		expect(Person.from({ fullName: 'Ada Lovelace', sourceUrl: 'https://example.com/listing' }).toJSON().sourceUrl).toEqual(['https://example.com/listing']);
	});

	it('matches reusable field patterns', () => {
		expect(matchPersonFieldPatterns('emails', 'Email ada@example.com')).toEqual(['ada@example.com']);
		expect(matchPersonFieldPatterns('phone', 'Call (555) 111-2222')).toEqual(['(555) 111-2222']);
		expect(matchPersonFieldPatterns('zip', 'ZIP 12345-6789')).toEqual(['12345-6789']);
	});
});
