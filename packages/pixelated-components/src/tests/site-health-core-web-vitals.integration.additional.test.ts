import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { googlePsiExampleCom, pixelatedConfig } from '../test/test-data';
import { getFullPixelatedConfig } from '../components/config/config';

vi.mock('../components/config/config', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../components/config/config')>();
	return {
		...actual,
		getFullPixelatedConfig: vi.fn()
	};
});

import * as siteHealthModule from '../components/admin/site-health/site-health-core-web-vitals.integration';

const mockPsiData = googlePsiExampleCom;

describe('Site health core web vitals integration', () => {
	let originalFetch: any;

	beforeEach(() => {
		originalFetch = globalThis.fetch;
		vi.clearAllMocks();
		(vi.mocked(getFullPixelatedConfig) as any).mockReturnValue(pixelatedConfig);
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	it('should process PSI data into structured metrics and categories', async () => {
		const result = await siteHealthModule.processPSIData(mockPsiData, 'Test Site', 'https://example.com');

		expect(result.status).toBe('success');
		expect(typeof result.metrics.lcp).toBe('number');
		expect(typeof result.metrics.fcp).toBe('number');
		expect(result.categories.performance.id).toBe('performance');
		expect(Array.isArray(result.categories.performance.audits)).toBe(true);
	});

	it('should cache results on repeated performCoreWebVitalsAnalysis calls', async () => {
		globalThis.fetch = vi.fn().mockResolvedValueOnce({
			ok: true,
			json: async () => mockPsiData
		});

		const first = await siteHealthModule.performCoreWebVitalsAnalysis('https://example.com/cache', 'Test Site Cache');
		const second = await siteHealthModule.performCoreWebVitalsAnalysis('https://example.com/cache', 'Test Site Cache');

		expect(globalThis.fetch).toHaveBeenCalledTimes(1);
		expect(second.status).toBe('success');
		expect(first.url).toBe(second.url);
	});

	it('should return an error status when PSI fetch fails', async () => {
		globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error('PSI failure'));

		const result = await siteHealthModule.performCoreWebVitalsAnalysis('https://example.com/failure', 'Test Site Failure');

		expect(result.status).toBe('error');
		expect(result.error).toContain('PSI API request failed');
	});
});
