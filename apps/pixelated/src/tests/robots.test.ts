import { beforeEach, describe, expect, it, vi } from 'vitest';

const getHeader = vi.hoisted(() => vi.fn());

vi.mock('next/headers', () => ({
	headers: vi.fn(async () => ({ get: getHeader })),
}));

import robots from '@/app/robots';

describe('robots metadata', () => {
	beforeEach(() => {
		getHeader.mockReset();
	});

	it('disallows crawling on localhost', async () => {
		getHeader.mockReturnValue('localhost:3004');
		expect(await robots()).toMatchObject({ rules: { userAgent: '*', disallow: '/' } });
	});

	it('disallows crawling on the development host', async () => {
		getHeader.mockReturnValue('dev.pixelated.tech');
		expect(await robots()).toMatchObject({ rules: { userAgent: '*', disallow: '/' } });
	});

	it('allows crawling and exposes the production sitemap', async () => {
		getHeader.mockReturnValue('www.pixelated.tech');
		expect(await robots()).toEqual({
			rules: { userAgent: '*', allow: '/' },
			sitemap: 'https://www.pixelated.tech/sitemap.xml',
		});
	});
});
