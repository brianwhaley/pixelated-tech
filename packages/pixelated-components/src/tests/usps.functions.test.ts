import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getUspsRates } from '../components/shoppingcart/usps.functions';
import { smartFetch } from '../components/foundation/smartfetch';

vi.mock('../components/foundation/smartfetch', () => ({
	smartFetch: vi.fn(),
}));

afterEach(() => {
	vi.clearAllMocks();
});

describe('getUspsRates', () => {
	it('parses USPS domestic rates returned by RateV4Response XML', async () => {
		const mockXml = `<?xml version="1.0" encoding="UTF-8"?>
<RateV4Response>
	<Package ID="1">
		<ZipOrigination>30301</ZipOrigination>
		<ZipDestination>90210</ZipDestination>
		<Zone>8</Zone>
		<Postage MAILSERVICE="Priority Mail">
			<MailService>Priority Mail</MailService>
			<Rate>14.50</Rate>
		</Postage>
		<Postage MAILSERVICE="First-Class Mail Parcel">
			<MailService>First-Class Mail Parcel</MailService>
			<Rate>5.25</Rate>
		</Postage>
	</Package>
</RateV4Response>`;

		const mockSmartFetch = vi.mocked(smartFetch, true);
		mockSmartFetch.mockResolvedValueOnce(mockXml as any);

		const rates = await getUspsRates({
			config: {},
			fromZip: '30301',
			fromCountry: 'US',
			toZip: '90210',
			toCountry: 'US',
			weightOunces: 16,
		});

		expect(rates).toHaveLength(2);
		expect(rates[0]).toMatchObject({
			serviceName: 'Priority Mail',
			rate: 14.5,
		});
		expect(rates[1]).toMatchObject({
			serviceName: 'First-Class Mail Parcel',
			rate: 5.25,
		});
	});

	it('throws when the USPS API responds with an error', async () => {
		const mockXml = `<?xml version="1.0" encoding="UTF-8"?>
<Error>
	<Number>80040B1A</Number>
	<Source>RateV4Request</Source>
	<Description>Authentication Succeeded. User Authorization Failed.</Description>
</Error>`;
		const mockSmartFetch = vi.mocked(smartFetch, true);
		mockSmartFetch.mockResolvedValueOnce(mockXml as any);

		await expect(
			getUspsRates({
				config: {},
				fromZip: '30301',
				fromCountry: 'US',
				toZip: '90210',
				toCountry: 'US',
				weightOunces: 16,
			})
		).rejects.toThrow('Authentication Succeeded. User Authorization Failed.');
	});

	it('uses sandbox URL when environment is sandbox', async () => {
		const mockXml = `<?xml version="1.0" encoding="UTF-8"?>
<RateV4Response>
	<Package ID="1">
		<ZipOrigination>30301</ZipOrigination>
		<ZipDestination>90210</ZipDestination>
		<Postage MAILSERVICE="Priority Mail">
			<MailService>Priority Mail</MailService>
			<Rate>12.00</Rate>
		</Postage>
	</Package>
</RateV4Response>`;
		const mockSmartFetch = vi.mocked(smartFetch, true);
		mockSmartFetch.mockResolvedValueOnce(mockXml as any);

		const rates = await getUspsRates({
			config: { environment: 'sandbox', sandboxBaseURL: 'https://sandbox.usps.com/ShippingAPI.dll' },
			fromZip: '30301',
			fromCountry: 'US',
			toZip: '90210',
			toCountry: 'US',
			weightOunces: 16,
		});

		expect(mockSmartFetch).toHaveBeenCalledWith(expect.stringContaining('https://sandbox.usps.com/ShippingAPI.dll'), expect.objectContaining({ responseType: 'text' }));
		expect(rates).toHaveLength(1);
		expect(rates[0]).toMatchObject({ serviceName: 'Priority Mail', rate: 12 });
	});

	it('parses international USPS rates correctly', async () => {
		const mockXml = `<?xml version="1.0" encoding="UTF-8"?>
<IntlRateV2Response>
	<Package ID="1">
		<Service ID="123">
			<SvcDescription>Priority Mail International</SvcDescription>
			<Postage>45.75</Postage>
		</Service>
	</Package>
</IntlRateV2Response>`;
		const mockSmartFetch = vi.mocked(smartFetch, true);
		mockSmartFetch.mockResolvedValueOnce(mockXml as any);

		const rates = await getUspsRates({
			config: {},
			fromZip: '30301',
			fromCountry: 'US',
			toZip: 'M5V',
			toCountry: 'CA',
			weightOunces: 32,
			packageValue: 100,
		});

		expect(rates).toHaveLength(1);
		expect(rates[0]).toMatchObject({ serviceName: 'Priority Mail International', rate: 45.75 });
	});

	it('throws when USPS response is not a string', async () => {
		const mockSmartFetch = vi.mocked(smartFetch, true);
		mockSmartFetch.mockResolvedValueOnce({} as any);

		await expect(
			getUspsRates({
				config: {},
				fromZip: '30301',
				fromCountry: 'US',
				toZip: '90210',
				toCountry: 'US',
				weightOunces: 16,
			})
		).rejects.toThrow('Invalid USPS response format.');
	});
});
