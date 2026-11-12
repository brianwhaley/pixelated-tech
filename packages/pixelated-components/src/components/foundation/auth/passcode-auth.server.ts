import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getOriginFromHeaders } from '../sitemap';

export const DEFAULT_PASSCODE_COOKIE = 'pixelated-passcode-session';
export const DEFAULT_PASSCODE_TTL_MS = 10 * 60 * 1000;
export const DEFAULT_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type PasscodeAuthUser = {
	email: string;
	role?: string;
	passcode?: string;
	passcodeExpires?: string;
	sessionToken?: string;
	sessionExpires?: string;
	[key: string]: string | undefined;
};

export type PasscodeAuthStore = {
	findUser: (email: string) => Promise<PasscodeAuthUser | null>;
	findUserBySession: (sessionToken: string) => Promise<PasscodeAuthUser | null>;
	saveUser: (user: PasscodeAuthUser) => Promise<void>;
	sendPasscode: (user: PasscodeAuthUser, passcode: string) => Promise<void>;
};

export type PasscodeAuthHandlerOptions = {
	store: PasscodeAuthStore;
	loginPath: string;
	getAuthenticatedPath: (user: PasscodeAuthUser) => string;
	cookieName?: string;
	passcodeTtlMs?: number;
	sessionTtlMs?: number;
	now?: () => Date;
};

export function generatePasscode() {
	return String(randomInt(100000, 1000000));
}

export function generateSessionToken() {
	return randomBytes(32).toString('hex');
}

function hashToken(token: string) {
	return createHash('sha256').update(token).digest('hex');
}

function redirect(request: Request, path: string, params?: Record<string, string>) {
	const url = new URL(path, getOriginFromHeaders(request.headers) || request.url);
	for (const [key, value] of Object.entries(params || {})) url.searchParams.set(key, value);
	return NextResponse.redirect(url, 303);
}

function setCookie(response: NextResponse, name: string, value: string, maxAge: number) {
	response.cookies.set({
		name,
		value,
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		path: '/',
		maxAge,
	});
}

export function createPasscodeAuthHandlers(options: PasscodeAuthHandlerOptions) {
	const cookieName = options.cookieName ?? DEFAULT_PASSCODE_COOKIE;
	const passcodeTtlMs = options.passcodeTtlMs ?? DEFAULT_PASSCODE_TTL_MS;
	const sessionTtlMs = options.sessionTtlMs ?? DEFAULT_SESSION_TTL_MS;
	const now = options.now ?? (() => new Date());

	async function POST(request: Request) {
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '').trim().toLowerCase();
		const passcode = String(formData.get('passcode') ?? '').trim();
		const action = String(formData.get('action') ?? (passcode ? 'verify' : 'request'));

		if (!email || !email.includes('@')) {
			return redirect(request, options.loginPath, { error: 'invalid-email' });
		}

		const user = await options.store.findUser(email);
		if (action === 'request') {
			const response = redirect(request, options.loginPath, { sent: '1' });
			if (user) {
				const code = generatePasscode();
				const expiresAt = new Date(now().getTime() + passcodeTtlMs).toISOString();
				await options.store.saveUser({
					...user,
					passcode: code,
					passcodeExpires: expiresAt,
					updatedAt: now().toISOString(),
				});
				await options.store.sendPasscode(user, code);
				response.cookies.set({
					name: `${cookieName}-pending`,
					value: email,
					httpOnly: true,
					secure: process.env.NODE_ENV === 'production',
					sameSite: 'lax',
					path: '/',
					maxAge: Math.ceil(passcodeTtlMs / 1000),
				});
			}
			return response;
		}

		if (action !== 'verify' || !user?.passcode || !user.passcodeExpires || !passcode) {
			return redirect(request, options.loginPath, { error: 'invalid-passcode' });
		}

		const expiresAt = new Date(user.passcodeExpires).getTime();
		const storedPasscode = Buffer.from(user.passcode);
		const submittedPasscode = Buffer.from(passcode);
		const passcodeMatches = storedPasscode.length === submittedPasscode.length
			&& timingSafeEqual(storedPasscode, submittedPasscode);
		if (!Number.isFinite(expiresAt) || expiresAt < now().getTime() || !passcodeMatches) {
			return redirect(request, options.loginPath, { error: 'invalid-passcode' });
		}

		const sessionToken = generateSessionToken();
		const sessionExpires = new Date(now().getTime() + sessionTtlMs).toISOString();
		await options.store.saveUser({
			...user,
			passcode: undefined,
			passcodeExpires: undefined,
			sessionToken: hashToken(sessionToken),
			sessionExpires,
			updatedAt: now().toISOString(),
		});
		const response = redirect(request, options.getAuthenticatedPath(user));
		setCookie(response, cookieName, sessionToken, Math.ceil(sessionTtlMs / 1000));
		response.cookies.delete(`${cookieName}-pending`);
		return response;
	}

	async function GET(request: Request) {
		const url = new URL(request.url);
		if (url.searchParams.get('action') !== 'logout') {
			return new Response('Method Not Allowed', { status: 405 });
		}
		const response = redirect(request, options.loginPath);
		response.cookies.delete(cookieName);
		response.cookies.delete(`${cookieName}-pending`);
		return response;
	}

	return { GET, POST };
}

export async function validatePasscodeSession(
	sessionToken: string | undefined,
	store: Pick<PasscodeAuthStore, 'findUserBySession'>,
	now = new Date(),
) {
	if (!sessionToken) return null;
	const user = await store.findUserBySession(hashToken(sessionToken));
	if (!user?.sessionExpires) return null;
	const expiresAt = new Date(user.sessionExpires).getTime();
	if (!Number.isFinite(expiresAt) || expiresAt < now.getTime()) return null;
	return user;
}

