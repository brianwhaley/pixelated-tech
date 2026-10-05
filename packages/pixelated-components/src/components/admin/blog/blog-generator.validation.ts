export type BlogCriteria = {
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
		minimumInternalLinks?: number;
		minimumExternalLinks?: number;
		requiredCallToActionLink?: string;
		requireWordPressBlocks?: boolean;
		requiredCallToActionHeading?: string;
	};
};

export function normalizeObjectiveCriteria(objective: BlogCriteria['objectiveCriteria'] = {}): NonNullable<BlogCriteria['objectiveCriteria']> {
	return {
		...objective,
		minimumWords: objective.minimumWords ?? objective.minimum_words as number | undefined,
		maximumWords: objective.maximumWords ?? objective.maximum_words as number | undefined,
		requireIntroParagraph: objective.requireIntroParagraph ?? objective.require_intro_paragraph as boolean | undefined,
		requireConclusionParagraph: objective.requireConclusionParagraph ?? objective.require_conclusion_paragraph as boolean | undefined,
		requireCallToAction: objective.requireCallToAction ?? objective.require_call_to_action as boolean | undefined,
		minimumBodyParagraphs: objective.minimumBodyParagraphs ?? objective.minimum_body_paragraphs as number | undefined,
		minimumParagraphSentences: objective.minimumParagraphSentences ?? objective.minimum_paragraph_sentences as number | undefined,
		minimumInternalLinks: objective.minimumInternalLinks ?? objective.minimum_internal_links as number | undefined,
		minimumExternalLinks: objective.minimumExternalLinks ?? objective.minimum_external_links as number | undefined,
		requiredCallToActionLink: objective.requiredCallToActionLink ?? objective.required_call_to_action_link as string | undefined,
		requireWordPressBlocks: objective.requireWordPressBlocks ?? objective.require_wordpress_blocks as boolean | undefined,
		requiredCallToActionHeading: objective.requiredCallToActionHeading ?? objective.required_call_to_action_heading as string | undefined,
	};
}

export type BlogArticleMetrics = {
	wordCount: number;
	paragraphsIncluded: number;
	bodyParagraphsIncluded: number;
	contentParagraphSentenceCounts: number[];
	introductionIncluded: boolean;
	conclusionIncluded: boolean;
	listBlocksIncluded: number;
	listItemsIncluded: number;
	h2HeadingsIncluded: number;
	internalLinksIncluded: number;
	externalLinksIncluded: number;
	sentenceCount: number;
	callToActionIncluded: boolean;
	requiredCallToActionHeadingIncluded: boolean;
	requiredCallToActionLinkIncluded: boolean;
	wordpressBlocksIncluded: boolean;
};

function getLinks(article: string): string[] {
	return [...article.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi)].map((match) => match[1]);
}

function getText(html: string): string {
	return html
		.replace(/<[^>]*>/g, ' ')
		.replace(/&(?:nbsp|amp|lt|gt|quot|#39);/gi, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function countSentences(html: string): number {
	const text = getText(html);
	return text ? (text.match(/[.!?]+(?=\s|$)/g) || []).length : 0;
}

function isInternalLink(href: string, siteHost: string): boolean {
	if (href === '#') return false;
	if (href.startsWith('/') || href.startsWith('#')) return true;
	try {
		const url = new URL(href);
		return url.hostname.replace(/^www\./, '') === siteHost.replace(/^www\./, '');
	} catch {
		return false;
	}
}

export function measureBlogArticle(article: string, siteHost: string, criteria?: BlogCriteria): BlogArticleMetrics {
	const paragraphs = [...article.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((match) => match[1]);
	const links = getLinks(article);
	const text = getText(article);
	const objective = normalizeObjectiveCriteria(criteria?.objectiveCriteria);
	const requiresCallToAction = Boolean(objective.requireCallToAction || objective.requiredCallToActionLink);
	const lastParagraph = paragraphs.at(-1);
	const lastParagraphText = lastParagraph ? getText(lastParagraph) : '';
	const hasCallToActionLanguage = /\b(contact|call|schedule|book|request|get|start|learn|sign up|estimate|assessment|quote)\b/i.test(lastParagraphText);
	const hasRequiredCallToActionLink = Boolean(objective.requiredCallToActionLink && lastParagraph && getLinks(lastParagraph).includes(objective.requiredCallToActionLink));
	const callToActionIncluded = requiresCallToAction && (hasCallToActionLanguage || hasRequiredCallToActionLink);
	const contentParagraphs = callToActionIncluded ? paragraphs.slice(0, -1) : paragraphs;
	const headings = [...article.matchAll(/<h[2-6]\b[^>]*>([\s\S]*?)<\/h[2-6]>/gi)].map((match) => getText(match[1]));
	const requiredCallToActionHeading = objective.requiredCallToActionHeading;
	const requiredCallToActionHeadingIncluded = Boolean(requiredCallToActionHeading && headings.some((heading) => heading.toLowerCase() === requiredCallToActionHeading.toLowerCase()));
	return {
		wordCount: text ? text.split(/\s+/).length : 0,
		paragraphsIncluded: paragraphs.length,
		bodyParagraphsIncluded: Math.max(contentParagraphs.length - 2, 0),
		contentParagraphSentenceCounts: contentParagraphs.map((paragraph) => countSentences(paragraph)),
		introductionIncluded: contentParagraphs.length > 0,
		conclusionIncluded: contentParagraphs.length > 1,
		listBlocksIncluded: [...article.matchAll(/<(?:ul|ol)\b[^>]*>/gi)].length,
		listItemsIncluded: [...article.matchAll(/<li\b[^>]*>[\s\S]*?<\/li>/gi)].length,
		h2HeadingsIncluded: [...article.matchAll(/<h2\b[^>]*>[\s\S]*?<\/h2>/gi)].length,
		internalLinksIncluded: links.filter((href) => isInternalLink(href, siteHost)).length,
		externalLinksIncluded: links.filter((href) => {
			try {
				const url = new URL(href);
				return (url.protocol === 'http:' || url.protocol === 'https:') && !isInternalLink(href, siteHost);
			} catch {
				return false;
			}
		}).length,
		sentenceCount: countSentences(article),
		callToActionIncluded,
		requiredCallToActionHeadingIncluded,
		requiredCallToActionLinkIncluded: hasRequiredCallToActionLink,
		wordpressBlocksIncluded: /<!--\s*wp:/i.test(article) && /<!--\s*\/wp:/i.test(article),
	};
}

export function validateBlogArticle(article: string, criteria: BlogCriteria | undefined, siteHost: string): string[] {
	if (!criteria) return [];
	const errors: string[] = [];
	const objective = normalizeObjectiveCriteria(criteria.objectiveCriteria);
	const metrics = measureBlogArticle(article, siteHost, criteria);
	if (objective.requireWordPressBlocks && !metrics.wordpressBlocksIncluded) {
		errors.push('WordPress block markup is missing');
	}
	const wordCount = metrics.wordCount;
	const minimumWords = objective.minimumWords;
	const maximumWords = objective.maximumWords;
	if (minimumWords !== undefined && wordCount < minimumWords) errors.push(`word count is ${wordCount}; minimum is ${minimumWords}`);
	if (maximumWords !== undefined && wordCount > maximumWords) errors.push(`word count is ${wordCount}; maximum is ${maximumWords}`);
	if (objective.requireIntroParagraph && !metrics.introductionIncluded) errors.push('introduction paragraph is missing');
	if (objective.requireConclusionParagraph && !metrics.conclusionIncluded) errors.push('conclusion paragraph is missing');
	if (objective.minimumBodyParagraphs !== undefined && metrics.bodyParagraphsIncluded < objective.minimumBodyParagraphs) {
		errors.push(`body paragraph count is ${metrics.bodyParagraphsIncluded}; minimum is ${objective.minimumBodyParagraphs}`);
	}
	if (objective.minimumParagraphSentences !== undefined) {
		metrics.contentParagraphSentenceCounts.forEach((sentenceCount, index) => {
			if (sentenceCount < objective.minimumParagraphSentences!) {
				errors.push(`content paragraph ${index + 1} has ${sentenceCount} sentences; minimum is ${objective.minimumParagraphSentences}`);
			}
		});
	}
	if (objective.requireCallToAction && !metrics.callToActionIncluded) errors.push('call to action paragraph is missing');
	if (objective.minimumInternalLinks !== undefined && metrics.internalLinksIncluded < objective.minimumInternalLinks) errors.push(`internal link count is ${metrics.internalLinksIncluded}; minimum is ${objective.minimumInternalLinks}`);
	if (objective.minimumExternalLinks !== undefined && metrics.externalLinksIncluded < objective.minimumExternalLinks) errors.push(`external link count is ${metrics.externalLinksIncluded}; minimum is ${objective.minimumExternalLinks}`);
	if (objective.requiredCallToActionHeading && !metrics.requiredCallToActionHeadingIncluded) {
		errors.push(`required call to action heading is missing: ${objective.requiredCallToActionHeading}`);
	}
	if (objective.requiredCallToActionLink && !metrics.requiredCallToActionLinkIncluded) {
		errors.push(`call to action is missing required link ${objective.requiredCallToActionLink}`);
	}
	return errors;
}
