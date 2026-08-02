import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as crypto from '../components/config/crypto';

const importConfig = async () => await import('../components/config/config');

vi.mock('../components/config/crypto', async (importOriginal) => {
	const actual = await importOriginal<any>();
	return {
		__esModule: true,
		...actual,
		isEncrypted: vi.fn(),
		decrypt: vi.fn()
	};
});

async function importConfigWithFs(content: string, exists = true) {
	vi.doMock('fs', () => ({
		default: {
			existsSync: vi.fn(() => exists),
			readFileSync: vi.fn(() => content)
		},
		existsSync: vi.fn(() => exists),
		readFileSync: vi.fn(() => content)
	}));
	return await importConfig();
}

describe('config.ts', () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.resetModules();
		process.env = { ...originalEnv };
		vi.resetAllMocks();
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	describe('getFullPixelatedConfig', () => {
		it('should return empty object if no config file found', async () => {
			const configModule = await importConfigWithFs('', false);
			const { getFullPixelatedConfig } = await importConfig();
			const config = getFullPixelatedConfig();
			expect(config).toEqual({});
		});

		it('should load plaintext config if found', async () => {
			await importConfigWithFs(JSON.stringify({ siteInfo: { name: 'Test' } }));
			const { getFullPixelatedConfig } = await importConfig();
			const config = getFullPixelatedConfig();
			expect(config.siteInfo.name).toBe('Test');
		});

		it('should handle read error gracefully', async () => {
			vi.doMock('fs', () => ({
				__esModule: true,
				default: {
					existsSync: vi.fn(() => true),
					readFileSync: vi.fn(() => { throw new Error('Read error'); })
				},
				existsSync: vi.fn(() => true),
				readFileSync: vi.fn(() => { throw new Error('Read error'); })
			}));
			const { getFullPixelatedConfig } = await importConfig();
			const config = getFullPixelatedConfig();
			expect(config).toEqual({});
		});

		it('should handle decryption if encrypted and key is set', async () => {
			await importConfigWithFs('ENC:v1:test');
			process.env.PIXELATED_CONFIG_KEY = 'test-key';
			(vi.mocked(crypto.isEncrypted) as any).mockReturnValue(true);
			(vi.mocked(crypto.decrypt) as any).mockReturnValue(JSON.stringify({ decrypted: true }));
			const { getFullPixelatedConfig } = await importConfig();
			const config = getFullPixelatedConfig();
			expect(config).toEqual({ decrypted: true });
		});

		it('should look for .env.local if PIXELATED_CONFIG_KEY is missing', async () => {
			vi.doMock('fs', () => ({
				__esModule: true,
				default: {
					existsSync: vi.fn((p: string) => p.includes('.env.local') || p.includes('pixelated.config.json')),
					readFileSync: vi.fn((p: string) => p.includes('.env.local') ? 'PIXELATED_CONFIG_KEY=local-key' : p.includes('pixelated.config.json') ? 'ENC:v1:test' : '')
				},
				existsSync: vi.fn((p: string) => p.includes('.env.local') || p.includes('pixelated.config.json')),
				readFileSync: vi.fn((p: string) => p.includes('.env.local') ? 'PIXELATED_CONFIG_KEY=local-key' : p.includes('pixelated.config.json') ? 'ENC:v1:test' : '')
			}));
			(vi.mocked(crypto.isEncrypted) as any).mockReturnValue(true);
			(vi.mocked(crypto.decrypt) as any).mockReturnValue(JSON.stringify({ fromEnvLocal: true }));
			const { getFullPixelatedConfig } = await importConfig();
			const config = getFullPixelatedConfig();
			expect(config).toEqual({ fromEnvLocal: true });
		});
	});

	describe('getClientOnlyPixelatedConfig', () => {
		it('should strip secrets from loaded config', async () => {
			const fullConfig = {
				siteInfo: { name: 'Test' },
				integrations: {
					ebay: { appId: 'public', sbxAppId: 'secret' }
				},
				global: { someSecret: 'should stay if not in list' }
			};

			const configModule = await importConfigWithFs(JSON.stringify(fullConfig));
			const clientConfig = configModule.getClientOnlyPixelatedConfig();
			expect(clientConfig.siteInfo.name).toBe('Test');
			expect(clientConfig.integrations?.ebay?.appId).toBe('public');
			expect((clientConfig.integrations?.ebay as any)?.sbxAppId).toBeUndefined();
		});

		it('should return empty config when file parses to null', async () => {
			const configModule = await importConfigWithFs('null');
			expect(configModule.getClientOnlyPixelatedConfig()).toEqual({});
		});
	});
});
