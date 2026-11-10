import config from '../app/config/pixelated.config.json';
import { describe, expect, it } from 'vitest';

describe('configured domain scraper sites', () => {
	it('configures Engel & Volkers advisor listing and detail URLs', () => {
		const site = config.integrations.domainScraper.sites.engelvolkers;
		const detailPattern = new RegExp(site.detailUrlPattern);
		const excludedPattern = new RegExp(site.excludedUrlPatterns[0]);
		const listingPath = '/shops/hiltonheadislandbluffton/our-advisors';
		const localizedListingPath = '/en/shops/hiltonheadislandbluffton/our-advisors';
		const detailPath = '/shops/hiltonheadislandbluffton/our-advisors/ashley-guarnotta/2750b671-b4f8-472c-8840-c5fa3f7ea61e/2750b671-b4f8-472c-8840-c5fa3f7ea61e';
		const localizedDetailPath = '/en/shops/hiltonheadislandbluffton/our-advisors/tim-bakels/e0374aa6-a949-40ce-a28c-cde4c7b9cb7d/dbe4dbba-f096-4011-8cb7-7908240a4d46';
		const nestedAdvisorPath = '/en/shops/hiltonheadislandbluffton/our-advisors/team/tim-bakels';

		expect(site.startUrls).toEqual([
			'https://www.evrealestate.com/en/shops/hiltonheadislandbluffton/our-advisors?currentPage=1',
			'https://www.evrealestate.com/en/shops/hiltonheadislandbluffton/our-advisors?currentPage=2'
		]);
		expect(site.detailPersonIdentifier).toBe("[class*='styles__BioWrapper']");
		expect(detailPattern.test(detailPath)).toBe(true);
		expect(detailPattern.test(localizedDetailPath)).toBe(true);
		expect(detailPattern.test(nestedAdvisorPath)).toBe(true);
		expect(excludedPattern.test(listingPath)).toBe(false);
		expect(excludedPattern.test(localizedListingPath)).toBe(false);
		expect(excludedPattern.test(detailPath)).toBe(false);
		expect(excludedPattern.test(localizedDetailPath)).toBe(false);
		expect(excludedPattern.test(nestedAdvisorPath)).toBe(false);
		expect(excludedPattern.test('/en/shops/hiltonheadislandbluffton')).toBe(true);
		expect(excludedPattern.test('/en/listings')).toBe(true);
	});
});