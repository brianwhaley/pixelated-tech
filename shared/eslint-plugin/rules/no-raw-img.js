export const noRawImgRule = {
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Prevent usage of raw <img> tags in favor of SmartImage',
			category: 'Performance',
			recommended: true,
		},
		messages: {
			useSmartImage: 'Use <SmartImage /> instead of raw <img> for better performance and CDN support.',
		},
		schema: [],
	},
	create(context) {
		return {
			JSXOpeningElement(node) {
				if (node.name.name === 'img') {
					context.report({ node, messageId: 'useSmartImage' });
				}
			},
		};
	},
};
