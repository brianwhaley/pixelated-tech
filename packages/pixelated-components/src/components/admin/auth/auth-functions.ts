import { type AuthorizationConfig, getAuthorizedRoutesByID } from './authorization';
import { normalizePath } from '../../foundation/utilities';

type AdminRoute = {
  path?: string;
  [key: string]: unknown;
};

export function normalizeRoutePath(value: string | undefined | null): string {
	return normalizePath(value);
}

export function getAllowedAdminRoutes(
	email: string | undefined | null,
	routes: AdminRoute[] = [],
	config?: AuthorizationConfig
): AdminRoute[] {
	const allowedRoutes = getAuthorizedRoutesByID(email, config);
	return routes.filter(route => {
		if (!route?.path || typeof route.path !== 'string') return false;
		const path = normalizePath(route.path);
		if (path === '/login') return false;
		return allowedRoutes.includes(path);
	});
}

export function getAuthorizedRoutePaths(
	email: string | undefined | null,
	config?: AuthorizationConfig
): string[] {
	return getAuthorizedRoutesByID(email, config);
}
