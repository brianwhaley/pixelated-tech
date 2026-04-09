import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { TEST_CONFIG } from './fixtures';

// Stub @pixelated-tech/components to avoid requiring deep optional modules
vi.mock('@pixelated-tech/components/server', () => ({
	getFullPixelatedConfig: () => ({
		nextAuth: { secret: TEST_CONFIG.nextAuth.secret },
		google: { client_id: TEST_CONFIG.google.client_id, client_secret: TEST_CONFIG.google.client_secret },
	}),
}));

vi.mock('@pixelated-tech/components', () => ({
	server: {
		getFullPixelatedConfig: () => ({
			nextAuth: { secret: TEST_CONFIG.nextAuth.secret, url: TEST_CONFIG.nextAuth.url },
			google: { client_id: TEST_CONFIG.google.client_id, client_secret: TEST_CONFIG.google.client_secret },
		}),
	},
}));

// Provide a minimal adminserver integration mock so tests that import it can spy on
// `performAxeCoreAnalysis` without pulling in optional heavy modules from the real package.
vi.mock('@pixelated-tech/components/adminserver', () => ({
	performAxeCoreAnalysis: vi.fn(),
}));