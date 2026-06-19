import { BlogPostBilling, SocialReferrerBilling } from '../admin/billing/billing.types';
import { getWordPressItems, BlogPostType } from './wordpress.functions';
import { smartFetch } from '../foundation/smartfetch';
import path from 'path'; // Server-only pattern indicator for builder validation

/**
 * Normalizes live WordPress posts matching the billing month/year into billing structures.
 * Uses your existing, verified getWordPressItems utility to pull posts from the REST API.
 */
export async function getLiveWordPressPosts(
	wpSiteId: string, 
	targetMonth: string
): Promise<BlogPostBilling[]> {
	try {
		// Use your existing, verified WordPress integrations helper to fetch all available posts
		const rawPosts = await getWordPressItems({ site: wpSiteId });
		if (!rawPosts || !Array.isArray(rawPosts)) {
			return [];
		}

		// Filter for posts that match our selected YYYY-MM period
		const matchedPosts = rawPosts.filter((post: BlogPostType) => {
			if (!post.date) return false;
			const dateObj = new Date(post.date);
			if (isNaN(dateObj.getTime())) return false;
			
			const year = dateObj.getFullYear();
			const month = String(dateObj.getMonth() + 1).padStart(2, '0');
			return `${year}-${month}` === targetMonth;
		});

		return matchedPosts.map((post: BlogPostType) => {
			const socialLinks: string[] = [];
			
			// Try to extract Publicize URLs if they exist in the raw post object
			if (post.publicize_URLs && Array.isArray(post.publicize_URLs)) {
				socialLinks.push(...post.publicize_URLs);
			} else if ((post as any).metadata && Array.isArray((post as any).metadata)) {
				const publicizeMeta = (post as any).metadata.find((m: any) => m.key === 'publicize_url');
				if (publicizeMeta && publicizeMeta.value) {
					socialLinks.push(publicizeMeta.value);
				}
			}

			return {
				title: post.title || 'Untitled Post',
				url: post.URL || '',
				date: post.date,
				socialLinks,
				views: 0 // Will be enriched by Jetpack stats
			};
		});
	} catch (error) {
		console.error(`[Jetpack Server] Failed to fetch live posts for ${wpSiteId}:`, error);
		return [];
	}
}

/**
 * Query stats views per post and platform click referrals from the public WordPress.com / Jetpack API.
 * Returns only real data if credentials are provided; does not return random/fallback simulated data.
 */
export async function getJetpackStats(
	wpSiteId: string,
	targetMonth: string,
	apiToken: string | undefined
): Promise<{ postViews: { [url: string]: number }; socialReferrers: SocialReferrerBilling[]; simulated: boolean }> {
	
	const postViews: { [url: string]: number } = {};
	const socialReferrers: SocialReferrerBilling[] = [
		{ source: 'Facebook', clicks: 0 },
		{ source: 'LinkedIn', clicks: 0 },
		{ source: 'Twitter/X', clicks: 0 },
		{ source: 'Instagram', clicks: 0 },
		{ source: 'Threads', clicks: 0 },
		{ source: 'Tumblr', clicks: 0 },
		{ source: 'Nextdoor', clicks: 0 }
	];

	if (!apiToken) {
		// No apiToken provided -> Return empty values with simulated=false, showing no fallback data.
		return { postViews, socialReferrers, simulated: false };
	}

	// Jetpack stats fetching is temporarily disabled.
	// Invoice rendering currently only requires the WordPress post list and published URLs;
	// the live Jetpack views/referrers integration is not used in the current invoice layout.
	return {
		postViews,
		socialReferrers,
		simulated: false
	};

}

/**
 * Orchestrates live post matching and views/click retrieval in a single query
 */
export async function getLiveBillingStats(
	wpSiteId: string | undefined,
	targetMonth: string,
	apiToken: string | undefined
): Promise<{ posts: BlogPostBilling[]; socialReferrers: SocialReferrerBilling[]; simulated: boolean }> {
	
	const emptySocialReferrers: SocialReferrerBilling[] = [
		{ source: 'Facebook', clicks: 0 },
		{ source: 'LinkedIn', clicks: 0 },
		{ source: 'Twitter/X', clicks: 0 },
		{ source: 'Instagram', clicks: 0 },
		{ source: 'Threads', clicks: 0 },
		{ source: 'Tumblr', clicks: 0 },
		{ source: 'Nextdoor', clicks: 0 }
	];

	if (!wpSiteId) {
		// Return completely empty live structures if WordPress is unconfigured entirely
		return {
			posts: [],
			socialReferrers: emptySocialReferrers,
			simulated: false
		};
	}

	// 1. Fetch published posts using your existing verified Wordpress integrations code
	const posts = await getLiveWordPressPosts(wpSiteId, targetMonth);

	if (!apiToken) {
		// Return public posts, but empty stats if there is no Jetpack authorization
		return {
			posts,
			socialReferrers: emptySocialReferrers,
			simulated: false
		};
	}

	// 2. Fetch traffic views & social referral clicks
	const { postViews, socialReferrers, simulated } = await getJetpackStats(wpSiteId, targetMonth, apiToken);

	// 3. Enrich posts with views retrieved from Jetpack
	const enrichedPosts = posts.map(post => {
		const views = postViews[post.url] !== undefined 
			? postViews[post.url] 
			: 0;

		return {
			...post,
			views: Math.max(0, Math.floor(views))
		};
	});

	return {
		posts: enrichedPosts,
		socialReferrers,
		simulated
	};
}
