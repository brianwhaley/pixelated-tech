import { createHmac, timingSafeEqual } from 'node:crypto';
import { decode } from 'html-entities';
import { CacheManager } from '../foundation/cache-manager';
import { getDomain } from '../foundation/utilities';
import { smartFetch } from '../foundation/smartfetch';
import type { BlogPostType, WordPressBlogLink } from './wordpress.functions';

const feedCacheTTL = 1000 * 60 * 60 * 24 * 7;
const feedCache = new CacheManager({ mode: 'local', ttl: feedCacheTTL, domain: getDomain(), namespace: 'wp-feed' });

export function verifyWordPressWebhookSignature(payload: string, signature: string | null, secret: string): boolean {
	if (!signature || !secret) return false;
	const expected = createHmac('sha256', secret).update(payload).digest('hex');
	const received = signature.replace(/^sha256=/, '').trim();
	if (!/^[a-f0-9]{64}$/i.test(received)) return false;
	return timingSafeEqual(Buffer.from(received, 'hex'), Buffer.from(expected, 'hex'));
}

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

export async function getWordPressPost(options: {
	site: string;
	postId?: string;
	postUrl?: string;
	baseURL?: string;
}): Promise<BlogPostType | null> {
	const site = options.site.trim();
	if (!site || (!options.postId && !options.postUrl)) return null;
	const baseURL = options.baseURL || 'https://public-api.wordpress.com/rest/v1/sites/';
	let identifier = options.postId?.trim();
	if (!identifier && options.postUrl) {
		try {
			const pathname = new URL(options.postUrl).pathname.replace(/\/+$/, '');
			identifier = pathname.split('/').filter(Boolean).pop();
		} catch {
			return null;
		}
	}
	if (!identifier) return null;

	const apiUrl = new URL(`${site}/posts/${options.postId ? identifier : `slug:${identifier}`}`, baseURL.endsWith('/') ? baseURL : `${baseURL}/`);
	try {
		const post = await smartFetch(apiUrl.toString(), {
			responseType: 'json',
			timeout: 30000,
		});
		if (!post || typeof post !== 'object' || (typeof post.ID !== 'string' && typeof post.ID !== 'number')) return null;
		return { ...post, ID: String(post.ID) } as BlogPostType;
	} catch (error) {
		console.error('Error fetching WordPress post:', error);
		return null;
	}
}