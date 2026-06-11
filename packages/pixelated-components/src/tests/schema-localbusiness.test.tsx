import { describe, it, expect } from 'vitest';
import { render } from '../test/test-utils';
import type { SiteInfo } from '@/components/config/config.types';
import { LocalBusinessSchema } from '@/components/foundation/schema';
import configData from '../test/test-data';

const siteInfo: SiteInfo = configData.siteInfoFull as SiteInfo;

const renderSchema = (siteMeta: SiteInfo = siteInfo) => {
	return render(<LocalBusinessSchema />, { config: { siteInfo: siteMeta } });
};

const getSchema = (container: Element | null) => {
	const script = container?.querySelector('script[type="application/ld+json"]');
	return script ? JSON.parse(script.textContent || '{}') : null;
};

describe('LocalBusinessSchema', () => {
	it('outputs LocalBusiness JSON-LD script with schema.org context', () => {
		const { container } = renderSchema();
		const schema = getSchema(container);
		expect(schema).toBeTruthy();
		expect(schema['@context']).toBe('https://schema.org');
		expect(schema['@type']).toBe('LocalBusiness');
	});

	it('falls back to siteInfo values from config', () => {
		const { container } = renderSchema();
		const schema = getSchema(container);
		expect(schema.telephone).toBe(siteInfo.telephone);
		expect(schema.name).toBe(siteInfo.name);
	});

	it('renders address from siteInfo', () => {
		const { container } = renderSchema();
		const schema = getSchema(container);
		const normalize = (s: any) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
		const expectedCountry = normalize(siteInfo.address?.addressCountry);
		const actualCountry = normalize(schema.address.addressCountry);
		const allowed = [expectedCountry, 'us', 'unitedstates'].filter(Boolean);
		expect(allowed).toContain(actualCountry);
		expect(schema.address.addressRegion).toBe(siteInfo.address?.addressRegion);
	});

	it('uses the siteInfo image as logo', () => {
		const { container } = renderSchema();
		const schema = getSchema(container);
		expect(schema.logo).toBe(siteInfo.image);
	});

	it('includes priceRange and social links supplied by siteInfo', () => {
		const { container } = renderSchema();
		const schema = getSchema(container);
		expect(schema.priceRange).toBe(siteInfo.priceRange);
		expect(schema.sameAs).toEqual(siteInfo.sameAs);
	});

	it('uses siteInfo openingHours from config', () => {
		const openingHours = [
			{ day: 'Mon', open: '09:00', close: '17:00' },
			{ day: 'Tue', open: '09:00', close: '17:00' },
		];
		const siteMeta = { ...siteInfo, openingHours };
		const { container } = renderSchema(siteMeta as any);
		const schema = getSchema(container);
		expect(schema.openingHours).toEqual(['Mon 09:00-17:00', 'Tue 09:00-17:00']);
	});

	it('renders description from config siteInfo', () => {
		const { container } = renderSchema();
		const schema = getSchema(container);
		expect(schema.description).toBe(siteInfo.description);
	});
});
