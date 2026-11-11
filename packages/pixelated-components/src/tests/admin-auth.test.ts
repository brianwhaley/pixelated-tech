import { describe, it, expect } from 'vitest';
import { getAuthorizedRoutesByID, isRouteAllowedForID } from '../components/admin/auth/authorization';
import {
  getAllowedAdminRoutes,
  getAuthorizedRoutePaths,
  normalizeRoutePath,
} from '../components/admin/auth/auth-functions';

const authorizationConfig = {
  authorizedUsers: {
    'brian@pixelated.tech': {
      routes: ['/', '/billing', '/site-health'],
    },
  },
};

describe('shared admin auth helpers', () => {
  it('normalizes route paths and empty values', () => {
    expect(normalizeRoutePath('/billing/?section=plans#details')).toBe('/billing');
    expect(normalizeRoutePath(null)).toBe('/');
    expect(normalizeRoutePath(undefined)).toBe('/');
  });

  it('returns normalized authorized routes', () => {
    const routes = getAuthorizedRoutesByID('brian@pixelated.tech', authorizationConfig as any);
    expect(routes).toEqual(['/', '/billing', '/site-health']);
    expect(getAuthorizedRoutePaths('brian@pixelated.tech', authorizationConfig as any)).toEqual([
      '/',
      '/billing',
      '/site-health',
    ]);
  });

  it('allows normalized paths with query and hash params', () => {
    expect(isRouteAllowedForID('brian@pixelated.tech', '/billing/', authorizationConfig as any)).toBe(true);
    expect(isRouteAllowedForID('brian@pixelated.tech', '/billing?x=1', authorizationConfig as any)).toBe(true);
    expect(isRouteAllowedForID('brian@pixelated.tech', '/billing#top', authorizationConfig as any)).toBe(true);
  });

  it('filters nav routes to only authorized pages', () => {
    const routes = [
      { path: '/' },
      { path: '/login' },
      { path: '/billing' },
      { path: '/site-health' },
      { path: '/hidden' },
      {},
      { path: null },
      { path: 42 },
    ];
    const allowed = getAllowedAdminRoutes('brian@pixelated.tech', routes as any, authorizationConfig as any);
    expect(allowed.map(route => route.path)).toEqual(['/', '/billing', '/site-health']);
  });

  it('returns false for unknown users', () => {
    expect(isRouteAllowedForID('unknown@example.com', '/', authorizationConfig as any)).toBe(false);
  });
});
