import NextAuth from 'next-auth';
import { authOptions } from '../../../../lib/authentication';
import { NextRequest } from 'next/server';
import { getOriginFromHeaders } from '@pixelated-tech/components/server';

// Toggle debug logging for this route. Follow repo convention: set to `true` to enable.
const debug = false;

type AuthRouteContext = { params: Promise<{ nextauth: string[] }> };

const handler = NextAuth(authOptions);

async function authHandler(req: NextRequest, context: AuthRouteContext) {
	// Sanitize any incoming callbackUrl values (cookie or query) to avoid honoring
	// absolute URLs provided by clients or proxies. Only allow relative paths.
	const sanitizedUrl = new URL(req.url);
	const params = sanitizedUrl.searchParams;
	const incomingCallback = params.get('callbackUrl');
	if (incomingCallback) {
		try {
			new URL(incomingCallback);
			params.set('callbackUrl', '/');
		} catch {
			// not an absolute URL, leave as-is
		}
	}

	const clonedHeaders = new Headers(req.headers as any);
	const cookie = clonedHeaders.get('cookie') || '';
	if (cookie.includes('next-auth.callback-url')) {
		const newCookie = cookie
			.split(';')
			.map(c => c.trim())
			.filter(c => !c.startsWith('next-auth.callback-url='))
			.join('; ');
		if (newCookie) clonedHeaders.set('cookie', newCookie);
		else clonedHeaders.delete('cookie');
	}

	const sanitizedRequest = new NextRequest(sanitizedUrl.toString(), {
		method: req.method,
		headers: clonedHeaders,
		body: req.body as any,
	});

	const callbackUrl = canonicalCallback(sanitizedRequest as any);
	try {
		if (debug) {
			const headers = {
				x_origin: req.headers.get('x-origin'),
				origin: req.headers.get('origin'),
				x_forwarded_host: req.headers.get('x-forwarded-host'),
				host: req.headers.get('host'),
				x_forwarded_proto: req.headers.get('x-forwarded-proto'),
			};
			console.warn('[auth:debug] computed callbackUrl:', callbackUrl);
			console.warn('[auth:debug] request headers:', headers);
		}
	} catch {
		// ignore logging errors
	}

	const response = await handler(sanitizedRequest as any, context as any);
	try {
		if (debug) {
			const rawLocation = response.headers.get('location') ?? response.headers.get('Location');
			console.warn('[auth:debug] NextAuth raw Location header:', rawLocation);
		}
	} catch {
		/* ignore */
	}

	function stripCallbackCookie(response: Response) {
		const headers = new Headers();
		for (const [name, value] of response.headers.entries()) {
			if (name.toLowerCase() === 'set-cookie' && value.includes('next-auth.callback-url')) {
				continue;
			}
			headers.append(name, value);
		}
		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers,
		});
	}

	const cleanedResponse = stripCallbackCookie(response);
	if (callbackUrl) {
		const rewritten = rewriteRedirectLocation(cleanedResponse, callbackUrl);
		if (rewritten) return rewritten;
	}

	return cleanedResponse;
}

function normalizeUrl(value?: string): string | undefined {
	if (!value) return undefined;
	return value.replace(/\/$/, '');
}

function canonicalCallback(req: Request): string | undefined {
	const base = normalizeUrl(process.env.NEXTAUTH_URL);
	if (base) return `${base}/api/auth/callback/google`;

	const origin = getOriginFromHeaders(req.headers);
	if (!origin) return undefined;
	if (process.env.NODE_ENV === 'production' && origin.includes('localhost')) return undefined;
	return `${normalizeUrl(origin)}/api/auth/callback/google`;
}

function replaceRedirectUri(location: string, callbackUrl: string): string | null {
	try {
		const locUrl = new URL(location);
		locUrl.searchParams.set('redirect_uri', callbackUrl);
		return locUrl.toString();
	} catch {
		return null;
	}
}

function rewriteRedirectLocation(response: Response, callbackUrl: string): Response | null {
	const location = response.headers.get('location') ?? response.headers.get('Location');
	if (!location || !location.includes('redirect_uri=')) return null;
	const updated = replaceRedirectUri(location, callbackUrl);
	if (!updated || updated === location) return null;
	const headers = new Headers(response.headers);
	headers.set('Location', updated);
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

export { authHandler as GET, authHandler as POST };
