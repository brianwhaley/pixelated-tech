'use strict';

import type { ServiceCardType } from './services.components';
import type { SiteInfoType } from '../config/config.types';
import { contentfulValueToSlug } from '../integrations/contentful.delivery';

export const defaultServicePathPrefix = '/services';

type ServiceType = ServiceCardType['service'];

export function normalizePathPrefix(prefix?: string | null, fallback = defaultServicePathPrefix) {
	if (prefix == null || typeof prefix !== 'string') return fallback;
	const trimmed = prefix.trim();
	if (trimmed === '') return prefix === '' ? '' : fallback;
	if (trimmed === '/' || trimmed === '.' || trimmed === './') return '';
	const cleaned = trimmed.replace(/^\/+/, '').replace(/\/+$/, '');
	return cleaned ? `/${cleaned}` : '';
}

export function getServicePathPrefix(siteInfo?: any | null, explicitPrefix?: string | null) {
	if (typeof explicitPrefix === 'string') {
		return normalizePathPrefix(explicitPrefix, '');
	}
	return normalizePathPrefix(siteInfo?.servicesPathPrefix, defaultServicePathPrefix);
}

export function buildServiceUrl(service: ServiceType, prefix?: string | null) {
	const resolvedPrefix = normalizePathPrefix(prefix);
	const slug = contentfulValueToSlug({ value: service?.name ?? '' });
	return slug ? `${resolvedPrefix}/${slug}` : resolvedPrefix;
}

export function resolveServices(props: { services?: Array<ServiceType | null | undefined> | null; siteInfo?: { services?: Array<ServiceType | null | undefined> | null } | null }) {
	const candidates = props.services ?? props.siteInfo?.services ?? [];
	return candidates.filter((service): service is ServiceType => Boolean(service));
}

export function findServiceBySlug(serviceSlug: string, siteInfo?: { services?: Array<ServiceType | null | undefined> | null } | null) {
	const slug = serviceSlug?.trim() || '';
	if (!slug) return undefined;
	const services = siteInfo?.services || [];
	return services.find((service) => {
		const candidateSlug = contentfulValueToSlug({ value: service?.name ?? '' });
		return candidateSlug === slug;
	});
}
