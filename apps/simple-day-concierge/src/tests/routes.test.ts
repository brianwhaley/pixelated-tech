import { describe, expect, it, vi } from 'vitest';
import siteConfig from '@/app/data/siteconfig.json';

vi.mock('next/server', () => ({
	NextResponse: {
		next: vi.fn((options: any) => options),
	},
}));

import { proxy } from '@/proxy';

describe('pixelated-template route data', () => {
	it('defines a valid siteInfo block', () => {
		expect(siteConfig.siteInfo).toBeDefined();
		expect(siteConfig.siteInfo.name).toContain('Simple Day Concierge');
		expect(siteConfig.siteInfo.url).toContain('https://www.simpledayconcierge.com');
	});

	it('contains an About route and unique path values', () => {
		const paths = siteConfig.routes.map((route) => route.path);
		expect(paths).toContain('/about');
		expect(new Set(paths).size).toBe(paths.length);
	});
});

describe('proxy middleware', () => {
	it('sets expected headers including x-path, x-origin, and x-url', () => {
		const mockUrl = 'https://example.com/test?query=1';
		const mockReq: any = {
			url: mockUrl,
			nextUrl: {
				pathname: '/test',
				search: '?query=1',
				origin: 'https://example.com',
				href: mockUrl,
			},
			headers: new Headers({ 'user-agent': 'test' }),
		};

		const result = proxy(mockReq);
		// In the mock environment, NextResponse.next() implementation in vitest might differ
		// than what we expect. Let's look at how we mock NextResponse in branch-coverage.test.tsx if any
		// or if we rely on the implementation in proxy.ts
		const requestHeaders = (result as any).request.headers;
		
		expect(requestHeaders.get('x-path')).toBe('/test?query=1');
		expect(requestHeaders.get('x-origin')).toBe('https://example.com');
		expect(requestHeaders.get('x-url')).toBe(mockUrl);
	});

	it('handles missing nextUrl properties by falling back to URL constructor', () => {
		const mockUrl = 'https://fallback.com/page';
		const mockReq: any = {
			url: mockUrl,
			nextUrl: {
				pathname: '/page',
				// search and origin missing
			},
			headers: new Headers(),
		};

		const result = proxy(mockReq);
		const requestHeaders = (result as any).request.headers;
		
		expect(requestHeaders.get('x-path')).toBe('/page');
		expect(requestHeaders.get('x-origin')).toBe('https://fallback.com');
		expect(requestHeaders.get('x-url')).toBe(mockUrl);
	});
});

