import { describe, it, expect } from 'vitest';
import { getPolicyRouteUrl } from '../components/foundation/schema.functions';

describe('schema.functions', () => {
	it('should return the first matching policy route URL with siteInfo.url prefix', () => {
		const routes = [
			{ path: '/about', name: 'About' },
			{ path: '/returns', name: 'Returns' },
			{ path: '/contact', name: 'Contact' }
		];
		const siteInfo = { url: 'https://example.com' } as any;
		const result = getPolicyRouteUrl(routes, siteInfo);
		expect(result).toBe('https://example.com/returns');
	});

	it('should return an absolute URL if route path is already fully qualified', () => {
		const routes = [{ path: 'https://example.com/return-policy', name: 'Return Policy' }];
		const siteInfo = { url: 'https://example.com' } as any;
		const result = getPolicyRouteUrl(routes, siteInfo);
		expect(result).toBe('https://example.com/return-policy');
	});

	it('should return undefined when no policy route exists', () => {
		const routes = [{ path: '/home', name: 'Home' }];
		const siteInfo = { url: 'https://example.com' } as any;
		const result = getPolicyRouteUrl(routes, siteInfo);
		expect(result).toBeUndefined();
	});

	it('should traverse nested route structures and find policy routes', () => {
		const routes = [
			{ path: '/home', name: 'Home' },
			{ path: '/info', name: 'Info', routes: [{ path: '/refund', name: 'Refunds' }] }
		];
		const siteInfo = { url: 'https://example.com' } as any;
		const result = getPolicyRouteUrl(routes, siteInfo);
		expect(result).toBe('https://example.com/refund');
	});
});
