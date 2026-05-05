import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../components/config/config', () => ({
	getFullPixelatedConfig: vi.fn(),
}));

vi.mock('../components/shoppingcart/usps.functions', () => ({
	getUspsRates: vi.fn(),
}));

describe('fetchUspsRatesServer', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it('throws when USPS config is missing on the server', async () => {
		const { getFullPixelatedConfig } = await import('../components/config/config');
		vi.mocked(getFullPixelatedConfig).mockReturnValue({} as any);

		const { fetchUspsRatesServer } = await import('../components/shoppingcart/usps.server');

		await expect(fetchUspsRatesServer({
			fromZip: '30301',
			fromCountry: 'US',
			toZip: '90210',
			toCountry: 'US',
			weightOunces: 16,
		})).rejects.toThrow('USPS configuration is required on the server.');
	});

	it('forwards config and parameters to getUspsRates', async () => {
		const uspsConfig = { consumerKey: 'KEY', consumerSecret: 'SECRET' };
		const { getFullPixelatedConfig } = await import('../components/config/config');
		const { getUspsRates } = await import('../components/shoppingcart/usps.functions');
		vi.mocked(getFullPixelatedConfig).mockReturnValue({ usps: uspsConfig } as any);
		vi.mocked(getUspsRates).mockResolvedValueOnce([{ rateId: 'PRIORITY-0', serviceId: 'PRIORITY', serviceName: 'Priority Mail', rate: 14.99 }]);

		const { fetchUspsRatesServer } = await import('../components/shoppingcart/usps.server');
		const rates = await fetchUspsRatesServer({
			fromZip: '30301',
			fromCountry: 'US',
			toZip: '90210',
			toCountry: 'US',
			weightOunces: 16,
		});

		expect(rates).toEqual([{ rateId: 'PRIORITY-0', serviceId: 'PRIORITY', serviceName: 'Priority Mail', rate: 14.99 }]);
		expect(getUspsRates).toHaveBeenCalledWith({
			config: uspsConfig,
			fromZip: '30301',
			fromCountry: 'US',
			toZip: '90210',
			toCountry: 'US',
			weightOunces: 16,
		});
	});
});