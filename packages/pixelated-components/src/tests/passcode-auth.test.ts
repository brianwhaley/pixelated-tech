import { describe, expect, it, vi } from 'vitest';
import { createPasscodeAuthHandlers } from '../components/foundation/auth/passcode-auth.server';

describe('passcode authentication handlers', () => {
	it('issues a passcode without revealing whether an email is registered', async () => {
		const saveUser = vi.fn();
		const sendPasscode = vi.fn();
		const handlers = createPasscodeAuthHandlers({
			store: {
				findUser: vi.fn().mockResolvedValue(null),
				findUserBySession: vi.fn(),
				saveUser,
				sendPasscode,
			},
			loginPath: '/timesheets',
			getAuthenticatedPath: () => '/timesheets/summary',
			now: () => new Date('2026-11-12T12:00:00Z'),
		});

		const response = await handlers.POST(new Request('https://example.com/timesheets/auth', {
			method: 'POST',
			headers: {
				'x-forwarded-host': 'www.amavajanitorial.com',
				'x-forwarded-proto': 'https',
			},
			body: new URLSearchParams({ action: 'request', email: 'unknown@example.com' }),
		}));

		expect(response.status).toBe(303);
		expect(response.headers.get('location')).toBe('https://www.amavajanitorial.com/timesheets?sent=1');
		expect(saveUser).not.toHaveBeenCalled();
		expect(sendPasscode).not.toHaveBeenCalled();
	});

	it('creates a session after a valid passcode', async () => {
		const user = { email: 'worker@example.com', role: 'user', passcode: '123456', passcodeExpires: '2026-11-12T12:10:00.000Z' };
		const savedUsers: Array<Record<string, string | undefined>> = [];
		const handlers = createPasscodeAuthHandlers({
			store: {
				findUser: vi.fn().mockResolvedValue(user),
				findUserBySession: vi.fn(),
				saveUser: vi.fn(async (savedUser) => savedUsers.push(savedUser)),
				sendPasscode: vi.fn(),
			},
			loginPath: '/timesheets',
			getAuthenticatedPath: () => '/timesheets/summary',
			now: () => new Date('2026-11-12T12:00:00Z'),
		});

		const response = await handlers.POST(new Request('https://example.com/timesheets/auth', {
			method: 'POST',
			body: new URLSearchParams({ action: 'verify', email: user.email, passcode: user.passcode }),
		}));

		expect(response.status).toBe(303);
		expect(response.headers.get('location')).toBe('https://example.com/timesheets/summary');
		expect(response.headers.get('set-cookie')).toContain('pixelated-passcode-session=');
		expect(savedUsers[0].passcode).toBeUndefined();
		expect(savedUsers[0].sessionToken).toBeTruthy();
	});
});
