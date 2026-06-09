import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as crypto from '../components/config/crypto';
import { getFullPixelatedConfig, getClientOnlyPixelatedConfig } from '../components/config/config';
import fs from 'fs';
import path from 'path';

vi.mock('fs', async (importOriginal) => {
	const actual = await importOriginal<any>();
	return {
		...actual,
		default: {
			...actual.default,
			existsSync: vi.fn(),
			readFileSync: vi.fn()
		},
		existsSync: vi.fn(),
		readFileSync: vi.fn()
	};
});

vi.mock('../components/config/crypto', () => ({
	isEncrypted: vi.fn(),
	decrypt: vi.fn()
}));

describe('config.ts', () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.resetModules();
		process.env = { ...originalEnv };
		vi.clearAllMocks();
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	describe('getFullPixelatedConfig', () => {
		it('should return empty object if no config file found', () => {
			(vi.mocked(fs.existsSync) as any).mockReturnValue(false);
			const config = getFullPixelatedConfig();
			expect(config).toEqual({});
		});

		it('should load plaintext config if found', () => {
			(vi.mocked(fs.existsSync) as any).mockReturnValueOnce(true);
			(vi.mocked(fs.readFileSync) as any).mockReturnValueOnce(JSON.stringify({ siteInfo: { name: 'Test' } }));
			
			const config = getFullPixelatedConfig();
			expect(config.siteInfo.name).toBe('Test');
		});

		it('should handle read error gracefully', () => {
			(vi.mocked(fs.existsSync) as any).mockReturnValueOnce(true);
			(vi.mocked(fs.readFileSync) as any).mockImplementationOnce(() => {
				throw new Error('Read error');
			});
			
			const config = getFullPixelatedConfig();
			expect(config).toEqual({});
		});

		it('should handle decryption if encrypted and key is set', () => {
			const encrypted = 'ENC:v1:test';
			(vi.mocked(fs.existsSync) as any).mockReturnValueOnce(true);
			(vi.mocked(fs.readFileSync) as any).mockReturnValueOnce(encrypted);
			process.env.PIXELATED_CONFIG_KEY = 'test-key';
			
			(vi.mocked(crypto.isEncrypted) as any).mockReturnValue(true);
			(vi.mocked(crypto.decrypt) as any).mockReturnValue(JSON.stringify({ decrypted: true }));

			const config = getFullPixelatedConfig();
			expect(config).toEqual({ decrypted: true });
		});

		it('should look for .env.local if PIXELATED_CONFIG_KEY is missing', () => {
			const encrypted = 'ENC:v1:test';
			(vi.mocked(fs.existsSync) as any).mockImplementation((p: string) => p.includes('.env.local') || p.includes('pixelated.config.json'));
			(vi.mocked(fs.readFileSync) as any).mockImplementation((p: string) => {
				if (p.includes('.env.local')) return 'PIXELATED_CONFIG_KEY=local-key';
				if (p.includes('pixelated.config.json')) return encrypted;
				return '';
			});
			
			(vi.mocked(crypto.isEncrypted) as any).mockReturnValue(true);
			(vi.mocked(crypto.decrypt) as any).mockReturnValue(JSON.stringify({ fromEnvLocal: true }));

			const config = getFullPixelatedConfig();
			expect(config).toEqual({ fromEnvLocal: true });
		});
	});

	describe('getClientOnlyPixelatedConfig', () => {
		it('should strip secrets from config', () => {
			const fullConfig = {
				siteInfo: { name: 'Test' },
				integrations: {
					ebay: { appId: 'public', sbxAppId: 'secret' }
				},
				global: { someSecret: 'should stay if not in list' }
			};

			const clientConfig = getClientOnlyPixelatedConfig(fullConfig as any);
			
			expect(clientConfig.siteInfo.name).toBe('Test');
			expect(clientConfig.integrations?.ebay?.appId).toBe('public');
			expect((clientConfig.integrations?.ebay as any)?.sbxAppId).toBeUndefined();
		});

		it('should handle circular references', () => {
			const circular: any = { a: 1 };
			circular.self = circular;

			const result = getClientOnlyPixelatedConfig(circular);
			expect(result.self).toBe('[Circular]');
		});

		it('should handle null or non-object input', () => {
			expect(getClientOnlyPixelatedConfig(null as any)).toEqual({});
			
			// Mock getFullPixelatedConfig empty return for the undefined case
			(vi.mocked(fs.existsSync) as any).mockReturnValue(false);
			expect(getClientOnlyPixelatedConfig(undefined as any)).toEqual({});
		});
	});
});
