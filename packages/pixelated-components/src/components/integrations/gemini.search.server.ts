"use server";

import { buildUrl } from '../foundation/urlbuilder';
import { smartFetch } from '../foundation/smartfetch';

export type GoogleSearchResult = {
	title: string;
	url: string;
	snippet: string;
};

export type GoogleSearchWithGeminiGroundingOptions = {
	apiKey: string;
	criteria: string | string[];
	count?: number;
	debug?: boolean;
};

type GroundedWebSource = {
	uri?: unknown;
	title?: unknown;
};

type GroundingChunk = {
	web?: GroundedWebSource;
};

async function resolveGroundingUrl(sourceUrl: string): Promise<string> {
	let parsedUrl: URL;
	try {
		parsedUrl = new URL(sourceUrl);
	} catch {
		return '';
	}

	if (!['http:', 'https:'].includes(parsedUrl.protocol)) return '';
	if (!sourceUrl.includes('vertexaisearch.cloud.google.com/grounding-api-redirect/')) return sourceUrl;

	try {
		// Manual redirect handling requires access to the 3xx Location header.
		// eslint-disable-next-line pixelated/no-direct-fetch
		const response = await fetch(sourceUrl, { method: 'GET', redirect: 'manual' });
		const location = response.headers.get('location')?.trim() || '';
		const resolvedUrl = new URL(location);
		return ['http:', 'https:'].includes(resolvedUrl.protocol) ? resolvedUrl.toString() : '';
	} catch {
		return '';
	}
}

export async function googleSearchWithGeminiGrounding({
	apiKey,
	criteria,
	count = 10,
	debug = false,
}: GoogleSearchWithGeminiGroundingOptions): Promise<GoogleSearchResult[]> {
	const query = (Array.isArray(criteria) ? criteria : [criteria])
		.map((value) => value.trim())
		.filter(Boolean)
		.join(' ');
	const normalizedCount = Math.min(Math.max(Math.trunc(count), 1), 10);
	if (!apiKey.trim() || !query) return [];

	const url = buildUrl({
		baseUrl: 'https://generativelanguage.googleapis.com',
		pathSegments: ['v1beta', 'models', 'gemini-2.5-flash:generateContent'],
		params: { key: apiKey },
	});
	const instruction = `Search for authoritative guidelines, regulations, industry standards, and statistical research regarding: ${query}. Summarize 3 key findings in original words. Do not quote or reproduce source text.`;
	if (debug) console.info('[google-search-gemini] Request', JSON.stringify({ query, count: normalizedCount }));
	try {
		const response = await smartFetch(url, {
			responseType: 'json',
			timeout: 120000,
			retries: 0,
			requestInit: {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					contents: [{ parts: [{ text: instruction }] }],
					tools: [{ googleSearch: {} }],
					generationConfig: { temperature: 0.2 },
				}),
			},
		});
		const responseObject = response && typeof response === 'object' ? response as Record<string, unknown> : {};
		const candidates = Array.isArray(responseObject.candidates) ? responseObject.candidates : [];
		const candidate = candidates[0] as Record<string, unknown> | undefined;
		const content = candidate?.content as Record<string, unknown> | undefined;
		const parts = Array.isArray(content?.parts) ? content.parts as Array<Record<string, unknown>> : [];
		const groundingMetadata = candidate?.groundingMetadata as Record<string, unknown> | undefined;
		const citationMetadata = candidate?.citationMetadata as Record<string, unknown> | undefined;
		const groundingChunksFromResponse = Array.isArray(groundingMetadata?.groundingChunks)
			? groundingMetadata.groundingChunks as GroundingChunk[]
			: [];
		if (debug) {
			console.info('[google-search-gemini] Raw response diagnostics', JSON.stringify({
				responseKeys: Object.keys(responseObject),
				candidateCount: candidates.length,
				candidateKeys: candidate ? Object.keys(candidate) : [],
				finishReason: candidate?.finishReason || null,
				partCount: parts.length,
				textPartCount: parts.filter((part) => typeof part.text === 'string').length,
				responseTextLength: parts.reduce((length, part) => length + (typeof part.text === 'string' ? part.text.length : 0), 0),
				groundingMetadataKeys: groundingMetadata ? Object.keys(groundingMetadata) : [],
				groundingChunkCount: groundingChunksFromResponse.length,
				groundingChunks: groundingChunksFromResponse.map((chunk) => ({
					webKeys: chunk.web ? Object.keys(chunk.web) : [],
					title: typeof chunk.web?.title === 'string' ? chunk.web.title : null,
					uri: typeof chunk.web?.uri === 'string' ? chunk.web.uri : null,
				})),
				searchEntryPointPresent: Boolean(groundingMetadata?.searchEntryPoint),
				groundingSupportsCount: Array.isArray(groundingMetadata?.groundingSupports) ? groundingMetadata.groundingSupports.length : 0,
				citationSourceCount: Array.isArray(citationMetadata?.citationSources) ? citationMetadata.citationSources.length : 0,
			}, null, 2));
		}
		const responseText = parts.map((part) => typeof part.text === 'string' ? part.text : '').join('').trim();
		const groundingChunks = groundingChunksFromResponse;
		const results: GoogleSearchResult[] = [];
		const seenUrls = new Set<string>();
		for (const chunk of groundingChunks) {
			const sourceUrl = typeof chunk.web?.uri === 'string' ? chunk.web.uri.trim() : '';
			const title = typeof chunk.web?.title === 'string' ? chunk.web.title.trim() : '';
			try {
				if (!sourceUrl || !title) continue;
				const resolvedUrl = await resolveGroundingUrl(sourceUrl);
				if (!resolvedUrl || seenUrls.has(resolvedUrl)) continue;
				seenUrls.add(resolvedUrl);
				results.push({ title, url: resolvedUrl, snippet: responseText.slice(0, 200) });
				if (results.length >= normalizedCount) break;
			} catch {
				continue;
			}
		}
		if (debug) console.info('[google-search-gemini] Response', JSON.stringify({ query, groundingChunkCount: groundingChunks.length, count: results.length, results }));
		return results;
	} catch (error) {
		console.error('[google-search-gemini] Search request failed:', JSON.stringify({ query, error: error instanceof Error ? error.message : String(error) }));
		return [];
	}
}
