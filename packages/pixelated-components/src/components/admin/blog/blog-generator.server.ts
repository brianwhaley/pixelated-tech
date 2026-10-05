"use server";

import { readFile } from 'fs/promises';
import path from 'path';
import { getFullPixelatedConfig } from '../../config/config';
import { smartFetch } from '../../foundation/smartfetch';
import { buildUrl } from '../../foundation/urlbuilder';
import { getSiteConfig } from '../sites/sites.integration';
import { createWordPressDraft } from '../../integrations/wordpress.functions';
import { measureBlogArticle, normalizeObjectiveCriteria, validateBlogArticle, type BlogArticleMetrics, type BlogCriteria } from './blog-generator.validation';

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
		criteria?: BlogCriteria;
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
	},
	required: ['article', 'selfAssessment'],
};

async function requestGeminiText(apiKey: string, prompt: string, options: GeminiRequestOptions = {}): Promise<string> {
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
	console.info('========== GEMINI REQUEST METADATA ==========', JSON.stringify({
		model: 'gemini-2.5-flash',
		temperature: requestBody.generationConfig.temperature,
		maxOutputTokens: requestBody.generationConfig.maxOutputTokens,
		responseMimeType: options.responseMimeType,
		hasResponseSchema: Boolean(options.responseSchema),
		hasSystemInstruction: Boolean(options.systemInstruction),
	}));
	console.info('========== GEMINI REQUEST PROMPT ==========', prompt);
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
	const responseText = candidates[0]?.content?.parts?.map((part: { text?: string }) => part.text || '').join('').trim();
	if (!responseText) throw new Error('Gemini returned no response content');
	console.info('========== GEMINI RESPONSE ==========', responseText);
	return responseText;
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

function parseGeneratedArticle(responseText: string): GeneratedArticle {
	let parsed: unknown;
	try {
		parsed = JSON.parse(extractJsonObject(responseText));
	} catch (error) {
		throw new Error('Gemini article response was not valid JSON', { cause: error });
	}
	if (!parsed || typeof parsed !== 'object' || typeof (parsed as { article?: unknown }).article !== 'string') {
		throw new Error('Gemini article response did not contain an article');
	}
	const response = parsed as { article: string; selfAssessment?: ArticleSelfAssessment };
	if (!response.article.trim()) {
		throw new Error('Gemini article response contained an empty article');
	}
	return {
		article: response.article.trim(),
		selfAssessment: response.selfAssessment || {},
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
		'Return exactly two top-level JSON properties: article and selfAssessment.',
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
	return parseGeneratedArticle(await requestGeminiText(apiKey, basePrompt, {
		maxOutputTokens: 32768,
		responseMimeType: 'application/json',
		responseSchema: articleResponseSchema,
		systemInstruction: 'You are a professional WordPress blog editor. Return only the requested JSON object. Silently review and revise before returning it.',
	}));
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
			let generatedArticle = await generateArticle(entry, updatedCalendar, geminiApiKey);
			console.info('[blog-generator] Gemini article accepted for draft', JSON.stringify({
				calendarId: entry.id,
				title: entry.title,
				articleLength: generatedArticle.article.length,
			}));
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
			const draft = await createWordPressDraft({
				site: wordpressSite,
				apiToken: wordpress.apiToken,
				baseURL: wordpress.baseURL,
				title: entry.title,
				content: generatedArticle.article,
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
