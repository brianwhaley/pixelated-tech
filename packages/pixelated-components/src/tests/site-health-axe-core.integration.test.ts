import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createAxeCoreLocalFallbackPageMock } from '../test/fixtures';

// Mock setTimeout to resolve instantly for tests
const originalSetTimeout = global.setTimeout;
global.setTimeout = vi.fn((callback: any) => {
	callback();
	return {} as any;
}) as any;

// Mock puppeteer at module level
vi.mock('puppeteer', () => ({
	default: {
		launch: vi.fn().mockResolvedValue({
			newPage: vi.fn().mockResolvedValue({
				setViewport: vi.fn().mockResolvedValue(undefined),
				on: vi.fn().mockReturnValue(undefined),
				setUserAgent: vi.fn().mockResolvedValue(undefined),
				goto: vi.fn().mockResolvedValue(undefined),
				addScriptTag: vi.fn().mockResolvedValue(undefined),
				frames: vi.fn().mockReturnValue([{
					evaluate: vi.fn().mockResolvedValue({
						violations: [],
						passes: [],
						incomplete: [],
						inapplicable: [],
						testEngine: { name: 'axe-core', version: '4.0.0' },
						testRunner: { name: 'mock' },
						testEnvironment: { userAgent: 'test', windowWidth: 1280, windowHeight: 720 },
						timestamp: new Date().toISOString(),
						url: 'http://example.com'
					})
				}]),
				close: vi.fn().mockResolvedValue(undefined)
			}),
			close: vi.fn().mockResolvedValue(undefined)
		})
	}
}));

// Mock fs at module level
vi.mock('fs', () => ({
	default: {
		existsSync: vi.fn().mockReturnValue(true),
		readFileSync: vi.fn().mockReturnValue('/* axe */')
	},
	existsSync: vi.fn().mockReturnValue(true),
	readFileSync: vi.fn().mockReturnValue('/* axe */')
}));

// Mock getFullPixelatedConfig
vi.mock('../components/config/config', () => ({
	getFullPixelatedConfig: vi.fn().mockReturnValue({ puppeteer: { executable_path: './chrome' } })
}));

// Import module once to avoid repeated slow imports
let performAxeCoreAnalysis: any;

describe('site-health-axe-core.integration', () => {
	beforeEach(async () => {
		// Only import once per test suite
		if (!performAxeCoreAnalysis) {
			const module = await import('../components/admin/site-health/site-health-axe-core.integration');
			performAxeCoreAnalysis = module.performAxeCoreAnalysis;
		}
	});

	describe('performAxeCoreAnalysis', () => {
		it('should export performAxeCoreAnalysis function', () => {
			expect(typeof performAxeCoreAnalysis).toBe('function');
		});

		it('should accept URL parameter', async () => {
			const result = await performAxeCoreAnalysis('https://example.com');
			
			expect(result).toBeDefined();
			expect(result.url).toBe('https://example.com');
		});

		it('should accept runtime_env parameter with "auto" default', async () => {
			const result1 = await performAxeCoreAnalysis('http://example.com');
			expect(result1).toBeDefined();
			
			const result2 = await performAxeCoreAnalysis('http://example.com', 'local');
			expect(result2).toBeDefined();
			
			const result3 = await performAxeCoreAnalysis('http://example.com', 'prod');
			expect(result3).toBeDefined();
		}, 15000);

		it('should calculate summary with violation counts including moderate and minor', async () => {
			const puppeteerModule = await import('puppeteer');
			vi.mocked(puppeteerModule.default.launch as any).mockResolvedValueOnce({
				newPage: vi.fn().mockResolvedValue({
					setViewport: vi.fn().mockResolvedValue(undefined),
					on: vi.fn().mockReturnValue(undefined),
					setUserAgent: vi.fn().mockResolvedValue(undefined),
					goto: vi.fn().mockResolvedValue(undefined),
					addScriptTag: vi.fn().mockResolvedValue(undefined),
					frames: vi.fn().mockReturnValue([{ 
						evaluate: vi.fn().mockResolvedValue({ 
							violations: [
								{ id: '1', impact: 'critical', description: '', help: '', helpUrl: '', nodes: [], tags: [] },
								{ id: '2', impact: 'serious', description: '', help: '', helpUrl: '', nodes: [], tags: [] },
								{ id: '3', impact: 'moderate', description: '', help: '', helpUrl: '', nodes: [], tags: [] },
								{ id: '4', impact: 'minor', description: '', help: '', helpUrl: '', nodes: [], tags: [] }
							],
							passes: [],
							incomplete: [],
							inapplicable: [],
							testEngine: { name: 'axe-core', version: '4.0.0' },
							testRunner: { name: 'mock' },
							testEnvironment: { userAgent: 'test', windowWidth: 1280, windowHeight: 720 },
							timestamp: new Date().toISOString(),
							url: 'http://example.com'
						}) 
					}]),
					close: vi.fn().mockResolvedValue(undefined)
				}),
				close: vi.fn().mockResolvedValue(undefined)
			} as any);

			const result = await performAxeCoreAnalysis('http://example.com');

			expect(result.summary.critical).toBe(1);
			expect(result.summary.serious).toBe(1);
			expect(result.summary.moderate).toBe(1);
			expect(result.summary.minor).toBe(1);
		});

		it('should handle runtime_env: prod', async () => {
			const result = await performAxeCoreAnalysis('http://example.com', 'prod');
			expect(result.status).toBe('success');
		});

		it('should handle runtime_env: auto', async () => {
			const result = await performAxeCoreAnalysis('http://example.com', 'auto');
			expect(result.status).toBe('success');
		});

		it('should provide hint on browser launch failure', async () => {
			const puppeteerModule = await import('puppeteer');
			vi.mocked(puppeteerModule.default.launch as any).mockRejectedValueOnce('Launch Error');

			const result = await performAxeCoreAnalysis('http://example.com');

			expect(result.status).toBe('error');
			expect(result.error).toContain('Could not launch Chrome/Chromium');
		});

		it('should handle non-Error catch in performAxeCoreAnalysis', async () => {
			const puppeteerModule = await import('puppeteer');
			// Force a throw that is not an Error object
			vi.mocked(puppeteerModule.default.launch as any).mockImplementationOnce(() => {
				throw 'String error';
			});

			const result = await performAxeCoreAnalysis('http://example.com');
			expect(result.status).toBe('error');
			expect(result.error).toContain('String error');
		});

		it('should fall back to local inline injection when CDN injection fails', async () => {
			const puppeteerModule = await import('puppeteer');
			const pageMock = createAxeCoreLocalFallbackPageMock();
			pageMock.frames.mockReturnValue([
				{
					evaluate: vi.fn()
						.mockResolvedValueOnce(false)
						.mockResolvedValueOnce(true)
						.mockResolvedValueOnce({
							violations: [],
							passes: [],
							incomplete: [],
							inapplicable: [],
							testEngine: { name: 'axe-core', version: '4.0.0' },
							testRunner: { name: 'mock' },
							testEnvironment: { userAgent: 'test', windowWidth: 1280, windowHeight: 720 },
							timestamp: new Date().toISOString(),
							url: 'http://example.com'
						})
				}
			]);

			vi.mocked(puppeteerModule.default.launch as any).mockResolvedValueOnce({
				newPage: vi.fn().mockResolvedValue(pageMock),
				close: vi.fn().mockResolvedValue(undefined)
			} as any);

			const result = await performAxeCoreAnalysis('http://example.com');

			expect(result.status).toBe('success');
			expect(result.injectionSource).toBe('local-inline');
			expect(pageMock.addScriptTag).toHaveBeenCalledTimes(2);
		});

		it('should handle errors and return error status', async () => {
			const puppeteerModule = await import('puppeteer');
			vi.mocked(puppeteerModule.default.launch as any).mockRejectedValueOnce(new Error('Browser launch failed'));

			const result = await performAxeCoreAnalysis('http://example.com');

			expect(result.status).toBe('error');
			expect(result.error).toBeDefined();
			expect(result.summary.violations).toBe(0);
		});

		it('should return proper result structure on success', async () => {
			const result = await performAxeCoreAnalysis('http://example.com');

			expect(result).toHaveProperty('site');
			expect(result).toHaveProperty('url');
			expect(result).toHaveProperty('result');
			expect(result).toHaveProperty('summary');
			expect(result).toHaveProperty('timestamp');
			expect(result).toHaveProperty('status');
		});

		it('should handle different URL formats', async () => {
			const urls = [
				'http://example.com',
				'https://example.com',
				'https://example.com/',
				'https://example.com/page'
			];

			for (const url of urls) {
				const result = await performAxeCoreAnalysis(url);
				expect(result).toBeDefined();
				expect(result.url).toBe(url);
			}
		}, 20000);
	});
});
