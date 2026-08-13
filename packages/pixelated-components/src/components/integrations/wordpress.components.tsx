'use client';

import React, { useEffect, useState } from 'react';
import PropTypes, { InferProps } from 'prop-types';
import { usePixelatedConfig } from "../config/config.client";
import { SmartImage } from '../elements/smartimage';
import { PageGridItem } from '../structure/page-blocks';
import type { BlogPostType } from './wordpress.functions';
import type { SiteInfo } from '../config/config.types';
import { contentfulValueToSlug } from '../integrations/contentful.delivery';
import { getServicePathPrefix } from '../elements/services.functions';
import { getCachedWordPressItems, getWordPressCategories } from './wordpress.functions';
import { Loading, ToggleLoading } from '../foundation/loading';
import "./wordpress.css";
import { SchemaBlogPosting } from '../foundation/schema';
import { mapWordPressToBlogPosting } from '../integrations/wordpress.functions';
import { SmartErrorBoundary } from '../foundation/smarterrorboundary';

// https://microformats.org/wiki/h-entry

function decodeString(str: string) {
	const textarea = document.createElement('textarea');
	textarea.innerHTML = str;
	return textarea.value;
}







export function buildRelatedServiceReferences(post: BlogPostType, siteInfo?: SiteInfo | null) {
	if (!siteInfo?.services || !Array.isArray(siteInfo.services) || !siteInfo.url) {
		return [];
	}

	const baseUrl = siteInfo.url.replace(/\/$/, '');
	const prefix = getServicePathPrefix(siteInfo);
	const haystack = [
		post.title,
		post.excerpt,
		post.content,
		...(Array.isArray(post.categories) ? post.categories : []),
	].join(' ').toLowerCase();

	const matched = siteInfo.services
		.filter((service): service is NonNullable<typeof service> => service != null && typeof service.name === 'string')
		.map((service) => {
			const serviceName = String(service.name).trim();
			if (!serviceName) return null;
			const serviceSlug = contentfulValueToSlug({ value: serviceName });
			const serviceUrl = service.url
				? String(service.url)
				: serviceSlug
					? `${baseUrl}${prefix}/${serviceSlug}`
					: undefined;
			if (!serviceUrl) return null;
			if (haystack.includes(serviceName.toLowerCase())) {
				return { name: serviceName, url: serviceUrl };
			}
			return null;
		})
		.filter((item): item is { name: string; url: string } => Boolean(item));

	if (matched.length === 0) {
		return siteInfo.services
			.filter((service): service is NonNullable<typeof service> => service != null && typeof service.name === 'string')
			.map((service) => {
				const serviceName = String(service.name).trim();
				const serviceSlug = contentfulValueToSlug({ value: serviceName });
				const serviceUrl = service.url
					? String(service.url)
					: serviceSlug
						? `${baseUrl}${prefix}/${serviceSlug}`
						: undefined;
				return { name: serviceName, url: serviceUrl || '' };
			})
			.filter((item) => Boolean(item.url));
	}

	return matched;
}




/**
 * BlogPostList — Render a list of WordPress posts by fetching from the configured WordPress endpoint.
 *
 * @param {number} [props.count] - Maximum number of posts to fetch/display.
 * @param {boolean} [props.showCategories] - Whether to show category icons for each post.
 */
BlogPostList.propTypes = {
	/** Max number of posts to fetch/display */
	count: PropTypes.number,
	/** Show category icons next to posts */
	showCategories: PropTypes.bool,
};
export type BlogPostListType = InferProps<typeof BlogPostList.propTypes>;
export function BlogPostList(props: BlogPostListType) {

	const { count, showCategories = true } = props;
	const config = usePixelatedConfig();
	const site = config?.integrations?.wordpress?.site;
	const baseURL = config?.integrations?.wordpress?.baseURL;
	const [posts, setPosts] = useState<BlogPostType[]>([]);

	useEffect(() => {
		// If no site is configured, don't fetch
		if (!site) {
			console.warn('WordPress site not configured. Provide wordpress.site in config.');
			return;
		}

		// Fetch posts from WordPress using the cached helper
		ToggleLoading({ show: true });
		(async () => {
			try {
				const params: { site: string; count?: number; baseURL?: string } = { site };
				if (count !== null && count !== undefined) params.count = count;
				if (baseURL !== null && baseURL !== undefined) params.baseURL = baseURL;
				const data = (await getCachedWordPressItems(params)) ?? [];
				const sorted = data.sort((a: BlogPostType, b: BlogPostType) => ((a.date ?? '') < (b.date ?? '')) ? 1 : -1);
				setPosts(sorted);
			} catch (error) {
				console.error('Error fetching WordPress posts:', error);
				setPosts([]);
			} finally {
				ToggleLoading({ show: false });
			}
		})();
	}, [site, baseURL, count]);

	return (
		<SmartErrorBoundary boundaryName="BlogPostList">
			<Loading key="loading" />
			{posts.map((post: BlogPostType) => (
				<PageGridItem key={post.ID}>
					<SchemaBlogPosting
						key={post.ID}
						post={mapWordPressToBlogPosting(post, false, buildRelatedServiceReferences(post, config?.siteInfo))}
					/>
					<BlogPostSummary
						ID={post.ID}
						title={post.title}
						date={post.date}
						excerpt={post.excerpt}
						URL={post.URL}
						categories={post.categories}
						featured_image={post.featured_image}
						showCategories={showCategories}
					/>
				</PageGridItem>
			))}
		</SmartErrorBoundary>
	);
}



/**
 * BlogPostSummary — Render a compact summary card for a single WordPress post.
 *
 * @param {oneOfType} [props.ID] - Post ID (string or number).
 * @param {string} [props.title] - Post title.
 * @param {string} [props.date] - Post publish date (ISO string).
 * @param {string} [props.excerpt] - HTML excerpt to display as the summary.
 * @param {string} [props.URL] - Canonical URL for the post.
 * @param {object} [props.categories] - Categories object (keys -> category name) used to derive icons.
 * @param {string} [props.featured_image] - URL of the post's featured image.
 * @param {boolean} [props.showCategories] - Whether to render category icons beneath the summary.
 */
BlogPostSummary.propTypes = {
	/** Post ID (string or number) */
	ID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	/** Post title */
	title: PropTypes.string,
	/** Post publish date (ISO string) */
	date: PropTypes.string,
	/** HTML excerpt */
	excerpt: PropTypes.string,
	/** Canonical URL for the post */
	URL: PropTypes.string,
	/** Categories object used for icons */
	categories: PropTypes.object,
	/** Featured image URL */
	featured_image: PropTypes.string,
	/** Show categories flag */
	showCategories: PropTypes.bool,
};
export type BlogPostSummaryType = InferProps<typeof BlogPostSummary.propTypes>;
export function BlogPostSummary(props: BlogPostSummaryType) {
	const myCategoryImages = props.categories ? Object.entries(props.categories).map(
		([category, index]) => [category?.trim().toLowerCase().replace(/[ /]+/g, '-'), index]
	).sort() : [];
	const config = usePixelatedConfig();
	const myExcerpt = props.excerpt ? decodeString(props.excerpt).replace(/\[…\]/g, '<a href="' + (props.URL || '') + '" target="_blank" rel="noopener noreferrer">[…]</a>') : '';
	return (
		<div className="blog-post-summary" key={props.ID}>
			<article className="h-entry">
				<h2 className="p-name">
					<a className="u-url blog-post-url" href={props.URL || ''} target="_blank" rel="noopener noreferrer">
						{props.title ? decodeString(props.title) : ''}
					</a>
				</h2>
				<div className="dt-published">Published: {props.date ? new Date(props.date).toLocaleDateString() : ''}</div>
				{props.featured_image ? (
					<div className="article-body row-12col">
						<div className="article-featured-image grid-s1-e4">
							<SmartImage className="u-photo" src={props.featured_image} alt={props.title ? decodeString(props.title) : ''} title={props.title ? decodeString(props.title) : ''}
								style={{}}
								cloudinaryEnv={config?.integrations?.cloudinary?.product_env ?? undefined}
								cloudinaryDomain={config?.integrations?.cloudinary?.baseUrl ?? undefined}
								cloudinaryTransforms={config?.integrations?.cloudinary?.transforms ?? undefined} />
						</div>
						<div className="article-excerpt grid-s4-e13">
							<div className="p-summary" dangerouslySetInnerHTML={{ __html: myExcerpt }} />
						</div>
					</div>
				) :
					<div className="article-excerpt grid-s1-e13">
						<div className="p-summary" dangerouslySetInnerHTML={{ __html: myExcerpt }} />
					</div>
				}
				{props.showCategories !== false && (
					<div>Categories:
						{myCategoryImages.map(([categoryImg, index]) => (
							<span className="p-category" key={categoryImg + "-" + index}>
								<SmartImage src={`/images/icons/${categoryImg}.png`} title={String(categoryImg)} alt={String(categoryImg)}
									cloudinaryEnv={config?.integrations?.cloudinary?.product_env ?? undefined}
									cloudinaryDomain={config?.integrations?.cloudinary?.baseUrl ?? undefined}
									cloudinaryTransforms={config?.integrations?.cloudinary?.transforms ?? undefined} />
							</span>
						))}
					</div>
				)}
			</article>
		</div>
	);
}



/**
 * BlogPostCategories — Render a compact list of category names or icons for a post.
 *
 * @param no props
 */
BlogPostCategories.propTypes = {
	/** no props */
};
export type BlogPostCategoriesType = InferProps<typeof BlogPostCategories.propTypes>;
export function BlogPostCategories(props: BlogPostCategoriesType) {
	const config = usePixelatedConfig();
	const site = config?.integrations?.wordpress?.site;
	const baseURL = config?.integrations?.wordpress?.baseURL;
	const [categories, setCategories] = useState<string[]>([]);

	useEffect(() => {
		if (!site) { return; }

		let mounted = true;
		getWordPressCategories({ site, baseURL })
			.then((fetched) => {
				if (!mounted || !Array.isArray(fetched)) {
					return;
				}
				setCategories(fetched);
			})
			.catch((error) => {
				console.warn('BlogPostCategories could not fetch categories:', error);
			});

		return () => {
			mounted = false;
		};
	}, [site, baseURL]);

	if (!categories || categories.length === 0) {
		return null;
	}

	const myCategoryImages = categories.map(
		(category) => (category && category !== "Uncategorized")
			? category.trim().toLowerCase().replace(/[ /]+/g, '-')
			: undefined
	).filter(Boolean).sort();

	return (
		<div className="blog-post-categories">
			<div>Categories: </div>
			{myCategoryImages.map((categoryImg, index) =>
				categoryImg ? (
					<span className="p-category" key={categoryImg + "-" + index}>
						<SmartImage className="u-photo" src={`/images/icons/${categoryImg}.png`} title={String(categoryImg)} alt={String(categoryImg)}
							cloudinaryEnv={config?.integrations?.cloudinary?.product_env ?? undefined}
							cloudinaryDomain={config?.integrations?.cloudinary?.baseUrl ?? undefined}
							cloudinaryTransforms={config?.integrations?.cloudinary?.transforms ?? undefined} />
					</span>
				) : null
			)}
		</div>
	);
}
