import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { pixelatedConfig, mockGoogleAuth, mockGoogleApiResponses } from '../test/test-data';
import { mockGoogleDateRanges } from '../test/fixtures';

// Mock the cache and utils
const mockCacheManagerInstance = {
  get: vi.fn(),
  set: vi.fn(),
};

vi.mock('../components/foundation/cache-manager', () => {
  const getMock = vi.fn();
  const setMock = vi.fn();
  class MockCacheManager {
    get = getMock;
    set = setMock;
    remove = vi.fn();
    clear = vi.fn();
  }
  // Store references for test access
  (globalThis as any).__mockCacheManager = { get: getMock, set: setMock };
  return {
    CacheManager: MockCacheManager,
  };
});

vi.mock('../components/admin/site-health/google.api.utils', () => ({
  calculateDateRanges: vi.fn(),
  formatChartDate: vi.fn(),
  getCachedData: vi.fn(),
  setCachedData: vi.fn(),
}));

// Mock the googleapis module
vi.mock('googleapis', () => ({
  google: {
    auth: {
      GoogleAuth: vi.fn(),
      OAuth2: vi.fn(),
    },
    analyticsdata: vi.fn(),
    searchconsole: vi.fn(),
  },
}));

import { google } from 'googleapis';
import { CacheManager } from '../components/foundation/cache-manager';
import {
  calculateDateRanges,
  formatChartDate,
  getCachedData,
  setCachedData
} from '../components/admin/site-health/google.api.utils';

import {
  createGoogleAuthClient,
  createAnalyticsClient,
  createSearchConsoleClient,
  getGoogleAnalyticsData,
  getSearchConsoleData,
  type GoogleAuthConfig,
  type GoogleAnalyticsConfig,
  type SearchConsoleConfig,
} from '../components/admin/site-health/google.api.integration';

describe('Google API Integration', () => {
  let authClientInstance: any;
  let mockOAuth2: any;
  let mockAnalyticsData: any;
  let mockSearchConsole: any;
  let mockCacheManager: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    authClientInstance = {
      // Mock methods if needed
    };

    mockOAuth2 = {
      setCredentials: vi.fn(),
      generateAuthUrl: vi.fn(),
      getToken: vi.fn(),
    };

    mockAnalyticsData = {
      properties: {
        runReport: vi.fn(),
      },
    };

    mockSearchConsole = {
      sites: {
        list: vi.fn(),
      },
      searchanalytics: {
        query: vi.fn(),
      },
    };

    // Set global references for mocks
    (globalThis as any).__mockGoogleAuth = authClientInstance;
    (globalThis as any).__mockOAuth2 = mockOAuth2;
    (globalThis as any).__mockAnalyticsData = mockAnalyticsData;
    (globalThis as any).__mockSearchConsole = mockSearchConsole;

    // Set up mock implementations
    (google.auth.GoogleAuth as any).mockImplementation(function() { return authClientInstance; });
    (google.auth.OAuth2 as any).mockImplementation(function() { return mockOAuth2; });
    (google.analyticsdata as any).mockImplementation(function() { return mockAnalyticsData; });
    (google.searchconsole as any).mockImplementation(function() { return mockSearchConsole; });

    // Mock the googleapis constructors are already set up in the module mock
    // (google.auth.GoogleAuth as any).mockImplementation(() => authClientInstance);
    // (google.auth.OAuth2 as any).mockImplementation(() => mockOAuth2);
    // (google.analyticsdata as any).mockImplementation(() => mockAnalyticsData);
    // (google.searchconsole as any).mockImplementation(() => mockSearchConsole);

    // CacheManager is already mocked at module level

    // Mock utility functions
    (calculateDateRanges as Mock).mockReturnValue(mockGoogleDateRanges);

    (formatChartDate as Mock).mockImplementation((date: Date) => {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    (getCachedData as Mock).mockReturnValue(null); // No cached data by default
    (setCachedData as Mock).mockImplementation(() => {}); // No-op
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createGoogleAuthClient', () => {
    const scopes = ['https://www.googleapis.com/auth/analytics.readonly'];

    it('should create auth client with service account key', async () => {
      const config: GoogleAuthConfig = {
        serviceAccountKey: JSON.stringify(mockGoogleAuth),
      };

      const result = await createGoogleAuthClient(config, scopes);

      expect(result.success).toBe(true);
      expect(result.auth).toBe(authClientInstance);
      expect(google.auth.GoogleAuth).toHaveBeenCalledWith({
        credentials: mockGoogleAuth,
        scopes,
      });
    });

    it('should create auth client with OAuth2 credentials', async () => {
      const config: GoogleAuthConfig = {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        refreshToken: 'test-refresh-token',
      };

      const result = await createGoogleAuthClient(config, scopes);

      expect(result.success).toBe(true);
      expect(result.auth).toBe(mockOAuth2);
      expect(google.auth.OAuth2).toHaveBeenCalledWith('test-client-id', 'test-client-secret');
      expect(mockOAuth2.setCredentials).toHaveBeenCalledWith({
        refresh_token: 'test-refresh-token',
      });
    });

    it('should fail when no credentials provided', async () => {
      const config: GoogleAuthConfig = {};

      const result = await createGoogleAuthClient(config, scopes);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Google credentials not configured');
    });

    it('should handle authentication errors', async () => {
      const config: GoogleAuthConfig = {
        serviceAccountKey: 'invalid-json',
      };

      const result = await createGoogleAuthClient(config, scopes);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication failed');
    });
  });

  describe('createAnalyticsClient', () => {
    it('should create analytics client successfully', async () => {
      const config: GoogleAuthConfig = {
        serviceAccountKey: JSON.stringify({ type: 'service_account' }),
      };

      const result = await createAnalyticsClient(config);

      expect(result.success).toBe(true);
      expect(result.client).toBeDefined();
      expect(result.auth).toBe(authClientInstance);
      expect(google.analyticsdata).toHaveBeenCalledWith({
        version: 'v1beta',
        auth: authClientInstance,
      });
    });

    it('should fail when auth creation fails', async () => {
      const config: GoogleAuthConfig = {};

      const result = await createAnalyticsClient(config);

      expect(result.success).toBe(false);
      expect(result.error).toContain('credentials not configured');
    });
  });

  describe('createSearchConsoleClient', () => {
    it('should create search console client successfully', async () => {
      const config: GoogleAuthConfig = {
        serviceAccountKey: JSON.stringify({ type: 'service_account' }),
      };

      const result = await createSearchConsoleClient(config);

      expect(result.success).toBe(true);
      expect(result.client).toBeDefined();
      expect(result.auth).toBe(authClientInstance);
      expect(google.searchconsole).toHaveBeenCalledWith({
        version: 'v1',
        auth: authClientInstance,
      });
    });

    it('should fail when auth creation fails', async () => {
      const config: GoogleAuthConfig = {};

      const result = await createSearchConsoleClient(config);

      expect(result.success).toBe(false);
      expect(result.error).toContain('credentials not configured');
    });
  });

  describe('getGoogleAnalyticsData', () => {
    const validConfig = {
      ...pixelatedConfig.integrations?.googleAnalytics,
      serviceAccountKey: JSON.stringify(mockGoogleAuth)
    };

    beforeEach(() => {
      // Mock successful API responses
      mockAnalyticsData.properties.runReport
        .mockResolvedValueOnce({
          data: mockGoogleApiResponses.analytics,
        })
        .mockResolvedValueOnce({
          data: mockGoogleApiResponses.analyticsPrevious,
        });
    });

    it('should return cached data when available', async () => {
      const cachedData = [{ date: 'Jan 1', currentPageViews: 100, previousPageViews: 80 }];
      (getCachedData as Mock).mockReturnValue(cachedData);

      const result = await getGoogleAnalyticsData(validConfig, 'test-site');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(cachedData);
      expect(mockAnalyticsData.properties.runReport).not.toHaveBeenCalled();
    });

    it('should fail when GA4 property ID is not configured', async () => {
      const configWithoutProperty = { ...validConfig, id: 'GA4_PROPERTY_ID_HERE' };

      const result = await getGoogleAnalyticsData(configWithoutProperty, 'test-site');

      expect(result.success).toBe(false);
      expect(result.error).toContain('GA4 Property ID not configured');
    });

    it('should fetch and process analytics data successfully', async () => {
      const result = await getGoogleAnalyticsData(validConfig, 'test-site');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.length).toBeGreaterThan(0);

      // Verify API calls
      expect(mockAnalyticsData.properties.runReport).toHaveBeenCalledTimes(2);
      expect(setCachedData).toHaveBeenCalled();
    });

    it('should handle authentication failures', async () => {
      const invalidConfig = { id: '123456789' }; // No credentials

      const result = await getGoogleAnalyticsData(invalidConfig, 'test-site');

      expect(result.success).toBe(false);
      expect(result.error).toContain('credentials not configured');
    });
  });

  describe('getSearchConsoleData', () => {
    const validConfig: SearchConsoleConfig = {
      siteUrl: 'https://example.com',
      serviceAccountKey: JSON.stringify({ type: 'service_account' }),
    };

    beforeEach(() => {
      // Mock successful API responses
      mockSearchConsole.searchanalytics.query
        .mockResolvedValueOnce({
          data: mockGoogleApiResponses.searchConsole,
        })
        .mockResolvedValueOnce({
          data: mockGoogleApiResponses.searchConsolePrevious,
        });
    });

    it('should return cached data when available', async () => {
      const cachedData = [{
        date: 'Jan 1',
        currentImpressions: 100,
        currentClicks: 10,
        previousImpressions: 80,
        previousClicks: 8
      }];
      (getCachedData as Mock).mockReturnValue(cachedData);

      const result = await getSearchConsoleData(validConfig, 'test-site');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(cachedData);
      expect(mockSearchConsole.searchanalytics.query).not.toHaveBeenCalled();
    });

    it('should fail when site URL is not configured', async () => {
      const configWithoutUrl = { ...validConfig, siteUrl: '' };

      const result = await getSearchConsoleData(configWithoutUrl, 'test-site');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Site URL not configured');
    });

    it('should fetch and process search console data successfully', async () => {
      const result = await getSearchConsoleData(validConfig, 'test-site');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.length).toBeGreaterThan(0);

      // Verify API calls
      expect(mockSearchConsole.searchanalytics.query).toHaveBeenCalledTimes(2);
      expect(setCachedData).toHaveBeenCalled();
    });

    it('should handle authentication failures', async () => {
      const invalidConfig = { siteUrl: 'https://example.com' }; // No credentials

      const result = await getSearchConsoleData(invalidConfig, 'test-site');

      expect(result.success).toBe(false);
      expect(result.error).toContain('credentials not configured');
    });

    it('should map permission errors to code 403 with insufficient_permission', async () => {
      // Reset the mock responses and simulate the API throwing a permission error
      mockSearchConsole.searchanalytics.query.mockReset();
      mockSearchConsole.searchanalytics.query.mockRejectedValueOnce(new Error('User does not have sufficient permission for site "https://example.com"'));

      const result = await getSearchConsoleData(validConfig, 'test-site');

      expect(result.success).toBe(false);
      expect((result as any).code).toBe(403);
      expect(result.error).toBe('insufficient_permission');
      expect((result as any).details).toContain('User does not have sufficient permission');
    });
  });
});