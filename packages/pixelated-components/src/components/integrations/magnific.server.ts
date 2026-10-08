"use server";

import { smartFetch } from '../foundation/smartfetch';
import { buildUrl } from '../foundation/urlbuilder';
import { downloadCloudinaryTransformedImage } from './cloudinary.server';

const magnificApiUrl = 'https://api.magnific.com';

export type MagnificStockImage = {
	id: string;
	title: string;
	sourceUrl: string;
	detailUrl?: string;
	licenseUrl?: string;
	provider?: string;
	orientation?: string;
	downloads?: number;
	likes?: number;
};

export type MagnificImageSearchInput = {
	title: string;
	imageBrief: string;
	searchTerms: string[];
};

export type PreparedStockImage = MagnificStockImage & {
	buffer: Buffer;
	mimeType: 'image/webp';
};

type MagnificResource = Record<string, unknown>;

function stringValue(...values: unknown[]): string | undefined {
	return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim();
}

function tokenize(value: string): string[] {
	return value.toLowerCase().match(/[a-z0-9]+/g) || [];
}

const rejectedPhotoTerms = new Set([
	'ai', 'background', 'christmas', 'generated', 'halloween', 'icon', 'illustration', 'logo', 'mockup', 'psd', 'seasonal', 'vector',
]);
const ignoredContextTerms = new Set(['a', 'an', 'and', 'for', 'from', 'in', 'is', 'of', 'on', 'or', 'the', 'to', 'with', 'why']);

function normalizeResource(resource: MagnificResource, index: number): MagnificStockImage | null {
	const image = resource.image && typeof resource.image === 'object' ? resource.image as MagnificResource : undefined;
	const imageSource = image?.source && typeof image.source === 'object' ? image.source as MagnificResource : undefined;
	const sourceUrl = stringValue(imageSource?.url, resource.downloadUrl, resource.imageUrl, resource.src, resource.previewUrl);
	const type = stringValue(image?.type, resource.type, resource.kind, resource.category)?.toLowerCase();
	const title = stringValue(resource.title, resource.name, resource.description) || 'Magnific stock image';
	const searchableText = `${title} ${type || ''} ${sourceUrl}`.toLowerCase();
	const aiGenerated = resource.isAiGenerated === true || resource.aiGenerated === true || Boolean(type && (type.includes('ai') || type.includes('generated')));
	const hasRejectedTerm = tokenize(searchableText).some((token) => rejectedPhotoTerms.has(token));
	const isLineArt = /\bline[\s-]?art\b/.test(searchableText);
	if (!sourceUrl || type !== 'photo' || aiGenerated || hasRejectedTerm || isLineArt) return null;
	const stats = resource.stats && typeof resource.stats === 'object' ? resource.stats as MagnificResource : undefined;
	const downloads = typeof stats?.downloads === 'number' && Number.isFinite(stats.downloads) ? stats.downloads : undefined;
	const likes = typeof stats?.likes === 'number' && Number.isFinite(stats.likes) ? stats.likes : undefined;
	return {
		id: stringValue(resource.id, resource.resourceId, resource.assetId) || `magnific-resource-${index + 1}`,
		title,
		sourceUrl,
		detailUrl: stringValue(resource.detailUrl, resource.pageUrl, resource.sourcePageUrl, resource.url),
		licenseUrl: stringValue(resource.licenseUrl, resource.licenseURL, resource.license, (Array.isArray(resource.licenses) ? (resource.licenses[0] as MagnificResource | undefined)?.url : undefined)),
		provider: stringValue(resource.provider, resource.source, resource.photographer, (resource.author && typeof resource.author === 'object' ? (resource.author as MagnificResource).name : undefined)),
		orientation: stringValue(image?.orientation, resource.orientation),
		downloads,
		likes,
	};
}

function scoreImage(image: MagnificStockImage, input: MagnificImageSearchInput): { score: number; contextMatches: number } {
	const searchTokens = new Set(input.searchTerms.flatMap(tokenize));
	const contextTokens = new Set([...tokenize(input.title), ...tokenize(input.imageBrief)].filter((token) => !ignoredContextTerms.has(token)));
	const imageTokens = new Set(tokenize(`${image.title} ${image.provider || ''}`));
	let score = 0;
	let contextMatches = 0;
	for (const token of imageTokens) {
		if (searchTokens.has(token)) score += 3;
		if (contextTokens.has(token)) {
			contextMatches += 1;
			if (!searchTokens.has(token)) score += 1;
		}
	}
	return { score, contextMatches };
}

async function fetchMagnificResources(apiKey: string, term: string): Promise<MagnificResource[]> {
	const url = buildUrl({
		baseUrl: magnificApiUrl,
		pathSegments: ['v1', 'resources'],
		params: {
			term,
			order: 'relevance',
			limit: 10,
			'filters[content_type][photo]': '1',
			'filters[ai-generated][excluded]': '1',
		},
	});
	const response = await smartFetch(url, {
		timeout: 30000,
		retries: 0,
		requestInit: { headers: { 'x-magnific-api-key': apiKey } },
	});
	if (!response || typeof response !== 'object') return [];
	const record = response as Record<string, unknown>;
	for (const key of ['resources', 'results', 'items', 'data']) {
		if (Array.isArray(record[key])) {
			return record[key].filter((item): item is MagnificResource => Boolean(item && typeof item === 'object'));
		}
	}
	return [];
}

export async function findMagnificStockImage(apiKey: string, input: MagnificImageSearchInput): Promise<MagnificStockImage | null> {
	if (!apiKey || input.searchTerms.length === 0) return null;
	const resources = (await Promise.all([...new Set(input.searchTerms.map((term) => term.trim()).filter(Boolean))].map((term) => fetchMagnificResources(apiKey, term)))).flat();
	const images = new Map<string, MagnificStockImage>();
	for (const [index, resource] of resources.entries()) {
		const image = normalizeResource(resource, index);
		if (image) images.set(image.id, image);
	}
	const matchedImages = [...images.values()]
		.map((image) => ({
			image,
			...scoreImage(image, input),
			popularity: Math.log10(1 + (image.downloads || 0)) + Math.log10(1 + (image.likes || 0)),
		}))
		.filter(({ score, contextMatches }) => score >= 3 && contextMatches >= 2)
		.sort((left, right) => right.score - left.score)
		.slice(0, 5);
	if (matchedImages.length === 0) return null;
	const strongestMatch = matchedImages[0].score;
	return matchedImages
		.sort((left, right) => {
			if (strongestMatch - left.score > 1 || strongestMatch - right.score > 1) return right.score - left.score;
			return right.popularity - left.popularity || right.score - left.score;
		})[0].image;
}

export async function prepareMagnificStockImage(image: MagnificStockImage, cloudinary: { product_env: string; baseUrl?: string }): Promise<PreparedStockImage> {
	const processed = await downloadCloudinaryTransformedImage({
		sourceUrl: image.sourceUrl,
		productEnv: cloudinary.product_env,
		cloudinaryDomain: cloudinary.baseUrl,
	});
	return {
		...image,
		buffer: processed.buffer,
		mimeType: processed.mimeType,
	};
}