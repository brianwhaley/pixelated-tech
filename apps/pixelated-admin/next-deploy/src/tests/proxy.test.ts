import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

const mockHandlePixelatedProxy = vi.fn((_req: any) => new NextResponse('proxied', { status: 200 }));

vi.mock('@pixelated-tech/components/server', () => ({
	handlePixelatedProxy: (...args: any[]) => mockHandlePixelatedProxy(...args),
}));

import { proxy } from '@/proxy';

function makeRequest(pathname: string, options: { ip?: string; origin?: string; href?: string; search?: string } = {}) {
	const origin = options.origin ?? 'https://example.com';
	const search = options.search ?? '';
	const href = options.href ?? `${origin}${pathname}${search}`;
	const headers = new Headers();
	if (options.ip) headers.set('x-real-ip', options.ip);
	return {
		nextUrl: { pathname, search, origin, href },
		headers,
		url: href,
	} as any;
}

describe('proxy branch coverage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('rate limits repeated auth/login requests', async () => {
		const req = makeRequest('/login', { ip: '1.2.3.4', search: '?a=1' });
		for (let i = 0; i < 10; i += 1) {
			const response = proxy(req);
			expect(response.status).toBe(200);
			expect(await response.text()).toBe('proxied');
		}

		const response = proxy(req);
		expect(response.status).toBe(429);
		expect(await response.text()).toBe('Too many requests');
	});

	it('falls back to req.url when nextUrl origin and href are unavailable', async () => {
		const req = {
			nextUrl: { pathname: '/home', search: '', origin: undefined, href: undefined },
			headers: new Headers(),
			url: 'https://example.com/home',
		} as any;
		const response = proxy(req);
		expect(response.status).toBe(200);
		expect(mockHandlePixelatedProxy).toHaveBeenCalled();
		expect(await response.text()).toBe('proxied');
	});
});
