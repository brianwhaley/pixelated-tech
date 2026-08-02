function tokenizeText(text) {
	return String(text)
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.split(' ')
		.map(token => token.trim())
		.filter(Boolean);
}

function calculateEntropy(tokens) {
	if (!tokens || tokens.length === 0) return 0;
	const counts = tokens.reduce((acc, token) => {
		acc[token] = (acc[token] || 0) + 1;
		return acc;
	}, {});

	const total = tokens.length;
	return Object.values(counts).reduce((entropy, count) => {
		const probability = count / total;
		return entropy - probability * Math.log2(probability);
	}, 0);
}

function calculateInformationGain(baseText, candidateText) {
	const baseTokens = tokenizeText(baseText);
	const candidateTokens = tokenizeText(candidateText);

	const baseEntropy = calculateEntropy(baseTokens);
	const candidateEntropy = calculateEntropy(candidateTokens);

	return candidateEntropy - baseEntropy;
}

export const noLowInformationCopyRule = {
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Warn when button/label copy is too low-information and should be more descriptive.',
			category: 'Accessibility',
			recommended: true,
		},
		fixable: false,
		schema: [
			{
				type: 'object',
				properties: {
					threshold: { type: 'number', minimum: 0 },
				},
				additionalProperties: false,
			},
		],
		messages: {
			lowInformationCopy: 'Text "{{text}}" is too low-information. Use a more descriptive label or button copy.',
		},
	},
	create(context) {
		const options = context.options[0] || {};
		const threshold = typeof options.threshold === 'number' ? options.threshold : 1.5;
		const genericBaseline = 'click here';

		function reportIfLowInformation(node, text) {
			if (!text || typeof text !== 'string') return;
			const value = text.trim();
			if (value.length === 0) return;
			const tokens = tokenizeText(value);
			if (tokens.length < 2) return;
			const entropy = calculateEntropy(tokens);
			const informationGain = calculateInformationGain(genericBaseline, value);
			if (entropy < threshold || informationGain < 0.5) {
				context.report({ node, messageId: 'lowInformationCopy', data: { text: value } });
			}
		}

		function getTextFromAttribute(node) {
			if (node.value == null) return null;
			if (node.value.type === 'Literal' && typeof node.value.value === 'string') return node.value.value;
			if (node.value.type === 'JSXExpressionContainer') {
				const expression = node.value.expression;
				if (expression.type === 'Literal' && typeof expression.value === 'string') return expression.value;
				if (expression.type === 'TemplateLiteral' && expression.expressions.length === 0) {
					return expression.quasis.map((q) => q.value.cooked).join('');
				}
			}
			return null;
		}

		return {
			JSXAttribute(node) {
				if (node.name.type !== 'JSXIdentifier') return;
				const attrName = node.name.name;
				if (!['buttonText', 'ctaLabel', 'alt', 'title', 'aria-label', 'placeholder', 'label'].includes(attrName)) return;
				const text = getTextFromAttribute(node);
				reportIfLowInformation(node, text);
			},
			JSXText(node) {
				reportIfLowInformation(node, node.value);
			},
		};
	}
};
