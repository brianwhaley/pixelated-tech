import { normalizePath } from '../../foundation/utilities';

export type AuthorizedUser = {
  routes?: string[];
};

export type AuthorizationConfig = {
  authorizedUsers?: Record<string, AuthorizedUser>;
};

function getUserConfig(email: string | undefined | null, config?: AuthorizationConfig): AuthorizedUser | undefined {
	if (!email || !config) return undefined;
	const key = email.toLowerCase().trim();
	return config.authorizedUsers?.[key];
}

export function getAuthorizedRoutesByID(email: string | undefined | null, config?: AuthorizationConfig): string[] {
	const userConfig = getUserConfig(email, config);
	if (!userConfig?.routes || !Array.isArray(userConfig.routes)) {
		return [];
	}
	return userConfig.routes.map(normalizePath);
}

export function isRouteAllowedForID(
	email: string | undefined | null,
	pathname: string | undefined | null,
	config?: AuthorizationConfig
): boolean {
	if (!email || !pathname) return false;
	const normalizedPath = normalizePath(pathname);
	const allowedRoutes = getAuthorizedRoutesByID(email, config);
	return allowedRoutes.includes(normalizedPath);
}
