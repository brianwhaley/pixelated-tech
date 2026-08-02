const genericCtaTextMatcher = [
	'click here',
	'source',
	'read more',
	'learn more',
	'more info',
	'see more',
	'view more',
	'details',
];

function normalizeCtaText(value) {
	return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

function getStringFromJsxNode(node) {
	if (!node) return null;
	if (node.type === 'JSXText') return node.value;
	if (node.type === 'JSXExpressionContainer' && node.expression) {
		const expression = node.expression;
		if (expression.type === 'Literal' && typeof expression.value === 'string') return expression.value;
		if (expression.type === 'TemplateLiteral' && expression.expressions.length === 0) {
			return expression.quasis.map((q) => q.value.cooked).join('');
		}
	}
	return null;
}

function isGenericCtaText(value) {
	const normalized = normalizeCtaText(value);
	return genericCtaTextMatcher.includes(normalized);
}

export const noGenericCtaTextRule = {
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Warn when generic CTA text is used for links or CTA props.',
			category: 'Accessibility',
			recommended: true,
		},
		fixable: false,
		schema: [],
		messages: {
			genericCtaText: 'Avoid generic CTA text "{{text}}". Use more descriptive link or button copy.',
		},
	},
	create(context) {
		return {
			JSXElement(node) {
				const opening = node.openingElement;
				if (opening.name.type !== 'JSXIdentifier' || opening.name.name !== 'a') return;
				for (const child of node.children) {
					const text = getStringFromJsxNode(child);
					if (text && isGenericCtaText(text)) {
						context.report({ node: child, messageId: 'genericCtaText', data: { text: normalizeCtaText(text) } });
					}
				}
			},
			JSXAttribute(node) {
				if (node.name.type !== 'JSXIdentifier') return;
				const attrName = node.name.name;
				if (attrName !== 'buttonText' && attrName !== 'ctaLabel') return;
				const value = node.value;
				if (!value) return;
				let text = null;
				if (value.type === 'Literal' && typeof value.value === 'string') {
					text = value.value;
				} else if (value.type === 'JSXExpressionContainer') {
					const expression = value.expression;
					if (expression.type === 'Literal' && typeof expression.value === 'string') {
						text = expression.value;
					} else if (expression.type === 'TemplateLiteral' && expression.expressions.length === 0) {
						text = expression.quasis.map((q) => q.value.cooked).join('');
					}
				}
				if (text && isGenericCtaText(text)) {
					context.report({ node: value, messageId: 'genericCtaText', data: { text: normalizeCtaText(text) } });
				}
			},
		};
	},
};
