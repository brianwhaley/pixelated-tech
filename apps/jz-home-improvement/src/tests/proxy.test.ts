import { describe, expect, it } from 'vitest';
import { proxy } from '@/proxy';

const createMockRequest = () => {
	const headers = new Headers([['accept', 'text/html']]);
	return {
		nextUrl: {
			pathname: '/test',
			search: '?a=1',
			origin: 'http://localhost',
			href: 'http://localhost/test?a=1',
		},
		url: 'http://localhost/test?a=1',
		headers,
	} as any;
};

describe('proxy helper', () => {
	it('returns a NextResponse with proxy headers', () => {
		const req = createMockRequest();
		const response = proxy(req);
		expect(response).toBeTruthy();
	});

	it('falls back to the request URL origin when nextUrl origin is missing', () => {
		const req = {
			nextUrl: {
				pathname: '/fallback',
				search: '',
				origin: undefined,
				href: undefined,
			},
			url: 'http://localhost/fallback',
			headers: new Headers(),
		} as any;
		const response = proxy(req);
		expect(response).toBeTruthy();
	});
});
