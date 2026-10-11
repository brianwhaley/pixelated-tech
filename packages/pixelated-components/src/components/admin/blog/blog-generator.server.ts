"use server";

import { readFile } from 'fs/promises';
import path from 'path';
import { getFullPixelatedConfig } from '../../config/config';
import { smartFetch } from '../../foundation/smartfetch';
import { buildUrl } from '../../foundation/urlbuilder';
import { getSiteConfig } from '../sites/sites.integration';
import { createWordPressDraft, updateWordPressDraft, uploadWordPressMedia, type WordPressBlogLink, type WordPressDraftResponse } from '../../integrations/wordpress.functions';
import { getWordPressFeedLinks } from '../../integrations/wordpress.server';
import { googleSearchWithGeminiGrounding, type GoogleSearchResult } from '../../integrations/gemini.search.server';
import { findMagnificStockImage, prepareMagnificStockImage, type MagnificStockImage } from '../../integrations/magnific.server';

const debug = false;

/*
 * Historical note (2026-10-11T02:23:55Z): Post-generation validation of Gemini
 * blog drafts was removed. It was not proven to improve results, increased
 * complexity and maintenance burden by roughly 10x, and made the workflow
 * confusing. Recreating this functionality requires explicit approval from
 * Brian Whaley before implementation.
 */


type BlogCriteria = {
	subjectiveCriteria?: string[];
	objectiveCriteria?: {
		[key: string]: number | boolean | string | undefined;
		minimumWords?: number;
		maximumWords?: number;
		requireIntroParagraph?: boolean;
		requireConclusionParagraph?: boolean;
		requireCallToAction?: boolean;
		minimumBodyParagraphs?: number;
		minimumParagraphSentences?: number;
		minimumBlogLinks?: number;
		minimumSiteLinks?: number;
		minimumExternalLinks?: number;
		requiredCallToActionLink?: string;
		requireWordPressBlocks?: boolean;
		requiredCallToActionHeading?: string;
	};
};

function normalizeObjectiveCriteria(objective: BlogCriteria['objectiveCriteria'] = {}): NonNullable<BlogCriteria['objectiveCriteria']> {
	return {
		...objective,
		minimumWords: objective.minimumWords ?? objective.minimum_words as number | undefined
			?? objective.require_minimum_words as number | undefined,
		maximumWords: objective.maximumWords ?? objective.maximum_words as number | undefined
			?? objective.require_maximum_words as number | undefined,
		requireIntroParagraph: objective.requireIntroParagraph ?? objective.require_intro_paragraph as boolean | undefined,
		requireConclusionParagraph: objective.requireConclusionParagraph ?? objective.require_conclusion_paragraph as boolean | undefined,
		requireCallToAction: objective.requireCallToAction ?? objective.require_call_to_action as boolean | undefined,
		minimumBodyParagraphs: objective.minimumBodyParagraphs ?? objective.minimum_body_paragraphs as number | undefined
			?? objective.require_minimum_body_paragraphs as number | undefined,
		minimumParagraphSentences: objective.minimumParagraphSentences ?? objective.minimum_paragraph_sentences as number | undefined
			?? objective.require_minimum_paragraph_sentences as number | undefined,
		minimumBlogLinks: objective.minimumBlogLinks ?? objective.minimum_blog_links as number | undefined
			?? objective.require_minimum_blog_links as number | undefined,
		minimumSiteLinks: objective.minimumSiteLinks ?? objective.minimum_site_links as number | undefined
			?? objective.require_minimum_site_links as number | undefined,
		minimumExternalLinks: objective.minimumExternalLinks ?? objective.minimum_external_links as number | undefined
			?? objective.require_minimum_external_links as number | undefined,
		requiredCallToActionLink: objective.requiredCallToActionLink ?? objective.required_call_to_action_link as string | undefined,
		requireWordPressBlocks: objective.requireWordPressBlocks ?? objective.require_wordpress_blocks as boolean | undefined,
		requiredCallToActionHeading: objective.requiredCallToActionHeading ?? objective.required_call_to_action_heading as string | undefined,
	};
}

function normalizeBlogTitle(title: string): string {
	return title
		.replace(/<[^>]*>/g, '')
		.replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"')
		.replace(/&#8216;|&#8217;|&lsquo;|&rsquo;/g, "'")
		.replace(/&quot;/g, '"')
		.replace(/&amp;/g, '&')
		.replace(/\s+/g, ' ')
		.trim()
		.toLowerCase();
}

type SiteLink = {
	title: string;
	url: string;
};

async function getSiteLinks(site: { localPath?: string } | null): Promise<SiteLink[]> {
	if (!site?.localPath) return [];
	try {
		const configPath = path.join(site.localPath, 'src', 'app', 'config', 'pixelated.config.json');
		const config = JSON.parse(await readFile(configPath, 'utf8')) as { routes?: unknown; siteInfo?: { url?: unknown } };
		if (!Array.isArray(config.routes) || typeof config.siteInfo?.url !== 'string' || !config.siteInfo.url.trim()) return [];
		const siteUrl = new URL(config.siteInfo.url);
		return config.routes.flatMap((route): SiteLink[] => {
			if (!route || typeof route !== 'object') return [];
			const item = route as { name?: unknown; path?: unknown; routes?: unknown };
			if (item.routes || typeof item.name !== 'string' || typeof item.path !== 'string' || !item.path.trim()) return [];
			try {
				const routeUrl = new URL(item.path, siteUrl);
				const url = new URL(`${routeUrl.pathname}${routeUrl.search}${routeUrl.hash}`, siteUrl).toString();
				if (!['http:', 'https:'].includes(new URL(url).protocol)) return [];
				return [{ title: item.name, url }];
			} catch {
				return [];
			}
		});
	} catch (error) {
		console.error('[blog-generator] Unable to load site-link catalog', error);
		return [];
	}
}

export type BlogCalendarEntry = {
	id: number;
	targetPublishDate: string;
	title: string;
	notes: string[];
	status: string;
	wordpressPostId?: string | number;
	imageStatus?: 'selected' | 'not-found';
	imageBrief?: string;
	imageSearchTerms?: string[];
	magnificImage?: Omit<MagnificStockImage, 'sourceUrl'>;
	wordpressMediaId?: string | number;
};

export type BlogCalendarData = {
	blogCalendarConfig?: {
		criteria?: BlogCriteria;
		[key: string]: unknown;
	};
	blogCalendar: BlogCalendarEntry[];
};

export type GeminiUsage = {
	model: string;
	requestCount: number;
	promptTokenCount: number;
	candidatesTokenCount: number;
	totalTokenCount: number;
	thoughtsTokenCount: number;
	cachedContentTokenCount: number;
};

export type BlogGenerationResult = {
	calendar: BlogCalendarData;
	results: Array<{
		calendarId: number;
		title: string;
		status: 'draft' | 'failed';
		wordpressPostId?: string | number;
		imageStatus?: 'selected' | 'not-found';
		error?: string;
	}>;
	usage: GeminiUsage;
};

export type ExistingWordPressDraft = {
	id: string | number;
	title: string;
	modified?: string;
	url?: string;
	featuredImage?: string;
};

type ArticleSelfAssessment = {
	passed?: boolean;
	metrics?: Record<string, unknown> & {
		objectiveCriteriaPassed?: boolean[];
		subjectiveCriteriaPassed?: boolean[];
	};
	failures?: string[];
};

type GeneratedArticle = {
	article: string;
	selfAssessment: ArticleSelfAssessment;
	imageBrief: string;
	imageSearchTerms: string[];
	imageAltText: string;
	usage: Omit<GeminiUsage, 'model' | 'requestCount'>;
};

type GeminiRequestOptions = {
	maxOutputTokens?: number;
	responseMimeType?: string;
	responseSchema?: unknown;
	systemInstruction?: string;
};

type GeminiTextResponse = {
	text: string;
	usage: Omit<GeminiUsage, 'model' | 'requestCount'>;
};

const articleMetricsSchema = {
	type: 'OBJECT',
	properties: {
		wordCount: { type: 'INTEGER' },
		paragraphsIncluded: { type: 'INTEGER' },
		bodyParagraphsIncluded: { type: 'INTEGER' },
		contentParagraphSentenceCounts: { type: 'ARRAY', items: { type: 'INTEGER' } },
		introductionIncluded: { type: 'BOOLEAN' },
		conclusionIncluded: { type: 'BOOLEAN' },
		listBlocksIncluded: { type: 'INTEGER' },
		listItemsIncluded: { type: 'INTEGER' },
		h2HeadingsIncluded: { type: 'INTEGER' },
		blogLinksIncluded: { type: 'INTEGER' },
		siteLinksIncluded: { type: 'INTEGER' },
		externalLinksIncluded: { type: 'INTEGER' },
		sentenceCount: { type: 'INTEGER' },
		callToActionIncluded: { type: 'BOOLEAN' },
		requiredCallToActionHeadingIncluded: { type: 'BOOLEAN' },
		requiredCallToActionLinkIncluded: { type: 'BOOLEAN' },
		wordpressBlocksIncluded: { type: 'BOOLEAN' },
		objectiveCriteriaPassed: { type: 'ARRAY', items: { type: 'BOOLEAN' } },
		subjectiveCriteriaPassed: { type: 'ARRAY', items: { type: 'BOOLEAN' } },
	},
	required: ['wordCount', 'paragraphsIncluded', 'bodyParagraphsIncluded', 'contentParagraphSentenceCounts', 'introductionIncluded', 'conclusionIncluded', 'listBlocksIncluded', 'listItemsIncluded', 'h2HeadingsIncluded', 'blogLinksIncluded', 'siteLinksIncluded', 'externalLinksIncluded', 'sentenceCount', 'callToActionIncluded', 'requiredCallToActionHeadingIncluded', 'requiredCallToActionLinkIncluded', 'wordpressBlocksIncluded', 'objectiveCriteriaPassed', 'subjectiveCriteriaPassed'],
};

const articleResponseSchema = {
	type: 'OBJECT',
	properties: {
		article: { type: 'STRING' },
		selfAssessment: {
			type: 'OBJECT',
			properties: {
				passed: { type: 'BOOLEAN' },
				metrics: articleMetricsSchema,
				failures: { type: 'ARRAY', items: { type: 'STRING' } },
			},
			required: ['passed', 'metrics', 'failures'],
		},
		imageBrief: { type: 'STRING' },
		imageSearchTerms: { type: 'ARRAY', items: { type: 'STRING' } },
		imageAltText: { type: 'STRING' },
	},
	required: ['article', 'selfAssessment', 'imageBrief', 'imageSearchTerms', 'imageAltText'],
};

export async function getExistingWordPressDrafts(siteName: string): Promise<ExistingWordPressDraft[]> {
	const config = getFullPixelatedConfig();
	const wordpress = config.integrations?.wordpress;
	const site = await getSiteConfig(siteName);
	const blogUrl = String(site?.blog_url || '').trim();
	const wordpressSite = blogUrl ? new URL(blogUrl).hostname : wordpress?.site;
	if (!wordpress?.apiToken || !wordpressSite) throw new Error('WordPress site is not configured');
	const url = buildUrl({
		baseUrl: wordpress.baseURL ?? 'https://public-api.wordpress.com/rest/v1/sites/',
		pathSegments: [wordpressSite, 'posts'],
		params: { status: 'draft', number: 100 },
	});
	const response = await smartFetch(url, {
		timeout: 60000,
		retries: 0,
		requestInit: { headers: { Authorization: `Bearer ${wordpress.apiToken}` } },
	});
	const posts = response && typeof response === 'object' && Array.isArray((response as { posts?: unknown[] }).posts)
		? (response as { posts: Array<Record<string, unknown>> }).posts
		: [];
	return posts.flatMap((post) => {
		const id = post.ID ?? post.id;
		const title = typeof post.title === 'string' ? post.title.replace(/<[^>]*>/g, '').trim() : '';
		if ((typeof id !== 'string' && typeof id !== 'number') || !title) return [];
		return [{
			id,
			title,
			modified: typeof post.modified === 'string' ? post.modified : undefined,
			url: typeof post.URL === 'string' ? post.URL : undefined,
			featuredImage: typeof post.featured_image === 'string' ? post.featured_image : undefined,
		}];
	});
}

async function requestGeminiText(apiKey: string, prompt: string, options: GeminiRequestOptions = {}): Promise<GeminiTextResponse> {
	const url = buildUrl({
		baseUrl: 'https://generativelanguage.googleapis.com',
		pathSegments: ['v1beta', 'models', 'gemini-2.5-flash:generateContent'],
		params: { key: apiKey },
	});
	const requestBody = {
		...(options.systemInstruction ? { systemInstruction: { parts: [{ text: options.systemInstruction }] } } : {}),
		contents: [{ parts: [{ text: prompt }] }],
		generationConfig: {
			temperature: 0.7,
			maxOutputTokens: options.maxOutputTokens ?? 8192,
			...(options.responseMimeType ? { responseMimeType: options.responseMimeType } : {}),
			...(options.responseSchema ? { responseSchema: options.responseSchema } : {}),
		},
	};
	if (debug) {
		console.info('========== GEMINI REQUEST METADATA ==========', JSON.stringify({
			model: 'gemini-2.5-flash',
			temperature: requestBody.generationConfig.temperature,
			maxOutputTokens: requestBody.generationConfig.maxOutputTokens,
			responseMimeType: options.responseMimeType,
			hasResponseSchema: Boolean(options.responseSchema),
			hasSystemInstruction: Boolean(options.systemInstruction),
		}));
		console.info('========== GEMINI REQUEST PROMPT ==========', prompt);
	}
	const response = await smartFetch(url, {
		timeout: 120000,
		retries: 0,
		requestInit: {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(requestBody),
		},
	});
	const candidates = Array.isArray(response.candidates) ? response.candidates : [];
	if (debug) {
		console.info('========== GEMINI RESPONSE METADATA ==========', JSON.stringify({
			responseId: response.responseId,
			modelVersion: response.modelVersion,
			usageMetadata: response.usageMetadata,
			promptFeedback: response.promptFeedback,
			candidateCount: candidates.length,
			candidates: candidates.map((candidate: { finishReason?: string; finishMessage?: string; safetyRatings?: unknown; citationMetadata?: unknown; content?: { parts?: Array<{ text?: string }> } }, index: number) => ({
				index,
				finishReason: candidate.finishReason,
				finishMessage: candidate.finishMessage,
				safetyRatings: candidate.safetyRatings,
				citationMetadata: candidate.citationMetadata,
				contentPartCount: candidate.content?.parts?.length || 0,
				contentTextLength: candidate.content?.parts?.reduce((length, part) => length + (part.text?.length || 0), 0) || 0,
			})),
		}));
	}
	const responseText = candidates[0]?.content?.parts?.map((part: { text?: string }) => part.text || '').join('').trim();
	if (!responseText) throw new Error('Gemini returned no response content');
	if (debug) console.info('========== GEMINI RESPONSE ==========', responseText);
	const usageMetadata = response.usageMetadata as Record<string, unknown> | undefined;
	const tokenCount = (value: unknown): number => typeof value === 'number' && Number.isFinite(value) ? value : 0;
	return {
		text: responseText,
		usage: {
			promptTokenCount: tokenCount(usageMetadata?.promptTokenCount),
			candidatesTokenCount: tokenCount(usageMetadata?.candidatesTokenCount),
			totalTokenCount: tokenCount(usageMetadata?.totalTokenCount),
			thoughtsTokenCount: tokenCount(usageMetadata?.thoughtsTokenCount),
			cachedContentTokenCount: tokenCount(usageMetadata?.cachedContentTokenCount),
		},
	};
}

function extractJsonObject(responseText: string): string {
	const normalized = responseText.trim()
		.replace(/^```(?:json)?\s*/i, '')
		.replace(/\s*```$/i, '')
		.trim();
	for (let start = normalized.indexOf('{'); start >= 0; start = normalized.indexOf('{', start + 1)) {
		let depth = 0;
		let inString = false;
		let escaped = false;
		for (let index = start; index < normalized.length; index += 1) {
			const character = normalized[index];
			if (inString) {
				if (escaped) escaped = false;
				else if (character === '\\') escaped = true;
				else if (character === '"') inString = false;
				continue;
			}
			if (character === '"') inString = true;
			else if (character === '{') depth += 1;
			else if (character === '}' && --depth === 0) return normalized.slice(start, index + 1);
		}
	}
	throw new Error('Gemini article response did not contain a complete JSON object');
}

function parseGeneratedArticle(responseText: string): Omit<GeneratedArticle, 'usage'> {
	let parsed: unknown;
	try {
		parsed = JSON.parse(extractJsonObject(responseText));
	} catch (error) {
		throw new Error('Gemini article response was not valid JSON', { cause: error });
	}
	if (!parsed || typeof parsed !== 'object' || typeof (parsed as { article?: unknown }).article !== 'string') {
		throw new Error('Gemini article response did not contain an article');
	}
	const response = parsed as { article: string; selfAssessment?: ArticleSelfAssessment; imageBrief?: string; imageSearchTerms?: string[]; imageAltText?: string };
	if (!response.article.trim()) {
		throw new Error('Gemini article response contained an empty article');
	}
	return {
		article: response.article.trim().replace(/\[((?:https?:\/\/)[^\]\s]+)\](?!\()/gi, '[$1]($1)'),
		selfAssessment: response.selfAssessment || {},
		imageBrief: response.imageBrief?.trim() || '',
		imageSearchTerms: Array.isArray(response.imageSearchTerms)
			? response.imageSearchTerms.filter((term): term is string => typeof term === 'string' && term.trim().length > 0).map((term) => term.trim())
			: [],
		imageAltText: response.imageAltText?.trim() || response.imageBrief?.trim() || '',
	};
}

async function generateArticle(entry: BlogCalendarEntry, calendar: BlogCalendarData, apiKey: string, blogLinkCatalog: WordPressBlogLink[] = [], siteLinkCatalog: SiteLink[] = [], externalSearchCatalog: GoogleSearchResult[] = []): Promise<GeneratedArticle> {
	const criteria = calendar.blogCalendarConfig?.criteria || {};
	const objectiveCriteria = criteria.objectiveCriteria || {};
	const normalizedObjectiveCriteria = normalizeObjectiveCriteria(objectiveCriteria);
	const subjectiveCriteria = criteria.subjectiveCriteria || [];
	const minimumWords = normalizedObjectiveCriteria.minimumWords ?? 1000;
	const maximumWords = normalizedObjectiveCriteria.maximumWords ?? 1500;
	const targetWords = Math.round((minimumWords + maximumWords) / 2);
	const minimumBlogLinks = normalizedObjectiveCriteria.minimumBlogLinks ?? 0;
	const minimumSiteLinks = normalizedObjectiveCriteria.minimumSiteLinks ?? 0;
	const minimumExternalLinks = normalizedObjectiveCriteria.minimumExternalLinks ?? 0;
	const objectivePrompt = Object.entries(objectiveCriteria).map(([name, value], index) => `${index + 1}. ${name}: ${String(value)}`).join('\n');
	const subjectivePrompt = subjectiveCriteria.map((criterion, index) => `- ${index + 1}. ${criterion}`).join('\n');
	const basePrompt = [
		'Write a complete blog post for the following calendar topic.',
		`Title: ${entry.title}`,
		`Topic notes: ${entry.notes.join('\n')}`,
		`Article length: Write between ${minimumWords} and ${maximumWords} words. Aim for approximately ${targetWords} words so the article stays safely inside the range.`,
		`Objective criteria, evaluate each in order:\n${objectivePrompt}`,
		`Subjective criteria, evaluate each in order:\n${subjectivePrompt}`,
		'Use the criteria lists above to write the article and to set the two ordered pass/fail arrays in selfAssessment.metrics. Do not provide evidence text.',
		'Return exactly five top-level JSON properties: article, selfAssessment, imageBrief, imageSearchTerms, and imageAltText.',
		'Respond ONLY with raw JSON, starting with { and ending with }. You MUST return your response exclusively as a valid, raw JSON object. Do NOT wrap the response in markdown code blocks like ```json ... ```. Do NOT include any introductory or trailing conversational text outside the JSON object. Ensure all internal and external link strings are valid JSON strings inside the output structure.',
		`Include at least ${minimumBlogLinks} relevant blog links, at least ${minimumSiteLinks} relevant site links, and at least ${minimumExternalLinks} relevant external links in the Markdown article when those minimums are greater than zero. External links must use real, authoritative URLs; never invent URLs or merely name a source without linking it.`,
		'imageBrief must describe a realistic stock photograph suitable for the article. imageSearchTerms must contain at least three concise stock-photo search terms. Do not request or describe an AI-generated image. imageAltText must be accessible alternative text for the selected stock image.',
		'The article property must contain the complete article body as Markdown. The application will convert it to HTML before sending it to WordPress.',
		'The selfAssessment property must contain passed, metrics, and failures. Metrics must include the measured counts plus objectiveCriteriaPassed and subjectiveCriteriaPassed arrays in the same order as the criteria lists.',
		'Failures must be a short array of strings. Set passed to true only when every objective and subjective criterion passes.',
		'Do not include <!DOCTYPE html>, <html>, <head>, or <body> tags; Markdown code fences; a separate title; or an # h1 heading.',
		blogLinkCatalog.length > 0
			? `Blog-link rules: You may link only to posts in the following published-post array. Use the exact title and exact URL from the array. Never fabricate, modify, infer, shorten, or search for a blog URL. If no post is relevant, do not add a blog link. Published-post array:
${JSON.stringify(blogLinkCatalog)}`
			: 'Blog-link rules: No published-post array was provided, so do not add blog links. Never fabricate or infer a blog URL.',
		siteLinkCatalog.length > 0
			? `Site-link rules: You may link only to pages in the following site-page array. Use the exact title and exact URL from the array. Never fabricate, modify, infer, shorten, or search for a site URL. If no page is relevant, do not add a site link. Site-page array:
${JSON.stringify(siteLinkCatalog)}`
			: 'Site-link rules: No site-page array was provided, so do not add site links. Never fabricate or infer a site URL.',
		externalSearchCatalog.length > 0
			? `External-source rules: You may link only to exact URLs in the following Google search-result array. Match the source title and snippet to the claim. Never invent, guess, reconstruct, shorten, modify, or search for another URL. If no supplied result supports a claim, omit the external link and unsupported statistic. Google search-result array:
${JSON.stringify(externalSearchCatalog)}`
			: 'External-source rules: No Google search-result array was provided, so do not add external links or unsupported sourced claims. Never fabricate or infer an external URL.',
		'Use standard Markdown headings, paragraphs, lists, and links. Every source URL must use the complete Markdown link form [source name](https://example.com/source). Never write a bare bracketed URL such as [https://example.com/source], never put a URL in square brackets by itself, and never use placeholder links such as href="#".',
	].join('\n\n');
	if (debug) {
		console.info('[blog-generator] Gemini prompt', basePrompt);
	}
	const geminiResponse = await requestGeminiText(apiKey, basePrompt, {
		maxOutputTokens: 32768,
		responseMimeType: 'application/json',
		responseSchema: articleResponseSchema,
		systemInstruction: 'You are a professional WordPress blog editor. Return only the requested JSON object. Silently review and revise before returning it.',
	});
	return {
		...parseGeneratedArticle(geminiResponse.text),
		usage: geminiResponse.usage,
	};
}

export async function generateBlogPostsFromCalendar(
	calendarOrFormData: BlogCalendarData | FormData,
	providedFormData?: FormData
): Promise<BlogGenerationResult> {
	const formData = providedFormData || calendarOrFormData as FormData;
	const submittedCalendarJson = formData instanceof FormData ? formData.get('calendarJson') : null;
	const calendarProvided = providedFormData !== undefined || typeof submittedCalendarJson === 'string' && submittedCalendarJson.trim().length > 0;
	const requestedCount = Number.parseInt(String(formData.get('count') || '1'), 10);
	const count = Number.isFinite(requestedCount) && requestedCount > 0 ? requestedCount : 1;
	const operation = String(formData.get('operation') || 'generate');
	const updateMode = String(formData.get('updateMode') || 'both');
	const selectedDraftIds = new Set(String(formData.get('draftIds') || '').split(',').map((id) => id.trim()).filter(Boolean));
	const isUpdate = operation === 'update' && selectedDraftIds.size > 0;
	const siteName = String(formData.get('siteName') || '').trim();
	const config = getFullPixelatedConfig();
	const geminiApiKey = config.integrations?.googleGemini?.api_key;
	const wordpress = config.integrations?.wordpress;
	const magnific = config.integrations?.magnific;
	const cloudinary = config.integrations?.cloudinary;
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
		if (providedFormData !== undefined) {
			calendar = calendarOrFormData as BlogCalendarData;
		} else {
			try {
				calendar = JSON.parse(String(submittedCalendarJson)) as BlogCalendarData;
			} catch (error) {
				throw new Error('Submitted blog calendar JSON is invalid', { cause: error });
			}
		}
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
	if (isUpdate) {
		const existingDrafts = await getExistingWordPressDrafts(siteName);
		let syntheticCalendarId = updatedCalendar.blogCalendar.reduce((highest, entry) => Math.max(highest, entry.id), 0) + 1;
		for (const draft of existingDrafts) {
			if (!selectedDraftIds.has(String(draft.id))) continue;
			const matchingEntry = updatedCalendar.blogCalendar.find((entry) => String(entry.wordpressPostId) === String(draft.id))
				|| updatedCalendar.blogCalendar.find((entry) => normalizeBlogTitle(entry.title) === normalizeBlogTitle(draft.title));
			if (matchingEntry) {
				matchingEntry.wordpressPostId = draft.id;
				continue;
			}
			updatedCalendar.blogCalendar.push({
				id: syntheticCalendarId++,
				targetPublishDate: '',
				title: draft.title,
				notes: [],
				status: 'draft',
				wordpressPostId: draft.id,
			});
		}
	}
	const entries = (isUpdate
		? updatedCalendar.blogCalendar.filter((entry) => entry.wordpressPostId !== undefined && selectedDraftIds.has(String(entry.wordpressPostId)))
		: updatedCalendar.blogCalendar.filter((entry) => entry.status === '')
	).slice(0, isUpdate ? selectedDraftIds.size : count);
	const fetchedBlogLinkCatalog = site?.blogRss
		? await getWordPressFeedLinks(site.blogRss, 100)
		: [];
	const blogLinkCatalog = fetchedBlogLinkCatalog.length > 5 ? fetchedBlogLinkCatalog : [];
	const siteLinkCatalog = await getSiteLinks(site);
	if (debug) {
		console.info('[blog-generator] WordPress blog-link catalog', JSON.stringify({
			feedUrl: site?.blogRss || null,
			availableCount: fetchedBlogLinkCatalog.length,
			includedCount: blogLinkCatalog.length,
			links: blogLinkCatalog,
		}));
		console.info('[blog-generator] Site-link catalog', JSON.stringify({
			count: siteLinkCatalog.length,
			links: siteLinkCatalog,
		}));
	}
	const results: BlogGenerationResult['results'] = [];
	const usage: GeminiUsage = {
		model: 'gemini-2.5-flash',
		requestCount: 0,
		promptTokenCount: 0,
		candidatesTokenCount: 0,
		totalTokenCount: 0,
		thoughtsTokenCount: 0,
		cachedContentTokenCount: 0,
	};
	let processedEntryCount = 0;

	for (const entry of entries) {
		try {
			const cleanTitle = entry.title
				.replace(/[^\w\s-]/g, ' ')
				.replace(/\s+/g, ' ')
				.trim();
			const noteSnippet = entry.notes.length > 0
				? entry.notes[0]
					.replace(/[^\w\s-]/g, ' ')
					.replace(/\s+/g, ' ')
					.trim()
				: '';
			const shortNoteKeywords = noteSnippet
				.split(/(?:[.;!?]|\b(?:and|or|with|for|in|at)\b)/i)[0]
				.split(/\s+/)
				.slice(0, 6)
				.join(' ');
			const combinedSearchCriteria = `${cleanTitle} ${shortNoteKeywords}`.trim();
			const searchCriteria = combinedSearchCriteria ? [combinedSearchCriteria] : [];
			const externalSearchCatalog = geminiApiKey
				? await googleSearchWithGeminiGrounding({
					apiKey: geminiApiKey,
					criteria: searchCriteria,
					count: 10,
					debug,
				})
				: [];
			if (debug) {
				console.info('[blog-generator] Google external search results', JSON.stringify({
					calendarId: entry.id,
					title: entry.title,
					criteria: searchCriteria,
					count: externalSearchCatalog.length,
					results: externalSearchCatalog,
				}, null, 2));
			}
			const generatedArticle = await generateArticle(entry, updatedCalendar, geminiApiKey, blogLinkCatalog, siteLinkCatalog, externalSearchCatalog);
			usage.requestCount += 1;
			usage.promptTokenCount += generatedArticle.usage.promptTokenCount;
			usage.candidatesTokenCount += generatedArticle.usage.candidatesTokenCount;
			usage.totalTokenCount += generatedArticle.usage.totalTokenCount;
			usage.thoughtsTokenCount += generatedArticle.usage.thoughtsTokenCount;
			usage.cachedContentTokenCount += generatedArticle.usage.cachedContentTokenCount;
			if (debug) {
				console.info('[blog-generator] Gemini article accepted for draft', JSON.stringify({
					calendarId: entry.id,
					title: entry.title,
					articleLength: generatedArticle.article.length,
				}));
				console.info('[blog-generator] Gemini article output', JSON.stringify({
					calendarId: entry.id,
					title: entry.title,
					attempt: 1,
					article: generatedArticle.article,
					geminiReportedMetrics: generatedArticle.selfAssessment.metrics,
				}));
			}
			let imageStatus: 'selected' | 'not-found' = 'not-found';
			let magnificImage: MagnificStockImage | null = null;
			let wordpressMediaId: string | number | undefined;
			const shouldUpdateContent = !isUpdate || updateMode === 'content' || updateMode === 'both';
			const shouldUpdateImage = !isUpdate || updateMode === 'image' || updateMode === 'both';
			const imageSearchTerms = generatedArticle.imageSearchTerms.length > 0
				? generatedArticle.imageSearchTerms
				: [entry.title, generatedArticle.imageBrief].filter((term) => term.trim().length > 0);
			if (shouldUpdateImage && magnific?.apiKey && imageSearchTerms.length > 0) {
				magnificImage = await findMagnificStockImage(magnific.apiKey, {
					title: entry.title,
					imageBrief: generatedArticle.imageBrief,
					searchTerms: imageSearchTerms,
				});
				if (magnificImage) {
					if (!cloudinary?.product_env) throw new Error('Cloudinary image transformation is not configured');
					const preparedImage = await prepareMagnificStockImage(magnificImage, cloudinary);
					const media = await uploadWordPressMedia({
						site: wordpressSite,
						apiToken: wordpress.apiToken,
						baseURL: wordpress.baseURL,
						filename: `blog-${entry.id}.webp`,
						buffer: preparedImage.buffer,
						mimeType: preparedImage.mimeType,
						title: entry.title,
						altText: generatedArticle.imageAltText || generatedArticle.imageBrief || `${entry.title} featured image`,
						caption: magnificImage.title,
						description: `Featured stock photograph for "${entry.title}".`,
					});
					wordpressMediaId = media.media?.[0]?.ID ?? media.media?.[0]?.id;
					if (wordpressMediaId === undefined) throw new Error('WordPress media response did not include a media ID');
					imageStatus = 'selected';
				}
			}
			const draftInput = {
				site: wordpressSite,
				apiToken: wordpress.apiToken,
				baseURL: wordpress.baseURL,
				title: entry.title,
				...(entry.targetPublishDate ? { date: `${entry.targetPublishDate}T10:00:00` } : {}),
				featuredImageId: wordpressMediaId,
			};
			let draft: WordPressDraftResponse;
			if (entry.wordpressPostId !== undefined) {
				draft = await updateWordPressDraft(entry.wordpressPostId, {
					...draftInput,
					...(shouldUpdateContent ? { content: generatedArticle.article } : {}),
				});
			} else {
				draft = await createWordPressDraft({
					...draftInput,
					content: generatedArticle.article,
				});
			}
			const wordpressPostId = draft.ID ?? draft.id ?? entry.wordpressPostId;
			if (wordpressPostId === undefined) throw new Error('WordPress draft response did not include a post ID');
			entry.status = 'draft';
			entry.wordpressPostId = wordpressPostId;
			entry.imageStatus = imageStatus;
			entry.imageBrief = generatedArticle.imageBrief;
			entry.imageSearchTerms = imageSearchTerms;
			if (magnificImage) {
				entry.magnificImage = {
					id: magnificImage.id,
					title: magnificImage.title,
					detailUrl: magnificImage.detailUrl,
					licenseUrl: magnificImage.licenseUrl,
					provider: magnificImage.provider,
					orientation: magnificImage.orientation,
				};
			}
			entry.wordpressMediaId = wordpressMediaId ?? entry.wordpressMediaId;
			results.push({ calendarId: entry.id, title: entry.title, status: 'draft', wordpressPostId, imageStatus });
		} catch (error) {
			results.push({
				calendarId: entry.id,
				title: entry.title,
				status: 'failed',
				error: error instanceof Error ? error.message : 'Unable to generate blog post',
			});
		} finally {
			processedEntryCount += 1;
			console.info(`[blog-generator] ${processedEntryCount}/${entries.length} ${results.at(-1)?.status === 'draft' ? 'completed' : 'failed'}: ${entry.title}`);
		}
	}

	return { calendar: updatedCalendar, results, usage };
}
