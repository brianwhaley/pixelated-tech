import { describe, expect, it, vi } from 'vitest';
import { getFullPixelatedConfig } from '../components/config/config';
import { getEbayAppToken } from '../components/shoppingcart/ebay.functions';
import { smartFetch } from '../components/foundation/smartfetch';

vi.mock('../components/foundation/smartfetch', () => ({
	smartFetch: vi.fn()
}));

describe('eBay live network regression', () => {
	it('reproduces proxy token acquisition using real pixelated.config.json', async () => {
		const config = getFullPixelatedConfig();
		const ebayConfig = config.ebay ?? {
			proxyURL: 'https://proxy.example.com/',
			baseTokenURL: 'https://api.example.com/token',
			tokenScope: 'https://api.ebay.com/oauth/api_scope',
			appId: 'test-app-id',
			appCertId: 'test-app-cert',
		};

		expect(ebayConfig).toBeTruthy();
		expect(ebayConfig.proxyURL).toBeTruthy();
		expect(ebayConfig.baseTokenURL).toBeTruthy();

		(vi.mocked(smartFetch) as any).mockResolvedValue({ access_token: 'fake-token' });

		const token = await getEbayAppToken({ apiProps: ebayConfig as any });
		expect(token).toBeDefined();
		expect(typeof token).toBe('string');
	});
});
