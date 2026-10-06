const semanticNames = new Set(['main', 'article', 'section', 'nav', 'header']);

function getStaticAttributeValue(attribute) {
	if (!attribute) {
		return null;
	}

	if (attribute.value?.type === 'Literal' && typeof attribute.value.value === 'string') {
		return attribute.value.value;
	}

	if (
		attribute.value?.type === 'JSXExpressionContainer' &&
		attribute.value.expression?.type === 'Literal' &&
		typeof attribute.value.expression.value === 'string'
	) {
		return attribute.value.expression.value;
	}

	return null;
}

export const preferSemanticHtmlRule = {
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Prefer semantic elements over divs named after semantic elements',
			category: 'SEO',
			recommended: true,
		},
		messages: {
			semanticDiv: 'Use the semantic <{{element}}> element instead of a <div> with a matching id or className.',
		},
		schema: [],
	},
	create(context) {
		return {
			JSXOpeningElement(node) {
				if (node.name.type !== 'JSXIdentifier' || node.name.name !== 'div') {
					return;
				}

				const idAttribute = node.attributes.find(attribute => attribute.name?.name === 'id');
				const classAttribute = node.attributes.find(attribute => attribute.name?.name === 'className');
				const idValue = getStaticAttributeValue(idAttribute);
				const classValue = getStaticAttributeValue(classAttribute);
				const semanticElement = semanticNames.has(idValue)
					? idValue
					: classValue?.split(/\s+/).find(className => semanticNames.has(className));

				if (semanticElement) {
					context.report({ node, messageId: 'semanticDiv', data: { element: semanticElement } });
				}
			},
		};
	},
};