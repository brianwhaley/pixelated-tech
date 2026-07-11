import type { RouteType, SiteInfoType } from '../config/config.types';

export function getPolicyRouteUrl(routes: RouteType[] | RouteType | undefined, siteInfo: SiteInfoType | undefined): string | undefined {
	const candidates: string[] = [];

	function normalizePath(path?: string): string | undefined {
		if (!path) return undefined;
		return path.trim().toLowerCase().replace(/\s+/g, '-').replace(/\/+/g, '/');
	}

	function isPolicyRoute(route: RouteType): boolean {
		const name = route.name?.toLowerCase() ?? '';
		const title = route.title?.toLowerCase() ?? '';
		const description = route.description?.toLowerCase() ?? '';
		const path = normalizePath(route.path) ?? '';

		if (!route.path) {
			return false;
		}

		const keywordMatches = [
			'/returns',
			'/return-policy',
			'/refund',
			'/refund-policy',
			'/shipping-policy',
			'/shipping',
			'/terms',
			'/policy',
		];

		if (keywordMatches.some((keyword) => path.includes(keyword))) {
			return true;
		}

		const combined = `${name} ${title} ${description}`;
		if (keywordMatches.some((keyword) => combined.includes(keyword.replace('/', '')))) {
			return true;
		}

		return false;
	}

	function traverse(route: RouteType | RouteType[]) {
		if (!route) return;
		if (Array.isArray(route)) {
			route.forEach(traverse);
			return;
		}
		if (isPolicyRoute(route) && route.path) {
			const path = route.path.trim();
			candidates.push(path);
		}
		if (route.routes) {
			traverse(route.routes);
		}
	}

	traverse(routes || []);

	if (candidates.length > 0) {
		const baseUrl = siteInfo?.url?.replace(/\/$/, '') ?? '';
		const first = candidates[0];
		return first.startsWith('http') ? first : `${baseUrl}${first.startsWith('/') ? '' : '/'}${first}`;
	}

	return undefined;
}
