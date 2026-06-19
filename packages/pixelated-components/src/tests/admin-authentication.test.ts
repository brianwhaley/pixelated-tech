import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const fakeConfig = {
	integrations: {
		nextAuth: { secret: 'fake-secret' },
		google: { client_id: 'g-id', client_secret: 'g-secret' },
	},
};

describe('admin authentication helpers', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns OAuth credentials from pixelated config', async () => {
		vi.doMock('../components/config/config', () => ({
			getFullPixelatedConfig: () => fakeConfig,
		}));

		const { getNextAuthCredentials, getGoogleOAuthCredentials } = await import('../components/admin/auth/authentication');

		expect(getNextAuthCredentials()).toEqual({ secret: 'fake-secret' });
		expect(getGoogleOAuthCredentials()).toEqual({ clientId: 'g-id', clientSecret: 'g-secret' });
	});

	it('throws when nextAuth.secret is missing', async () => {
		vi.doMock('../components/config/config', () => ({
			getFullPixelatedConfig: () => ({
				integrations: {
					google: { client_id: 'g-id', client_secret: 'g-secret' },
				},
			}),
		}));

		const mod = await import('../components/admin/auth/authentication');
		expect(() => mod.getNextAuthCredentials()).toThrow('nextAuth.secret not configured in pixelated.config.json');
	});

	it('throws when Google OAuth credentials are missing', async () => {
		vi.doMock('../components/config/config', () => ({
			getFullPixelatedConfig: () => ({
				integrations: {
					nextAuth: { secret: 'fake-secret' },
				},
			}),
		}));

		const mod = await import('../components/admin/auth/authentication');
		expect(() => mod.getGoogleOAuthCredentials()).toThrow('Google OAuth credentials not configured in pixelated.config.json');
	});
});
