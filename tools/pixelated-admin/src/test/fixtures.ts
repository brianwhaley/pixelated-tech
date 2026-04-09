/* eslint-disable pixelated/no-hardcoded-config-keys */
/**
 * Test fixtures and constants for mocked configuration
 * These are intentionally hardcoded values for testing purposes only
 */

export const TEST_CONFIG = {
	nextAuth: {
		secret: 'test-secret',
		url: 'https://localhost:3006',
	},
	google: {
		client_id: 'g-id',
		client_secret: 'g-secret',
	},
	contentful: {
		environment: 'test-env',
	},
	wordpress: {
		site: 'brianwhaley',
		siteUrl: 'https://www.brianwhaley.com',
	},
};

export const TEST_AXE_CORE_RESULT = {
	site: TEST_CONFIG.wordpress.site,
	url: TEST_CONFIG.wordpress.siteUrl,
	result: {
		violations: [],
		passes: [],
		incomplete: [],
		inapplicable: [],
		testEngine: { name: 'axe-core', version: 'test' },
		testRunner: { name: 'mock' },
		testEnvironment: { userAgent: 'mock', windowWidth: 1280, windowHeight: 720 },
		timestamp: new Date().toISOString(),
		url: TEST_CONFIG.wordpress.siteUrl,
	},
	summary: { violations: 0, passes: 0, incomplete: 0, inapplicable: 0, critical: 0, serious: 0, moderate: 0, minor: 0 },
	timestamp: new Date().toISOString(),
	status: 'success',
};
