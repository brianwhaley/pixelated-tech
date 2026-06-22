 
import { describe, it, expect, vi, afterEach } from 'vitest';
import { TEST_CONFIG } from '@/tests/fixtures';

const createDefaultAdminserverMock = () => ({
	performAxeCoreAnalysis: vi.fn(),
	getNextAuthCredentials: () => ({ secret: TEST_CONFIG.nextAuth.secret }),
	getGoogleOAuthCredentials: () => ({
		clientId: (TEST_CONFIG.integrations as any).google.client_id,
		clientSecret: (TEST_CONFIG.integrations as any).google.client_secret,
	}),
});

describe('NextAuth config (server)', () => {
	afterEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
	});

	it('exposes authOptions with values from pixelated config', async () => {
		vi.resetModules();
		vi.doMock('@pixelated-tech/components/adminserver', createDefaultAdminserverMock);

		const mod = await import('@/lib/authentication');
		const { authOptions } = mod as any;
		expect(authOptions.secret).toBe('test-secret');
		expect(authOptions.providers[0].clientId).toBe('g-id');
		expect(authOptions.providers[0].clientSecret).toBe('g-secret');
	});

	it('throws when required values are missing', async () => {
		vi.resetModules();
		vi.doMock('@pixelated-tech/components/adminserver', () => ({
			performAxeCoreAnalysis: vi.fn(),
			getNextAuthCredentials: () => { throw new Error('nextAuth.secret not configured in pixelated.config.json'); },
			getGoogleOAuthCredentials: () => ({
				clientId: (TEST_CONFIG.integrations as any).google.client_id,
				clientSecret: (TEST_CONFIG.integrations as any).google.client_secret,
			}),
		}));

		await expect(import('@/lib/authentication')).rejects.toThrow('nextAuth.secret not configured');
	});
});