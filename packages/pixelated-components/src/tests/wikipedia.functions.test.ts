import { describe, it, expect } from 'vitest';
import { STATE_MAP, formatWikipediaLocation, getWikipediaCityObject } from '../components/integrations/wikipedia.functions';

describe('Wikipedia Integration Functions', () => {
	describe('STATE_MAP', () => {
		it('should contain expected US state full names', () => {
			expect(STATE_MAP.NJ).toBe('New_Jersey');
			expect(STATE_MAP.GA).toBe('Georgia');
			expect(STATE_MAP.SC).toBe('South_Carolina');
			expect(STATE_MAP.CA).toBe('California');
			expect(STATE_MAP.NY).toBe('New_York');
		});

		it('should contain exactly 50 states', () => {
			const keys = Object.keys(STATE_MAP);
			expect(keys.length).toBe(50);
		});
	});

	describe('formatWikipediaLocation', () => {
		it('should correctly replace spaces with underscores', () => {
			const url = formatWikipediaLocation('Hilton Head Island', 'South Carolina');
			expect(url).toBe('https://en.wikipedia.org/wiki/Hilton_Head_Island,_South_Carolina');
		});

		it('should append Township for known NJ township special cases', () => {
			const townships = ['denville', 'randolph', 'montville', 'east hanover', 'hanover', 'roxbury', 'jefferson', 'rockaway'];
			for (const t of townships) {
				const urlLower = formatWikipediaLocation(t, 'New_Jersey');
				const expectedCity = t.replace(/\s+/g, '_') + '_Township';
				expect(urlLower).toBe(`https://en.wikipedia.org/wiki/${expectedCity},_New_Jersey`);

				const urlTitle = formatWikipediaLocation(t.toUpperCase(), 'New_Jersey');
				const expectedUpper = t.toUpperCase().replace(/\s+/g, '_') + '_Township';
				expect(urlTitle).toBe(`https://en.wikipedia.org/wiki/${expectedUpper},_New_Jersey`);
			}
		});

		it('should format Parsippany as Parsippany-Troy Hills', () => {
			const urlLower = formatWikipediaLocation('parsippany', 'New_Jersey');
			expect(urlLower).toBe('https://en.wikipedia.org/wiki/Parsippany-Troy_Hills,_New_Jersey');

			const urlUpper = formatWikipediaLocation('PARSIPPANY', 'New_Jersey');
			expect(urlUpper).toBe('https://en.wikipedia.org/wiki/Parsippany-Troy_Hills,_New_Jersey');
		});

		it('should preserve standard cities without modification', () => {
			const url = formatWikipediaLocation('Morristown', 'New_Jersey');
			expect(url).toBe('https://en.wikipedia.org/wiki/Morristown,_New_Jersey');
		});
	});

	describe('getWikipediaCityObject', () => {
		it('should successfully parse standard City-StateAbbr strings', () => {
			const obj1 = getWikipediaCityObject('Denville NJ');
			expect(obj1).toEqual({
				'@type': 'City',
				name: 'Denville',
				sameAs: 'https://en.wikipedia.org/wiki/Denville_Township,_New_Jersey'
			});

			const obj2 = getWikipediaCityObject('Savannah GA');
			expect(obj2).toEqual({
				'@type': 'City',
				name: 'Savannah',
				sameAs: 'https://en.wikipedia.org/wiki/Savannah,_Georgia'
			});

			const obj3 = getWikipediaCityObject('Hilton Head Island SC');
			expect(obj3).toEqual({
				'@type': 'City',
				name: 'Hilton Head Island',
				sameAs: 'https://en.wikipedia.org/wiki/Hilton_Head_Island,_South_Carolina'
			});
		});

		it('should fall back gracefully to raw name without sameAs url when no state abbreviation matches', () => {
			const obj = getWikipediaCityObject('Coastal Area');
			expect(obj).toEqual({
				'@type': 'City',
				name: 'Coastal Area'
			});
		});

	it('should generate State schema with sameAs when type is State', () => {
		const obj = getWikipediaCityObject('New Jersey', 'State');
		expect(obj).toEqual({
			'@type': 'State',
			name: 'New Jersey',
			sameAs: 'https://en.wikipedia.org/wiki/New_Jersey'
		});
	});

	it('should generate AdministrativeArea schema with sameAs for county names', () => {
		const obj = getWikipediaCityObject('Bergen County NJ', 'AdministrativeArea');
		expect(obj).toEqual({
			'@type': 'AdministrativeArea',
			name: 'Bergen County',
			sameAs: 'https://en.wikipedia.org/wiki/Bergen_County,_New_Jersey'
		});
	});

		it('should return null for null, undefined, or non-string inputs', () => {
			expect(getWikipediaCityObject(null)).toBeNull();
			expect(getWikipediaCityObject(undefined)).toBeNull();
			expect(getWikipediaCityObject(123 as any)).toBeNull();
		});

		it('should parse names with multiple consecutive spaces and trim nicely', () => {
			const obj = getWikipediaCityObject('  Morristown   NJ  ');
			expect(obj).toEqual({
				'@type': 'City',
				name: 'Morristown',
				sameAs: 'https://en.wikipedia.org/wiki/Morristown,_New_Jersey'
			});
		});
	});
});
