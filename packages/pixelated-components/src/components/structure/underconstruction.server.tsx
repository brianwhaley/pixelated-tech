'use server';

import { headers } from 'next/headers';
import { getFullPixelatedConfig } from '../config/config';

function normalizeHost(host: string): string {
	const trimmed = String(host || '').trim().toLowerCase();
	if (!trimmed) {
		return '';
	}

	const withoutPort = trimmed.replace(/:\d+$/u, '');
	if (withoutPort.startsWith('[') && withoutPort.includes(']')) {
		return withoutPort.split(']')[0].replace(/\[|\]/gu, '');
	}

	return withoutPort;
}

export async function isUnderConstruction(): Promise<boolean> {
	const envValue = process.env.UNDER_CONSTRUCTION;
	if (String(envValue || '').trim().toLowerCase() !== 'true') {
		return false;
	}

	const hostHeader = (await headers()).get('host') || '';
	const requestHost = normalizeHost(hostHeader);
	if (!requestHost) {
		return false;
	}

	if (
		requestHost === 'localhost' ||
		requestHost === '127.0.0.1' ||
		requestHost.startsWith('localhost') ||
		requestHost.includes('amplifyapp.com')
	) {
		return false;
	}

	const pixelatedConfig = getFullPixelatedConfig() as any;
	const siteUrl = String(pixelatedConfig?.siteInfo?.url || '').trim();
	if (!siteUrl) {
		return false;
	}

	let configHost = '';
	try {
		configHost = new URL(siteUrl).hostname.toLowerCase();
	} catch {
		configHost = normalizeHost(siteUrl);
	}

	return requestHost === configHost;
}
