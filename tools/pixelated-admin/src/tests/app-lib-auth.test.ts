 
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TEST_CONFIG } from '@/test/fixtures';

vi.unmock('@pixelated-tech/components/server');

// Helper to mock the config module before importing auth module
const fakeConfig = {
	nextAuth: { secret: TEST_CONFIG.nextAuth.secret },
	google: { client_id: TEST_CONFIG.google.client_id, client_secret: TEST_CONFIG.google.client_secret },
};

describe('NextAuth config (server)', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.doMock('@pixelated-tech/components/server', () => ({
			getFullPixelatedConfig: () => fakeConfig,
		}));
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('exposes authOptions with values from pixelated config', async () => {
		const mod = await import('@/lib/auth');
		const { authOptions } = mod as any;
		expect(authOptions.secret).toBe('test-secret');
		expect(authOptions.providers[0].clientId).toBe('g-id');
		expect(authOptions.providers[0].clientSecret).toBe('g-secret');
	});

	it('throws when required values are missing', async () => {
		vi.resetModules();
		vi.doMock('@pixelated-tech/components/server', () => ({ getFullPixelatedConfig: () => ({}) }));
		await expect(import('@/lib/auth')).rejects.toThrow('nextAuth.secret not configured');
	});
});