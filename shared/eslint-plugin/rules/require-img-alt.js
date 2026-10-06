function getJsxName(node) {
	if (node.type === 'JSXIdentifier') {
		return node.name;
	}

	if (node.type === 'JSXMemberExpression' && node.property.type === 'JSXIdentifier') {
		return node.property.name;
	}

	return null;
}

export const requireImgAltRule = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Require alt text on native images and SmartImage components',
			category: 'SEO',
			recommended: true,
		},
		messages: {
			missingAlt: 'Images must include an alt attribute, including decorative images with alt="".',
		},
		schema: [],
	},
	create(context) {
		return {
			JSXOpeningElement(node) {
				const name = getJsxName(node.name);
				if ((name === 'img' || name === 'SmartImage') && !node.attributes.some(attribute => attribute.name?.name === 'alt')) {
					context.report({ node, messageId: 'missingAlt' });
				}
			},
		};
	},
};