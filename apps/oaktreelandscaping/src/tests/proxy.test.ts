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
	it('returns a NextResponse object', () => {
		const response = proxy(createMockRequest());
		expect(response).toBeTruthy();
	});
});
