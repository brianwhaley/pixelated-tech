import NextAuth from 'next-auth';
import { authOptions } from '../../../../lib/authentication';
import { NextRequest } from 'next/server';
import { getOriginFromHeaders } from '@pixelated-tech/components/server';

type AuthRouteContext = { params: Promise<{ nextauth: string[] }> };

const handler = NextAuth(authOptions);

export async function GET(req: NextRequest, context: AuthRouteContext) {
	// Reject absolute callback URLs before NextAuth sees them.
	const requestUrl = new URL(req.url);
	const requestedCallbackUrl = requestUrl.searchParams.get('callbackUrl');
	if (requestedCallbackUrl) {
		try {
			new URL(requestedCallbackUrl);
			requestUrl.searchParams.set('callbackUrl', '/');
		} catch {
			// Relative callback paths are allowed.
		}
	}

	// Remove the callback cookie before forwarding the request. It can contain a
	// stale or external URL that conflicts with the callback URL we calculate below.
	const requestHeaders = new Headers(req.headers as any);
	const requestCookie = requestHeaders.get('cookie') || '';
	if (requestCookie.includes('next-auth.callback-url')) {
		const remainingCookies = requestCookie
			.split(';')
			.map(cookie => cookie.trim())
			.filter(cookie => !cookie.startsWith('next-auth.callback-url='))
			.join('; ');
		if (remainingCookies) requestHeaders.set('cookie', remainingCookies);
		else requestHeaders.delete('cookie');
	}

	const sanitizedRequest = new NextRequest(requestUrl.toString(), {
		method: req.method,
		headers: requestHeaders,
		body: req.body as any,
	});

	// Use the configured public URL when available; otherwise derive it from the
	// forwarded request headers used by the hosting proxy.
	const configuredOrigin = process.env.NEXTAUTH_URL?.replace(/\/$/, '');
	let callbackUrl: string | undefined;
	if (configuredOrigin) {
		callbackUrl = `${configuredOrigin}/api/auth/callback/google`;
	} else {
		const requestOrigin = getOriginFromHeaders(sanitizedRequest.headers as any);
		if (requestOrigin && !(process.env.NODE_ENV === 'production' && requestOrigin.includes('localhost'))) {
			callbackUrl = `${requestOrigin.replace(/\/$/, '')}/api/auth/callback/google`;
		}
	}

	const response = await handler(sanitizedRequest as any, context as any);

	// Rebuild the response once so cookie filtering, cache headers, and redirect
	// correction are visible in one place and preserve the original status/body.
	const responseHeaders = new Headers();
	for (const [name, value] of response.headers.entries()) {
		if (name.toLowerCase() === 'set-cookie' && value.includes('next-auth.callback-url')) continue;
		responseHeaders.append(name, value);
	}
	responseHeaders.set('Cache-Control', 'private, no-store, no-cache, max-age=0, s-maxage=0, must-revalidate');
	responseHeaders.set('Pragma', 'no-cache');
	responseHeaders.set('Expires', '0');

	if (callbackUrl) {
		const location = responseHeaders.get('location') ?? responseHeaders.get('Location');
		if (location?.includes('redirect_uri=')) {
			try {
				const locationUrl = new URL(location);
				locationUrl.searchParams.set('redirect_uri', callbackUrl);
				responseHeaders.set('Location', locationUrl.toString());
			} catch {
				// Leave malformed provider redirects unchanged.
			}
		}
	}

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: responseHeaders,
	});
}

export const POST = GET;
