"use server";

import { decode } from 'html-entities';
import { CacheManager } from '../foundation/cache-manager';
import { getDomain } from '../foundation/utilities';
import { smartFetch } from '../foundation/smartfetch';
import type { WordPressBlogLink } from './wordpress.functions';

const feedCacheTTL = 1000 * 60 * 60 * 24 * 7;
const feedCache = new CacheManager({ mode: 'local', ttl: feedCacheTTL, domain: getDomain(), namespace: 'wp-feed' });

/**
 * Fetch the most recent published post links from a WordPress RSS or Atom feed.
 * Results are cached for one week so a generation run and later requests reuse
 * the same small, exact URL catalog.
 */
export async function getWordPressFeedLinks(feedUrl: string, count = 100): Promise<WordPressBlogLink[]> {
	const normalizedFeedUrl = feedUrl.trim();
	if (!normalizedFeedUrl || count <= 0) return [];
	let apiUrl: URL;
	try {
		apiUrl = new URL('/wp-json/wp/v2/posts', new URL(normalizedFeedUrl).origin);
		apiUrl.searchParams.set('per_page', String(Math.min(count, 100)));
		apiUrl.searchParams.set('_fields', 'title,link');
	} catch {
		return [];
	}
	const apiUrlString = apiUrl.toString();
	const cacheKey = `links-${encodeURIComponent(apiUrlString)}`;
	const cached = feedCache.get<WordPressBlogLink[]>(cacheKey);
	if (cached && cached.length > 0) return cached.slice(0, count);

	try {
		const data = await smartFetch(apiUrlString, {
			responseType: 'json',
			nextCache: { revalidate: feedCacheTTL / 1000 },
			timeout: 30000,
		});
		const links: WordPressBlogLink[] = [];
		const seenUrls = new Set<string>();

		for (const post of Array.isArray(data) ? data : []) {
			const title = decode(typeof post?.title?.rendered === 'string' ? post.title.rendered.trim() : '');
			const url = typeof post?.link === 'string' ? post.link.trim() : '';
			if (!title || !url) continue;
			try {
				if (!['http:', 'https:'].includes(new URL(url).protocol) || seenUrls.has(url)) continue;
				seenUrls.add(url);
				links.push({ title, url });
				if (links.length >= count) break;
			} catch {
				continue;
			}
		}

		if (links.length > 0) feedCache.set(cacheKey, links);
		return links;
	} catch (error) {
		console.error('Error fetching WordPress feed links:', error);
		return [];
	}
}