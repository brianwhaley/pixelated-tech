import { describe, it, expect, vi, afterEach } from 'vitest';
import { getUspsRates } from '../components/shoppingcart/usps.functions';
import { smartFetch } from '../components/foundation/smartfetch';
import { pixelatedConfig, mockUspsConfig } from '../test/test-data';

vi.mock('../components/foundation/smartfetch', () => ({
	smartFetch: vi.fn(),
}));

afterEach(() => {
	vi.clearAllMocks();
});

describe('getUspsRates', () => {
	it('fetches USPS rates with OAuth2 and parses total rates from Prices API v3', async () => {
		const mockToken = pixelatedConfig.integrations?.usps?.access_token;
		const mockSmartFetch = vi.mocked(smartFetch, true);
		mockSmartFetch
			.mockResolvedValueOnce({ access_token: mockToken })
			.mockResolvedValueOnce({
				rateOptions: [
					{
						rates: [
							{
								mailClass: 'USPS_GROUND_ADVANTAGE',
								description: 'Priority Mail',
								price: 14.5,
							},
						],
					},
					{
						rates: [
							{
								mailClass: 'FIRST_CLASS_PACKAGE_SERVICE',
								description: 'First-Class Mail Parcel',
								price: 5.25,
							},
						],
					},
				],
			});

		const rates = await getUspsRates({
			config: mockUspsConfig as any,
			fromZip: '30301',
			fromCountry: 'US',
			toZip: '90210',
			toCountry: 'US',
			weightOunces: 16,
		});

		expect(mockSmartFetch).toHaveBeenCalledTimes(2);
		expect(mockSmartFetch.mock.calls[0][0]).toBe('https://apis.usps.com/oauth2/v3/token');
		expect(mockSmartFetch.mock.calls[0][1]?.requestInit?.headers).toMatchObject({
			'Accept': 'application/json',
			'Content-Type': 'application/json;charset=UTF-8',
		});
		expect(mockSmartFetch.mock.calls[0][1]?.requestInit?.body).toBe(JSON.stringify({
			grant_type: 'client_credentials',
			client_id: mockUspsConfig?.consumerKey,
			client_secret: mockUspsConfig?.consumerSecret,
		}));
		expect(mockSmartFetch.mock.calls[1][0]).toBe('https://apis.usps.com/prices/v3/total-rates/search');
		expect(mockSmartFetch.mock.calls[1][1]?.requestInit?.headers).toMatchObject({
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${mockUspsConfig?.access_token}`,
		});
		const totalRatesRequestBody = JSON.parse(String(mockSmartFetch.mock.calls[1][1]?.requestInit?.body ?? '{}'));
		expect(totalRatesRequestBody).toMatchObject({
			originZIPCode: '30301',
			destinationZIPCode: '90210',
			weight: 1,
			length: 0.1,
			width: 0.1,
			height: 0.1,
			mailClass: 'USPS_GROUND_ADVANTAGE',
			processingCategory: 'MACHINABLE',
			rateIndicator: 'SP',
			destinationEntryFacilityType: 'NONE',
			priceType: 'COMMERCIAL',
			hasNonstandardCharacteristics: false,
		});
		expect(rates).toHaveLength(2);
		expect(rates[0]).toMatchObject({ serviceName: 'First-Class Mail Parcel', rate: 5.25 });
		expect(rates[1]).toMatchObject({ serviceName: 'Priority Mail', rate: 14.5 });
	});

	it('throws when USPS Prices API returns an error payload', async () => {
		const mockToken = pixelatedConfig.integrations?.usps?.access_token;
		const mockSmartFetch = vi.mocked(smartFetch, true);
		mockSmartFetch
			.mockResolvedValueOnce({ access_token: mockToken })
			.mockResolvedValueOnce({ errors: [{ title: 'Unauthorized', detail: 'Invalid credentials' }] });

		await expect(
			getUspsRates({
				config: {
					consumerKey: pixelatedConfig.integrations?.usps?.consumerKey || '',
					consumerSecret: pixelatedConfig.integrations?.usps?.consumerSecret || '',
				},
				fromZip: '30301',
				fromCountry: 'US',
				toZip: '90210',
				toCountry: 'US',
				weightOunces: 16,
			})
		).rejects.toThrow('Invalid credentials');
	});

	it('throws when USPS consumerKey is missing', async () => {
		await expect(
			getUspsRates({
				config: {
					consumerKey: '',
					consumerSecret: pixelatedConfig.integrations?.usps?.consumerSecret || '',
				},
				fromZip: '30301',
				fromCountry: 'US',
				toZip: '90210',
				toCountry: 'US',
				weightOunces: 16,
			})
		).rejects.toThrow('USPS consumerKey is required to fetch rates.');
	});

	it('throws when USPS consumerSecret is missing', async () => {
		await expect(
			getUspsRates({
				config: {
					consumerKey: pixelatedConfig.integrations?.usps?.consumerKey || '',
					consumerSecret: '',
				},
				fromZip: '30301',
				fromCountry: 'US',
				toZip: '90210',
				toCountry: 'US',
				weightOunces: 16,
			})
		).rejects.toThrow('USPS consumerSecret is required to fetch rates.');
	});

	it('throws when origin or destination postal codes are missing', async () => {
		await expect(
			getUspsRates({
				config: { consumerKey: 'TESTUSER', consumerSecret: 'TESTSECRET' },
				fromZip: '',
				fromCountry: 'US',
				toZip: '90210',
				toCountry: 'US',
				weightOunces: 16,
			})
		).rejects.toThrow('Origin and destination postal codes are required.');
	});

	it('uses sandbox URLs when environment is sandbox', async () => {
		const mockSmartFetch = vi.mocked(smartFetch, true);
		mockSmartFetch
			.mockResolvedValueOnce({ access_token: 'TEST_USPS_TOKEN' })
			.mockResolvedValueOnce({
				totalRates: [
					{
						service: { id: 'PRIORITY_MAIL', name: 'Priority Mail' },
						summary: { totalCharge: { value: '12.00', currency: 'USD' } },
					},
				],
			});

		const rates = await getUspsRates({
			config: { consumerKey: 'TESTUSER', consumerSecret: 'TESTSECRET', environment: 'sandbox', sandboxBaseURL: 'https://apis-tem.usps.com' },
			fromZip: '30301',
			fromCountry: 'US',
			toZip: '90210',
			toCountry: 'US',
			weightOunces: 16,
		});

		expect(mockSmartFetch.mock.calls[0][0]).toBe('https://apis-tem.usps.com/oauth2/v3/token');
		expect(mockSmartFetch.mock.calls[1][0]).toBe('https://apis-tem.usps.com/prices/v3/total-rates/search');
		expect(rates).toHaveLength(1);
		expect(rates[0]).toMatchObject({ serviceName: 'Priority Mail', rate: 12 });
	});

	it('includes deliveryDays and serviceType when USPS returns them', async () => {
		const mockSmartFetch = vi.mocked(smartFetch, true);
		mockSmartFetch
			.mockResolvedValueOnce({ access_token: 'TEST_USPS_TOKEN' })
			.mockResolvedValueOnce({
				totalRates: [
					{
						service: { id: 'PRIORITY_MAIL', name: 'Priority Mail', type: 'EXPRESS' },
						summary: { totalCharge: { value: '12.00', currency: 'USD' }, deliveryDays: 3 },
					},
				],
			});

		const rates = await getUspsRates({
			config: { consumerKey: 'TESTUSER', consumerSecret: 'TESTSECRET' },
			fromZip: '30301',
			fromCountry: 'US',
			toZip: '90210',
			toCountry: 'US',
			weightOunces: 16,
		});

		expect(rates).toHaveLength(1);
		expect(rates[0]).toMatchObject({
			serviceName: 'Priority Mail',
			rate: 12,
			deliveryTime: '3 days',
			serviceType: 'EXPRESS',
		});
	});

	it('parses international USPS rates correctly', async () => {
		const mockSmartFetch = vi.mocked(smartFetch, true);
		mockSmartFetch
			.mockResolvedValueOnce({ access_token: 'TEST_USPS_TOKEN' })
			.mockResolvedValueOnce({
				totalRates: [
					{
						service: { id: 'PRI_INTL', name: 'Priority Mail International' },
						summary: { totalCharge: { value: '45.75', currency: 'USD' } },
					},
				],
			});

		const rates = await getUspsRates({
			config: { consumerKey: 'TESTUSER', consumerSecret: 'TESTSECRET' },
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

	it('throws when USPS response is invalid', async () => {
		const mockSmartFetch = vi.mocked(smartFetch, true);
		mockSmartFetch
			.mockResolvedValueOnce({ access_token: 'TEST_USPS_TOKEN' })
			.mockResolvedValueOnce({} as any);

		await expect(
			getUspsRates({
				config: { consumerKey: 'TESTUSER', consumerSecret: 'TESTSECRET' },
				fromZip: '30301',
				fromCountry: 'US',
				toZip: '90210',
				toCountry: 'US',
				weightOunces: 16,
			})
		).rejects.toThrow('Invalid USPS response format.');
	});
});
