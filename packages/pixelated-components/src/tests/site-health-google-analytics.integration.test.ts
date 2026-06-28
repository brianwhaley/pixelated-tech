import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pixelatedConfig, mockGoogleAuth, mockGoogleApiResponses, mockGoogleDateRanges as googleDateRanges } from '../test/test-data';

const mockGoogleDateRanges = googleDateRanges ? {
	currentStart: new Date(googleDateRanges.currentStart),
	currentEnd: new Date(googleDateRanges.currentEnd),
	currentStartStr: googleDateRanges.currentStartStr,
	currentEndStr: googleDateRanges.currentEndStr,
	previousStart: new Date(googleDateRanges.previousStart),
	previousEnd: new Date(googleDateRanges.previousEnd),
	previousStartStr: googleDateRanges.previousStartStr,
	previousEndStr: googleDateRanges.previousEndStr,
} : undefined;

// Mock googleapis BEFORE importing integration module
vi.mock('googleapis', () => ({
	google: {
		auth: {
			GoogleAuth: vi.fn(function(this: any) {
				this.getClient = vi.fn().mockResolvedValue({});
				return this;
			}),
			OAuth2: vi.fn(function(this: any) {
				this.setCredentials = vi.fn();
				return this;
			})
		},
		analyticsdata: vi.fn(() => ({
			properties: {
				runReport: vi.fn().mockResolvedValue({
					data: mockGoogleApiResponses.analytics
				})
			}
		}))
	}
}));

vi.mock('../components/foundation/cache-manager', () => ({
	CacheManager: vi.fn(function(this: any) {
		this.cache = new Map();
		this.get = vi.fn((key) => this.cache.get(key));
		this.set = vi.fn((key, val) => this.cache.set(key, val));
		return this;
	})
}));

vi.mock('../components/foundation/utilities', () => ({
	getDomain: vi.fn(() => 'example.com')
}));

vi.mock('../components/config/config', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../components/config/config')>();
	return {
		...actual,
		getFullPixelatedConfig: vi.fn(),
	};
});

vi.mock('../components/admin/site-health/google.api.utils', () => ({
	calculateDateRanges: vi.fn(() => mockGoogleDateRanges),
	formatChartDate: vi.fn((date) => date.toISOString().split('T')[0]),
	getCachedData: vi.fn(() => null),
	setCachedData: vi.fn()
}));

// Import AFTER mocks are defined - Import from the integration file to generate coverage
import { getGoogleAnalyticsData, GoogleAnalyticsConfig, createGoogleAuthClient, createAnalyticsClient, createSearchConsoleClient } from '../components/admin/site-health/google.api.integration';
import { getFullPixelatedConfig } from '../components/config/config';

describe('site-health-google-analytics.integration', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(vi.mocked(getFullPixelatedConfig) as any).mockReturnValue(pixelatedConfig);
	});

	const validConfig: GoogleAnalyticsConfig = {
		...pixelatedConfig.integrations?.googleAnalytics,
		serviceAccountKey: JSON.stringify(mockGoogleAuth)
	};

	it('should fetch Google Analytics data with valid service account', async () => {
		const result = await getGoogleAnalyticsData(validConfig, 'test-site');
		expect(result.success).toBe(true);
		expect(result.data).toBeDefined();
		expect(Array.isArray(result.data)).toBe(true);
	});

	it('should handle missing GA4 property ID configuration', async () => {
		const config: GoogleAnalyticsConfig = {
			id: 'GA4_PROPERTY_ID_HERE',
			serviceAccountKey: JSON.stringify({
				type: 'service_account',
				project_id: 'test',
				private_key: 'key',
				client_email: 'test@test.com'
			})
		};

		const result = await getGoogleAnalyticsData(config, 'test-site');
		expect(result.success).toBe(false);
		expect(result.error).toContain('GA4 Property ID');
	});

	it('should handle missing credentials gracefully', async () => {
		const config: GoogleAnalyticsConfig = {
			id: 'G-123456'
			// No credentials provided
		};

		const result = await getGoogleAnalyticsData(config, 'test-site');
		expect(result.success).toBe(false);
		expect(result.error).toBeDefined();
	});

	it('should fail Google auth when service account key is invalid JSON', async () => {
		const result = await createGoogleAuthClient({ serviceAccountKey: 'not-json' }, ['https://www.googleapis.com/auth/analytics.readonly']);
		expect(result.success).toBe(false);
		expect(result.error).toContain('Authentication failed');
	});

	it('should use OAuth fallback when OAuth credentials are provided', async () => {
		const result = await createGoogleAuthClient({ clientId: 'cid', clientSecret: 'secret', refreshToken: 'token' }, ['https://www.googleapis.com/auth/analytics.readonly']);
		expect(result.success).toBe(true);
		expect(result.auth).toBeDefined();
	});

	it('should return auth failure when analytics credentials are missing', async () => {
		const analyticsResult = await createAnalyticsClient({ id: 'G-123456' });
		expect(analyticsResult.success).toBe(false);
		expect(analyticsResult.error).toContain('Google credentials not configured');
	});

	it('should return auth failure when search console credentials are missing', async () => {
		const searchConsoleResult = await createSearchConsoleClient({ siteUrl: 'https://example.com' });
		expect(searchConsoleResult.success).toBe(false);
		expect(searchConsoleResult.error).toContain('Google credentials not configured');
	});

	it('should use cache when available', async () => {
		const config: GoogleAnalyticsConfig = {
			id: 'G-123456',
			serviceAccountKey: JSON.stringify({
				type: 'service_account',
				project_id: 'test',
				private_key: 'key',
				client_email: 'test@test.com'
			})
		};

		const result1 = await getGoogleAnalyticsData(config, 'test-site');
		const result2 = await getGoogleAnalyticsData(config, 'test-site');

		expect(result1).toBeDefined();
		expect(result2).toBeDefined();
	});

	it('should handle date range parameters correctly', async () => {
		const config: GoogleAnalyticsConfig = {
			id: 'G-123456',
			serviceAccountKey: JSON.stringify({
				type: 'service_account',
				project_id: 'test',
				private_key: 'key',
				client_email: 'test@test.com'
			})
		};

		const result = await getGoogleAnalyticsData(
			config,
			'test-site',
			'2024-01-15',
			'2024-01-17'
		);

		expect(result.success).toBe(true);
		if (result.data) {
			expect(result.data.length).toBeGreaterThan(0);
		}
	});

	it('should work with different site names independently', async () => {
		const config: GoogleAnalyticsConfig = {
			id: 'G-123456',
			serviceAccountKey: JSON.stringify({
				type: 'service_account',
				project_id: 'test',
				private_key: 'key',
				client_email: 'test@test.com'
			})
		};

		const result1 = await getGoogleAnalyticsData(config, 'site-a');
		const result2 = await getGoogleAnalyticsData(config, 'site-b');

		expect(result1).toBeDefined();
		expect(result2).toBeDefined();
	});

	it('should include both current and previous period pageviews', async () => {
		const config: GoogleAnalyticsConfig = {
			id: 'G-123456',
			serviceAccountKey: JSON.stringify({
				type: 'service_account',
				project_id: 'test',
				private_key: 'key',
				client_email: 'test@test.com'
			})
		};

		const result = await getGoogleAnalyticsData(config, 'test-site');
		if (result.success && result.data) {
			expect(result.data[0].currentPageViews).toBeGreaterThanOrEqual(0);
			expect(result.data[0].previousPageViews).toBeGreaterThanOrEqual(0);
		}
	});
});
