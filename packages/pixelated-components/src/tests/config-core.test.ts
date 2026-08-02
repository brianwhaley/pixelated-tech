import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { encrypt } from '../components/config/crypto';

let configModule: typeof import('../components/config/config');

// Mock fs and path
vi.mock('fs', () => ({
	default: {
		existsSync: vi.fn(),
		readFileSync: vi.fn(),
	},
	existsSync: vi.fn(),
	readFileSync: vi.fn(),
}));
vi.mock('path', async () => {
	const actual = await vi.importActual('path') as any;
	const mockPath = {
		...actual,
		join: vi.fn((...args) => args.join('/')),
		default: {
			...actual,
			join: vi.fn((...args) => args.join('/')),
		}
	};
	return mockPath;
});

describe('config core logic', () => {
	beforeEach(async () => {
		vi.resetModules();
		vi.resetAllMocks();
		vi.stubEnv('PIXELATED_CONFIG_KEY', 'test-key');
		configModule = await import('../components/config/config');
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	function getFullPixelatedConfig() {
		return configModule.getFullPixelatedConfig();
	}

	function getClientOnlyPixelatedConfig() {
		return configModule.getClientOnlyPixelatedConfig();
	}

	describe('getFullPixelatedConfig', () => {
		it('should return empty object if no config file is found', async () => {
			vi.mocked(fs.existsSync).mockReturnValue(false);
			const config = getFullPixelatedConfig();
			expect(config).toEqual({});
		});

		it('should load and parse valid JSON config', async () => {
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ siteName: 'Test Site' }));
			const config = getFullPixelatedConfig();
			expect(config).toEqual({ siteName: 'Test Site' });
		});

		it('should handle read errors gracefully', async () => {
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readFileSync).mockImplementation(() => {
				throw new Error('Read error');
			});
			const config = getFullPixelatedConfig();
			expect(config).toEqual({});
		});

		it('should handle invalid JSON', async () => {
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readFileSync).mockReturnValue('invalid json');
			const config = getFullPixelatedConfig();
			expect(config).toEqual({});
		});

		it('should try multiple paths until success', async () => {
			vi.mocked(fs.existsSync)
				.mockReturnValueOnce(false)
				.mockReturnValueOnce(true);
			vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ found: true }));
			const config = getFullPixelatedConfig();
			expect(config).toEqual({ found: true });
			expect(fs.existsSync).toHaveBeenCalledTimes(2);
		});

		it('should cache getFullPixelatedConfig results across calls', async () => {
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ siteName: 'Cached Site' }));
			const first = getFullPixelatedConfig();
			const second = getFullPixelatedConfig();
			expect(first).toEqual({ siteName: 'Cached Site' });
			expect(second).toEqual({ siteName: 'Cached Site' });
			expect(fs.existsSync).toHaveBeenCalledTimes(1);
			expect(fs.readFileSync).toHaveBeenCalledTimes(1);
		});

	});

	describe('getClientOnlyPixelatedConfig', () => {
		it('should return empty object if config is invalid', async () => {
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readFileSync).mockReturnValue('null');
			expect(getClientOnlyPixelatedConfig()).toEqual({});
		});

		it('should call getFullPixelatedConfig if no arg provided', async () => {
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ integrations: { global: { proxyUrl: 'test' } } }));
			const config = getClientOnlyPixelatedConfig();
			expect(config.integrations?.global?.proxyUrl).toBe('test');
		});

		it('should cache getClientOnlyPixelatedConfig results across calls', async () => {
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ integrations: { global: { proxyUrl: 'test' } } }));
			const first = getClientOnlyPixelatedConfig();
			const second = getClientOnlyPixelatedConfig();
			expect(first).toEqual({ integrations: { global: { proxyUrl: 'test' } } });
			expect(second).toEqual(first);
			expect(fs.existsSync).toHaveBeenCalledTimes(1);
			expect(fs.readFileSync).toHaveBeenCalledTimes(1);
		});

		it('should strip secrets from loaded config', async () => {
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
				integrations: {
					global: { proxyUrl: 'test' },
					cloudinary: {
						product_env: 'prod',
						api_secret: 'top-secret'
					},
					paypal: {
						sandboxPayPalApiKey: 'sandbox-client-id',
						sandboxPayPalSecret: 'sandbox-secret',
						payPalApiKey: 'prod-client-id',
						payPalSecret: 'prod-secret'
					}
				}
			}));
			const client = getClientOnlyPixelatedConfig();
			expect(client.integrations?.global?.proxyUrl).toBe('test');
			expect(client.integrations?.cloudinary).toBeDefined();
			expect((client.integrations?.cloudinary as any).api_secret).toBeUndefined();
			expect(client.integrations?.paypal).toBeDefined();
			expect((client.integrations?.paypal as any).sandboxPayPalApiKey).toBe('sandbox-client-id');
			expect((client.integrations?.paypal as any).payPalApiKey).toBe('prod-client-id');
			expect((client.integrations?.paypal as any).sandboxPayPalSecret).toBeUndefined();
			expect((client.integrations?.paypal as any).payPalSecret).toBeUndefined();
		});
	});
});
