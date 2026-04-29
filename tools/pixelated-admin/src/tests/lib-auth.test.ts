/* eslint-disable pixelated/no-hardcoded-config-keys */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TEST_CONFIG } from '@/test/fixtures';

vi.unmock('@pixelated-tech/components/server');

// Helper to mock the config module before importing auth module
const fakeConfig = {
	nextAuth: { secret: TEST_CONFIG.nextAuth.secret },
	google: { client_id: TEST_CONFIG.google.client_id, client_secret: TEST_CONFIG.google.client_secret },
};

describe('NextAuth config (legacy)', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.doMock('@pixelated-tech/components/server', () => ({
			getFullPixelatedConfig: () => fakeConfig,
		}));
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('exposes authOptions with Google values from pixelated config', async () => {
		const mod = await import('@/lib/auth');
		const { authOptions } = mod as any;
		expect(authOptions.providers[0].clientId).toBe('g-id');
		expect(authOptions.providers[0].clientSecret).toBe('g-secret');
	});

	it('calls auth callback functions correctly', async () => {
		const mod = await import('@/lib/auth');
		const { authOptions } = mod as any;

		const jwtResult = await authOptions.callbacks.jwt({ token: { sub: 'user' }, account: { access_token: 'token-123' } });
		expect(jwtResult).toMatchObject({ accessToken: 'token-123' });

		const sessionResult = await authOptions.callbacks.session({ session: { user: { name: 'Test' } }, token: { accessToken: 'token-123' } });
		expect(sessionResult).toMatchObject({ accessToken: 'token-123' });

		const redirectResult1 = await authOptions.callbacks.redirect({ url: '/dashboard', baseUrl: 'https://admin.pixelated.tech' });
		expect(redirectResult1).toBe('https://admin.pixelated.tech/dashboard');

		const redirectResult2 = await authOptions.callbacks.redirect({ url: 'https://admin.pixelated.tech/login', baseUrl: 'https://admin.pixelated.tech' });
		expect(redirectResult2).toBe('https://admin.pixelated.tech/login');
	});

	it('throws when google config is missing', async () => {
		vi.resetModules();
		vi.doUnmock('@pixelated-tech/components/server');
		// Provide nextAuth.secret but omit google settings
		vi.doMock('@pixelated-tech/components/server', () => ({ getFullPixelatedConfig: () => ({ nextAuth: { secret: TEST_CONFIG.nextAuth.secret } }) }));
		await expect(import('@/lib/auth')).rejects.toThrow('Google OAuth credentials not configured');
	});

	it('does not add accessToken when no account access_token is present', async () => {
		const mod = await import('@/lib/auth');
		const { authOptions } = mod as any;

		const jwtResult = await authOptions.callbacks.jwt({ token: { sub: 'user' }, account: {} });
		expect(jwtResult).toMatchObject({ sub: 'user' });
		expect(jwtResult).not.toHaveProperty('accessToken');

		const sessionResult = await authOptions.callbacks.session({ session: { user: { name: 'Test' } }, token: {} });
		expect(sessionResult).toMatchObject({ user: { name: 'Test' } });
		expect(sessionResult).not.toHaveProperty('accessToken');
	});

	it('returns baseUrl for external redirect URLs', async () => {
		const mod = await import('@/lib/auth');
		const { authOptions } = mod as any;

		const redirectResult = await authOptions.callbacks.redirect({ url: 'https://example.com/other', baseUrl: 'https://admin.pixelated.tech' });
		expect(redirectResult).toBe('https://admin.pixelated.tech');
	});
});