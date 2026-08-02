import fs from 'fs';
import path from 'path';
import { escapeRegExp, getContextFilename } from './eslint-rules-helpers.js';

const ambiguousPronouns = [
	// 'it',
	// 'its',
	'we',
	'us',
	'our',
	'my',
	'me',
	'I',
	'mine',
];
const ambiguousPronounPattern = new RegExp(`\\b(?:${ambiguousPronouns.map(escapeRegExp).join('|')})\\b`, 'gi');
const pronounExceptions = new Set(['US']);
const sentenceSplitPattern = /(?<=[.?!])\s+|\n+/g;

function normalizeText(value) {
	return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function findNearestPixelatedConfig(startDir) {
	let current = path.resolve(startDir);
	while (true) {
		for (const relativePath of [
			'src/app/config/pixelated.config.json',
			'src/config/pixelated.config.json',
			'pixelated.config.json',
			'.next/server/pixelated.config.json',
			'dist/config/pixelated.config.json',
		]) {
			const candidate = path.join(current, relativePath);
			if (fs.existsSync(candidate)) return candidate;
		}

		const parent = path.dirname(current);
		if (parent === current) break;
		current = parent;
	}
	return null;
}

function loadPixelatedConfig(context) {
	const filename = getContextFilename(context);
	const startDir = filename && filename !== '<input>' && filename !== '<text>'
		? path.dirname(path.resolve(filename))
		: process.cwd();

	const configPath = findNearestPixelatedConfig(startDir) || findNearestPixelatedConfig(process.cwd());
	if (!configPath) return null;

	try {
		const raw = fs.readFileSync(configPath, 'utf8');
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

function getBrandName(options, context) {
	if (options && typeof options.brandName === 'string' && options.brandName.trim()) {
		return options.brandName.trim();
	}

	const config = loadPixelatedConfig(context);
	return config?.siteInfo?.name?.trim() || config?.siteInfo?.brand?.name?.trim() || null;
}

function buildBrandPattern(brandName) {
	if (!brandName) return null;
	const normalizedName = normalizeText(brandName);
	const tokens = Array.from(new Set(normalizedName.split(/\s+/).filter((token) => token.length >= 3)));
	const expressions = [escapeRegExp(normalizedName), ...tokens.map(escapeRegExp)];
	return new RegExp(`\\b(?:${expressions.join('|')})\\b`, 'i');
}

function splitSentences(text) {
	return String(text)
		.split(sentenceSplitPattern)
		.map((sentence) => sentence.trim())
		.filter(Boolean);
}

function containsBrand(sentence, brandPattern) {
	if (!brandPattern) return false;
	return brandPattern.test(sentence);
}

function findAmbiguousPronoun(sentence) {
	const match = sentence.match(ambiguousPronounPattern);
	if (!match) return null;
	const pronoun = Array.isArray(match) ? match[0] : match;
	return pronounExceptions.has(pronoun) ? null : pronoun;
}

export const strictPronounResolutionRule = {
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Warn when ambiguous pronouns appear in editorial copy so brand references remain explicit.',
			category: 'Best Practices',
			recommended: true,
		},
		messages: {
			ambiguousPronoun: 'Avoid ambiguous pronoun "{{pronoun}}" in editorial copy; use an explicit noun or brand reference instead.',
		},
		schema: [
			{
				type: 'object',
				properties: {
					brandName: { type: 'string' },
				},
				additionalProperties: false,
			},
		],
	},
	create(context) {
		const brandName = getBrandName(context.options[0] || {}, context);
		const brandPattern = buildBrandPattern(brandName);

		function reportText(node, text) {
			if (typeof text !== 'string' || text.trim().length === 0) return;
			const sentences = splitSentences(text);
			const brandFlags = sentences.map((sentence) => containsBrand(sentence, brandPattern));

			for (let index = 0; index < sentences.length; index += 1) {
				const sentence = sentences[index];
				const pronoun = findAmbiguousPronoun(sentence);
				if (!pronoun) continue;

				if (!brandPattern) {
					context.report({ node, messageId: 'ambiguousPronoun', data: { pronoun } });
					return;
				}

				const hasNearbyBrand = brandFlags[index] || brandFlags[index - 1] || brandFlags[index + 1];
				if (!hasNearbyBrand) {
					context.report({ node, messageId: 'ambiguousPronoun', data: { pronoun } });
					return;
				}
			}
		}

		function getTemplateText(node) {
			return node.quasis.map((quasi) => quasi.value.cooked || '').join(' ');
		}

		function getJsxAttributeText(node) {
			if (!node || !node.value) return null;
			if (node.value.type === 'Literal' && typeof node.value.value === 'string') {
				return node.value.value;
			}
			if (node.value.type === 'JSXExpressionContainer' && node.value.expression?.type === 'Literal' && typeof node.value.expression.value === 'string') {
				return node.value.expression.value;
			}
			return null;
		}

		return {
			JSXText(node) {
				reportText(node, node.value);
			},
			JSXAttribute(node) {
				const text = getJsxAttributeText(node);
				if (text) reportText(node, text);
			},
			Literal(node) {
				if (typeof node.value === 'string') {
					reportText(node, node.value);
				}
			},
			TemplateLiteral(node) {
				reportText(node, getTemplateText(node));
			},
			Member(node) {
				const value = node.value;
				if (value?.type === 'String' && typeof value.value === 'string') {
					reportText(value, value.value);
				}
			},
			Element(node) {
				const value = node.value;
				if (value?.type === 'String' && typeof value.value === 'string') {
					reportText(value, value.value);
				}
			},
		};
	},
};
