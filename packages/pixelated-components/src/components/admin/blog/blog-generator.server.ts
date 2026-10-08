"use server";

import { readFile } from 'fs/promises';
import path from 'path';
import { getFullPixelatedConfig } from '../../config/config';
import { smartFetch } from '../../foundation/smartfetch';
import { buildUrl } from '../../foundation/urlbuilder';
import { getSiteConfig } from '../sites/sites.integration';
import { createWordPressDraft, updateWordPressDraft, uploadWordPressMedia, type WordPressDraftResponse } from '../../integrations/wordpress.functions';
import { findMagnificStockImage, prepareMagnificStockImage, type MagnificStockImage } from '../../integrations/magnific.server';
import { normalizeObjectiveCriteria, type BlogArticleMetrics, type BlogCriteria } from './blog-generator.validation';

const debug = false;

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
	metrics?: Partial<BlogArticleMetrics> & {
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

type ArticleRepairRequest = {
	article: string;
	errors: string[];
	selfAssessment: ArticleSelfAssessment;
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
		internalLinksIncluded: { type: 'INTEGER' },
		externalLinksIncluded: { type: 'INTEGER' },
		sentenceCount: { type: 'INTEGER' },
		callToActionIncluded: { type: 'BOOLEAN' },
		requiredCallToActionHeadingIncluded: { type: 'BOOLEAN' },
		requiredCallToActionLinkIncluded: { type: 'BOOLEAN' },
		wordpressBlocksIncluded: { type: 'BOOLEAN' },
		objectiveCriteriaPassed: { type: 'ARRAY', items: { type: 'BOOLEAN' } },
		subjectiveCriteriaPassed: { type: 'ARRAY', items: { type: 'BOOLEAN' } },
	},
	required: ['wordCount', 'paragraphsIncluded', 'bodyParagraphsIncluded', 'contentParagraphSentenceCounts', 'introductionIncluded', 'conclusionIncluded', 'listBlocksIncluded', 'listItemsIncluded', 'h2HeadingsIncluded', 'internalLinksIncluded', 'externalLinksIncluded', 'sentenceCount', 'callToActionIncluded', 'requiredCallToActionHeadingIncluded', 'requiredCallToActionLinkIncluded', 'wordpressBlocksIncluded', 'objectiveCriteriaPassed', 'subjectiveCriteriaPassed'],
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
				failures: {
					type: 'ARRAY',
					items: { type: 'STRING' },
				},
			},
			required: ['passed', 'metrics', 'failures'],
		},
		imageBrief: { type: 'STRING' },
		imageSearchTerms: { type: 'ARRAY', items: { type: 'STRING' } },
		imageAltText: { type: 'STRING' },
	},
	required: ['article', 'selfAssessment', 'imageBrief', 'imageSearchTerms', 'imageAltText'],
};
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
		article: response.article.trim(),
		selfAssessment: response.selfAssessment || {},
		imageBrief: response.imageBrief?.trim() || '',
		imageSearchTerms: Array.isArray(response.imageSearchTerms)
			? response.imageSearchTerms.filter((term): term is string => typeof term === 'string' && term.trim().length > 0).map((term) => term.trim())
			: [],
		imageAltText: response.imageAltText?.trim() || response.imageBrief?.trim() || '',
	};
}

async function generateArticle(entry: BlogCalendarEntry, calendar: BlogCalendarData, apiKey: string, repair?: ArticleRepairRequest): Promise<GeneratedArticle> {
	const criteria = calendar.blogCalendarConfig?.criteria || {};
	const objectiveCriteria = criteria.objectiveCriteria || {};
	const normalizedObjectiveCriteria = normalizeObjectiveCriteria(objectiveCriteria);
	const subjectiveCriteria = criteria.subjectiveCriteria || [];
	const minimumWords = normalizedObjectiveCriteria.minimumWords ?? 1000;
	const maximumWords = normalizedObjectiveCriteria.maximumWords ?? 1500;
	const targetWords = Math.round((minimumWords + maximumWords) / 2);
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
		'imageBrief must describe a realistic stock photograph suitable for the article. imageSearchTerms must contain concise stock-photo search terms. Do not request or describe an AI-generated image. imageAltText must be accessible alternative text for the selected stock image.',
		'The article property must contain the complete article body as Markdown. The application will convert it to HTML before sending it to WordPress.',
		'The selfAssessment property must contain passed, metrics, and failures. Metrics must include the measured counts plus objectiveCriteriaPassed and subjectiveCriteriaPassed arrays in the same order as the criteria lists.',
		'Failures must be a short array of strings. Set passed to true only when every objective and subjective criterion passes.',
		'Do not include <!DOCTYPE html>, <html>, <head>, or <body> tags; Markdown code fences; a separate title; or an # h1 heading.',
		'Use standard Markdown headings, paragraphs, lists, and links. Never use placeholder links such as href="#".',
		...(repair ? [
			'Revise the article below instead of starting over with a different topic.',
			`Validation failures to fix: ${repair.errors.join('; ')}`,
			`Article to repair:\n${repair.article}`,
			'Return only the corrected JSON object. Preserve valid content, fix every listed failure, and reevaluate both criteria arrays.',
		] : []),
	].join('\n\n');
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

	for (const entry of entries) {
		try {
			const generatedArticle = await generateArticle(entry, updatedCalendar, geminiApiKey);
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
			}
			/*
			 * Legacy criteria validation and repair flow. Draft creation now requires
			 * only a valid JSON response containing a non-empty article string.
			let validationErrors: string[] = [];
			let bestArticle = generatedArticle.article;
			let bestSelfAssessment = generatedArticle.selfAssessment;
			let bestValidationErrors: string[] | undefined;
			for (let repairAttempt = 0; repairAttempt <= 2; repairAttempt += 1) {
				console.info('[blog-generator] Gemini article output', JSON.stringify({
					calendarId: entry.id,
					title: entry.title,
					attempt: repairAttempt + 1,
					article: generatedArticle.article,
					geminiReportedMetrics: generatedArticle.selfAssessment.metrics,
				}));
				validationErrors = validateBlogArticle(generatedArticle.article, updatedCalendar.blogCalendarConfig?.criteria, wordpressSite);
				console.info('[blog-generator] Gemini article evaluation', JSON.stringify({
					calendarId: entry.id,
					title: entry.title,
					attempt: repairAttempt + 1,
					validationErrors,
					geminiReportedMetrics: generatedArticle.selfAssessment.metrics,
					localMetrics: measureBlogArticle(generatedArticle.article, wordpressSite, updatedCalendar.blogCalendarConfig?.criteria),
				}));
				if (bestValidationErrors === undefined || validationErrors.length < bestValidationErrors.length) {
					bestArticle = generatedArticle.article;
					bestSelfAssessment = generatedArticle.selfAssessment;
					bestValidationErrors = validationErrors;
				}
				if (validationErrors.length === 0 || repairAttempt === 2) break;
				generatedArticle = await generateArticle(entry, updatedCalendar, geminiApiKey, {
					article: bestArticle,
					errors: bestValidationErrors,
					selfAssessment: bestSelfAssessment,
				});
			}
			if (bestValidationErrors) {
				generatedArticle = { article: bestArticle, selfAssessment: bestSelfAssessment };
				validationErrors = bestValidationErrors;
			}
			if (validationErrors.length > 0) throw new Error(`Blog article failed criteria validation: ${validationErrors.join('; ')}`);
			*/
			let imageStatus: 'selected' | 'not-found' = 'not-found';
			let magnificImage: MagnificStockImage | null = null;
			let wordpressMediaId: string | number | undefined;
			const shouldUpdateContent = !isUpdate || updateMode === 'content' || updateMode === 'both';
			const shouldUpdateImage = !isUpdate || updateMode === 'image' || updateMode === 'both';
			if (shouldUpdateImage && magnific?.apiKey && generatedArticle.imageSearchTerms.length > 0) {
				magnificImage = await findMagnificStockImage(magnific.apiKey, {
					title: entry.title,
					imageBrief: generatedArticle.imageBrief,
					searchTerms: generatedArticle.imageSearchTerms,
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
			entry.imageSearchTerms = generatedArticle.imageSearchTerms;
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
		}
	}

	return { calendar: updatedCalendar, results, usage };
}
