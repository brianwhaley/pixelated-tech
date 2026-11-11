import { type AuthorizationConfig, getAuthorizedRoutesByID } from './authorization';
import { normalizePath } from '../../foundation/utilities';

type AdminRoute = {
  path?: string;
  [key: string]: unknown;
};

const debug = false;

export function normalizeRoutePath(value: string | undefined | null): string {
	return normalizePath(value);
}

export function getAllowedAdminRoutes(
	email: string | undefined | null,
	routes: AdminRoute[] = [],
	config?: AuthorizationConfig
): AdminRoute[] {
	const allowedRoutes = getAuthorizedRoutesByID(email, config);
	if (debug) {
		console.log('[Admin Authorization] input', {
			email,
			routeCount: routes.length,
			routePaths: routes.map(route => route?.path),
			authorizedRoutePaths: allowedRoutes,
		});
	}
	const filteredRoutes = routes.filter(route => {
		if (!route?.path || typeof route.path !== 'string') return false;
		const path = normalizePath(route.path);
		if (path === '/login') return false;
		return allowedRoutes.includes(path);
	});
	if (debug) {
		console.log('[Admin Authorization] output', {
			allowedRouteCount: filteredRoutes.length,
			allowedRoutePaths: filteredRoutes.map(route => route.path),
		});
	}
	return filteredRoutes;
}

export function getAuthorizedRoutePaths(
	email: string | undefined | null,
	config?: AuthorizationConfig
): string[] {
	return getAuthorizedRoutesByID(email, config);
}
