import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as configModule from '../components/config/config';
import * as smartFetchModule from '../components/foundation/smartfetch';
import { fetchPSIData } from '../components/admin/site-health/site-health-core-web-vitals.integration';
import { mockConfig } from '../test/test-utils';

// Use the test harness mock config derived from src/config/pixelated.config.json

describe('fetchPSIData', () => {
	let getFullConfigSpy: any;
	let smartFetchSpy: any;

	beforeEach(() => {
		// Ensure server-side code sees the standard test harness config by default
		getFullConfigSpy = vi.spyOn(configModule, 'getFullPixelatedConfig').mockReturnValue(mockConfig as any);
		smartFetchSpy = vi.spyOn(smartFetchModule, 'smartFetch').mockResolvedValue({ ok: true, json: async () => ({ lighthouseResult: { audits: { someAudit: {} }, categories: {} } }) });
	});

	afterEach(() => {
		getFullConfigSpy?.mockRestore();
		smartFetchSpy?.mockRestore();
		vi.restoreAllMocks();
	});

	it('uses API key from pixelated.config.json', async () => {
		const apiKey = mockConfig?.integrations?.googlePSI?.api_key;
		expect(apiKey).toBeDefined();
		const url = 'https://example.com';
		await fetchPSIData(url);
		expect(smartFetchSpy).toHaveBeenCalled();
		const calledUrl = (smartFetchSpy as any).mock.calls[0][0] as string;
		expect(calledUrl).toContain(`key=${apiKey}`);
	});

	it('builds a desktop PSI request URL when desktop strategy is used', async () => {
		const url = 'https://example.com';
		await fetchPSIData(url, 'desktop');
		const calledUrl = (smartFetchSpy as any).mock.calls[0][0] as string;
		expect(calledUrl).toContain('strategy=desktop');
		expect(calledUrl).toContain('category=performance');
		expect(calledUrl).toContain('category=accessibility');
	});

	it('throws when smartFetch rejects with repeated HTTP errors', async () => {
		smartFetchSpy.mockRejectedValueOnce(new Error('HTTP 429 Too Many Requests: Rate limit exceeded'))
			.mockRejectedValueOnce(new Error('HTTP 500 Internal Server Error: Server error'))
			.mockRejectedValueOnce(new Error('HTTP 503 Service Unavailable: Service unavailable'));

		await expect(fetchPSIData('https://example.com')).rejects.toThrow('PSI API request failed: HTTP 503 Service Unavailable: Service unavailable');
		expect(smartFetchSpy).toHaveBeenCalledTimes(3);
	});

	it('retries on transient failure and succeeds on second attempt', async () => {
		smartFetchSpy.mockRejectedValueOnce(new Error('Network error'))
			.mockResolvedValueOnce({ ok: true, json: async () => ({ lighthouseResult: { audits: { someAudit: {} }, categories: {} } }) });

		await expect(fetchPSIData('https://example.com')).resolves.toBeDefined();
		expect(smartFetchSpy).toHaveBeenCalledTimes(2);
	});

	it('throws with timeout reporting after repeated AbortError failures', async () => {
		const abortError = new Error('The operation was aborted');
		(abortError as any).name = 'AbortError';
		smartFetchSpy.mockRejectedValueOnce(abortError)
			.mockRejectedValueOnce(abortError)
			.mockRejectedValueOnce(abortError);

		await expect(fetchPSIData('https://example.com')).rejects.toThrow('PSI API request timed out after 60 seconds');
		expect(smartFetchSpy).toHaveBeenCalledTimes(3);
	});

	it('throws when PSI response contains no audits', async () => {
		smartFetchSpy.mockResolvedValueOnce({ ok: true, json: async () => ({ lighthouseResult: { audits: {}, categories: {} } }) });
		await expect(fetchPSIData('https://example.com')).rejects.toThrow('Invalid PSI API response or rate limited');
	});

	it('throws when api key is missing from config', async () => {
		getFullConfigSpy.mockReturnValue({} as any);
		await expect(fetchPSIData('https://example.com')).rejects.toThrow('Google PSI API key is not set');
	});
});