import { describe, it, expect } from 'vitest';
import { getAuthorizedRoutesByID, isRouteAllowedForID, getAllowedAdminRoutes } from '@pixelated-tech/components/adminclient';

const authorizationConfig = {
	authorizedUsers: {
		'brian@pixelated.tech': {
			routes: ['/', '/billing/monthly', '/billing/adhoc', '/site-health'],
		},
	},
};

describe('authorization helper', () => {
	it('returns authorized routes for a known email', () => {
		const routes = getAuthorizedRoutesByID('brian@pixelated.tech', authorizationConfig as any);
		expect(routes).toContain('/');
		expect(routes).toContain('/billing/monthly');
		expect(routes).toContain('/billing/adhoc');
		expect(routes).toContain('/site-health');
	});

	it('normalizes route paths when checking authorization', () => {
		expect(isRouteAllowedForID('brian@pixelated.tech', '/billing/monthly/', authorizationConfig as any)).toBe(true);
		expect(isRouteAllowedForID('brian@pixelated.tech', '/billing/adhoc?x=1', authorizationConfig as any)).toBe(true);
	});

	it('filters nav routes with getAllowedAdminRoutes', () => {
		const routes = [
			{ path: '/' },
			{ path: '/login' },
			{ path: '/billing/monthly' },
			{ path: '/billing/adhoc' },
			{ path: '/site-health' },
			{ path: '/hidden' },
		];
		const allowed = getAllowedAdminRoutes('brian@pixelated.tech', routes as any, authorizationConfig as any);
		expect(allowed.map(route => route.path)).toEqual(['/', '/billing/monthly', '/billing/adhoc', '/site-health']);
	});

	it('returns false for unknown or unauthorized users', () => {
		expect(getAuthorizedRoutesByID('unknown@example.com')).toEqual([]);
		expect(isRouteAllowedForID('unknown@example.com', '/')).toBe(false);
		expect(isRouteAllowedForID('brian@pixelated.tech', '/does-not-exist')).toBe(false);
	});
});
