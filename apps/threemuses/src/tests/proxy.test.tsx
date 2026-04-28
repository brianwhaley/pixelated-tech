import { describe, expect, it, vi } from 'vitest';

vi.mock('next/server', () => ({
	NextResponse: {
		next: (options: any) => options,
	},
}));

import { proxy } from '@/proxy';

describe('proxy middleware', () => {
	it('adds x-path and x-origin headers when nextUrl values are present', () => {
		const result = proxy({
			nextUrl: { pathname: '/test', search: '?a=1', origin: 'https://example.com', href: 'https://example.com/test?a=1' },
			headers: new Headers({}),
			url: 'https://example.com/test?a=1',
		} as any);

		expect(result.request.headers.get('x-path')).toBe('/test?a=1');
		expect(result.request.headers.get('x-origin')).toBe('https://example.com');
	});

	it('falls back to req.url origin when nextUrl.origin is undefined', () => {
		const result = proxy({
			nextUrl: { pathname: '/test', search: undefined, origin: undefined, href: undefined },
			headers: new Headers({}),
			url: 'https://example.com/test',
		} as any);

		expect(result.request.headers.get('x-path')).toBe('/test');
		expect(result.request.headers.get('x-origin')).toBe('https://example.com');
	});

	it('uses nextUrl.href fallback when req.url is undefined', () => {
		const result = proxy({
			nextUrl: { pathname: '/test', search: '', origin: 'https://example.com', href: 'https://example.com/test?foo=1' },
			headers: new Headers({}),
			url: undefined,
		} as any);

		expect(result.request.headers.get('x-path')).toBe('/test');
		expect(result.request.headers.get('x-origin')).toBe('https://example.com');
	});

	it('uses nextUrl.href fallback when req.url is undefined', () => {
		const result = proxy({
			nextUrl: { pathname: '/test', search: '', origin: 'https://example.com', href: 'https://example.com/test?foo=1' },
			headers: new Headers({}),
			url: undefined,
		} as any);

		expect(result.request.headers.get('x-path')).toBe('/test');
		expect(result.request.headers.get('x-origin')).toBe('https://example.com');
	});
});
