"use server";

import { readFile } from 'fs/promises';
import path from 'path';
import { getFullPixelatedConfig } from '../../config/config';
import { smartFetch } from '../../foundation/smartfetch';
import { buildUrl } from '../../foundation/urlbuilder';
import { getSiteConfig } from '../sites/sites.integration';
import { createWordPressDraft } from '../../integrations/wordpress.functions';

export type BlogCalendarEntry = {
	id: number;
	targetPublishDate: string;
	title: string;
	notes: string[];
	status: string;
	wordpressPostId?: string | number;
};

export type BlogCalendarData = {
	blogCalendarConfig?: {
		criteria?: {
			tone?: string;
			audience?: string[];
			contentRules?: string[];
			seoRules?: string[];
			articleLength?: {
				minimumWords?: number;
				maximumWords?: number;
			};
			[key: string]: unknown;
		};
		[key: string]: unknown;
	};
	blogCalendar: BlogCalendarEntry[];
};

export type BlogGenerationResult = {
	calendar: BlogCalendarData;
	results: Array<{
		calendarId: number;
		title: string;
		status: 'draft' | 'failed';
		wordpressPostId?: string | number;
		error?: string;
	}>;
};

async function generateArticle(entry: BlogCalendarEntry, calendar: BlogCalendarData, apiKey: string): Promise<string> {
	const criteria = calendar.blogCalendarConfig?.criteria || {};
	const minimumWords = criteria.articleLength?.minimumWords ?? 900;
	const maximumWords = criteria.articleLength?.maximumWords ?? 1400;
	const basePrompt = [
		'Write a complete blog post for the following calendar topic.',
		`Title: ${entry.title}`,
		`Topic notes: ${entry.notes.join('\n')}`,
		`Tone: ${criteria.tone || 'Clear, practical, and authoritative.'}`,
		`Audience: ${(criteria.audience || []).join(', ')}`,
		`Content rules: ${(criteria.contentRules || []).join('; ')}`,
		`SEO rules: ${(criteria.seoRules || []).join('; ')}`,
		`Article length: Write between ${minimumWords} and ${maximumWords} words.`,
		'Format: Return only the article body as clean HTML suitable for the WordPress post content field.',
		'Do not include <!DOCTYPE html>, <html>, <head>, or <body> tags; Markdown; Markdown code fences; WordPress Gutenberg comments; a separate title; or an <h1> element.',
		'Use normal content elements such as <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, and <a>.',
	].join('\n\n');
	const url = buildUrl({
		baseUrl: 'https://generativelanguage.googleapis.com',
		pathSegments: ['v1beta', 'models', 'gemini-2.5-flash:generateContent'],
		params: { key: apiKey },
	});
	const requestArticle = async (prompt: string): Promise<string> => {
		const response = await smartFetch(url, {
			timeout: 60000,
			requestInit: {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					contents: [{ parts: [{ text: prompt }] }],
					generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
				}),
			},
		});
		const article = response.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || '').join('').trim();
		if (!article) throw new Error('Gemini returned no article content');
		return article;
	};

	return requestArticle(basePrompt);
}

export async function generateBlogPostsFromCalendar(
	calendarOrFormData: BlogCalendarData | FormData,
	providedFormData?: FormData
): Promise<BlogGenerationResult> {
	const calendarProvided = providedFormData !== undefined;
	const formData = providedFormData || calendarOrFormData as FormData;
	const requestedCount = Number.parseInt(String(formData.get('count') || '1'), 10);
	const count = Number.isFinite(requestedCount) && requestedCount > 0 ? requestedCount : 1;
	const siteName = String(formData.get('siteName') || '').trim();
	const config = getFullPixelatedConfig();
	const geminiApiKey = config.integrations?.googleGemini?.api_key;
	const wordpress = config.integrations?.wordpress;
	const site = siteName ? await getSiteConfig(siteName) : null;
	const configuredBlogUrl = String(site?.blog_url || '').trim();
	const blogUrl = configuredBlogUrl;
	if (!geminiApiKey) throw new Error('Google Gemini API key not configured');
	if (!wordpress?.apiToken) throw new Error('WordPress API token is not configured');
	if (!calendarProvided && (!site || !blogUrl)) throw new Error('Site blog URL is not configured');
	const wordpressSite = blogUrl ? new URL(blogUrl).hostname : wordpress.site;
	if (!wordpressSite) throw new Error('WordPress site is not configured');
	let calendar: BlogCalendarData | undefined;
	if (calendarProvided) {
		calendar = calendarOrFormData as BlogCalendarData;
	} else {
		if (!site || !blogUrl) throw new Error('Site blog URL is not configured');
		if (!site.localPath) throw new Error('Site local path is not configured');
		const calendarPath = path.join(site.localPath, 'public', 'data', 'blogcalendar.json');
		try {
			calendar = JSON.parse(await readFile(calendarPath, 'utf8')) as BlogCalendarData;
		} catch (error) {
			throw new Error(`Unable to load site blog calendar from ${calendarPath}`, { cause: error });
		}
	}

	const updatedCalendar: BlogCalendarData = {
		...calendar,
		blogCalendar: calendar.blogCalendar.map((entry) => ({ ...entry })),
	};
	const entries = updatedCalendar.blogCalendar.filter((entry) => entry.status === '').slice(0, count);
	const results: BlogGenerationResult['results'] = [];

	for (const entry of entries) {
		try {
			const article = await generateArticle(entry, updatedCalendar, geminiApiKey);
			const draft = await createWordPressDraft({
				site: wordpressSite,
				apiToken: wordpress.apiToken,
				baseURL: wordpress.baseURL,
				title: entry.title,
				content: article,
			});
			const wordpressPostId = draft.ID ?? draft.id;
			if (wordpressPostId === undefined) throw new Error('WordPress draft response did not include a post ID');
			entry.status = 'draft';
			entry.wordpressPostId = wordpressPostId;
			results.push({ calendarId: entry.id, title: entry.title, status: 'draft', wordpressPostId });
		} catch (error) {
			results.push({
				calendarId: entry.id,
				title: entry.title,
				status: 'failed',
				error: error instanceof Error ? error.message : 'Unable to generate blog post',
			});
		}
	}

	return { calendar: updatedCalendar, results };
}
