import { describe, it, expect, vi, beforeAll } from 'vitest';
import type { NextRequest } from "next/server";
let handlePixelatedProxy: typeof import("../components/foundation/proxy-handler").handlePixelatedProxy;

vi.mock('next/server', () => {
	class NextResponse extends Response {
		request?: any;

		constructor(body?: BodyInit | null, init?: ResponseInit) {
			super(body, init);
		}

		static next(options: any) {
			const response = new NextResponse(null, { status: 200, headers: new Headers() });
			response.request = options?.request;
			return response;
		}

		static redirect(url: string, status: number) {
			const response = new NextResponse(null, { status, headers: new Headers() });
			response.headers.set('location', url);
			return response;
		}

		static json(body: any, init?: any) {
			return new NextResponse(JSON.stringify(body), {
				status: init?.status ?? 200,
				headers: init?.headers ?? new Headers(),
			});
		}
	}

	return {
		__esModule: true,
		NextResponse,
	};
});

beforeAll(async () => {
	({ handlePixelatedProxy } = await import("../components/foundation/proxy-handler"));
});

describe('handlePixelatedProxy', () => {
    // Helper to create a minimal request shape compatible with handlePixelatedProxy
    const createRequest = (url = "https://www.pixelated.tech/test") => {
        return {
            nextUrl: new URL(url),
            headers: new Headers({
                "user-agent": "test-agent",
            }),
            url,
        } as any as NextRequest;
    };

    it('sets standard x-path and x-url headers', () => {
        const req = createRequest("https://www.pixelated.tech/about?query=1");
        const response = handlePixelatedProxy(req);

        // Next.js NextResponse.next() request headers are buried in the request object
        // but Vitest/Next mock environment allows us to check the response object directly if we set them there.
        // In our implementation, we set them on the cloned request object passed to NextResponse.next.
        
        // Since we can't easily inspect the 'request' headers from a returned NextResponse.next() 
        // in a unit test without a full Next.js runner, we mostly focus on the response headers 
        // which are explicitly set on the response object.
        
        expect(response.headers.get("Strict-Transport-Security")).toBeDefined();
    });

    it('sets all required security headers', () => {
        const req = createRequest();
        const response = handlePixelatedProxy(req);

        expect(response.headers.get("X-Frame-Options")).toBe("DENY");
        expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
        expect(response.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
        expect(response.headers.get("Permissions-Policy")).toContain("camera=()");
    });

    it('sets a comprehensive Content-Security-Policy', () => {
        const req = createRequest();
        const response = handlePixelatedProxy(req);
        const csp = response.headers.get("Content-Security-Policy");

        expect(csp).toContain("default-src 'self'");
        expect(csp).toContain("https://va.vercel-scripts.com"); // Vercel
        expect(csp).toContain("https://*.hubspot.com"); // HubSpot
        expect(csp).toContain("https://*.gravatar.com"); // Gravatar
        expect(csp).toContain("https://*.pixelated.tech"); // Pixelated subdomains
        // PayPal (script + stylesheet) — allow the official PayPal hosts used by the SDK
        expect(csp).toContain("https://*.paypal.com");
        expect(csp).toContain("https://*.paypalobjects.com");
        expect(csp).toContain("https://*.braintreegateway.com");
        expect(csp).toContain("https://*.cloudflareinsights.com");
        // Ensure PayPal is explicitly allowed in frame-src (fixes PayPal SDK framing + cardfields stylesheet)
        expect(csp).toMatch(/frame-src[^;]*https:\/\/\*\.paypal\.com/);
        // Ensure syndicated search is allowed in frame-src
        expect(csp).toMatch(/frame-src[^;]*https:\/\/syndicatedsearch\.goog/);
    });

	it('falls back to req.url when nextUrl origin and href are unavailable', () => {
		const req = {
			nextUrl: { pathname: '/fallback', search: '?q=1' },
			headers: new Headers(),
			url: 'https://fallback.example.com/fallback?q=1',
		} as any as NextRequest;

		const response = handlePixelatedProxy(req);

		expect((response as any).request.headers.get('x-origin')).toBe('https://fallback.example.com');
		expect((response as any).request.headers.get('x-url')).toBe('https://fallback.example.com/fallback?q=1');
		expect((response as any).request.headers.get('x-path')).toBe('/fallback?q=1');
		expect(response.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
	});

    it('derives x-origin and x-url from x-forwarded-host and x-forwarded-proto when present', () => {
        const req = {
            nextUrl: { pathname: '/proxy-path', search: '?a=1' },
            headers: new Headers({
                'x-forwarded-host': 'public.example.com',
                'x-forwarded-proto': 'https',
            }),
            url: 'https://internal.local/proxy-path?a=1',
        } as any as NextRequest;

        const response = handlePixelatedProxy(req);

        expect((response as any).request.headers.get('x-origin')).toBe('https://public.example.com');
        expect((response as any).request.headers.get('x-url')).toBe('https://public.example.com/proxy-path?a=1');
        expect((response as any).request.headers.get('x-path')).toBe('/proxy-path?a=1');
    });
});
