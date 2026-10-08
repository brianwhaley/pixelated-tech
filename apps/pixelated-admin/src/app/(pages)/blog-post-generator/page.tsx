/* eslint-disable pixelated/enforce-single-h1 */

import { generateBlogPostsFromCalendar, getExistingWordPressDrafts, type BlogGenerationResult, type ExistingWordPressDraft } from '@pixelated-tech/components/adminserver';
import { loadSitesConfig } from '@pixelated-tech/components/server';
import BlogPostGeneratorClient from './BlogPostGeneratorClient';

async function generateBlogPostsAction(
	_previousState: BlogGenerationResult | null,
	formData: FormData
): Promise<BlogGenerationResult> {
	'use server';
	return generateBlogPostsFromCalendar(formData);
}

async function getExistingDraftsAction(formData: FormData): Promise<ExistingWordPressDraft[]> {
	'use server';
	return getExistingWordPressDrafts(String(formData.get('siteName') || '').trim());
}

export default async function BlogPostGeneratorPage() {
	const sites = await loadSitesConfig();
	const blogSites = sites.filter((site) => site.blog_url).map(({ name, blog_url }) => ({ name, blog_url }));

	return <BlogPostGeneratorClient action={generateBlogPostsAction} getExistingDraftsAction={getExistingDraftsAction} sites={blogSites} />;
}