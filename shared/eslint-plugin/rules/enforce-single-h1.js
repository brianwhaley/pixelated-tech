export const enforceSingleH1Rule = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Require exactly one h1 in page entry files',
			category: 'SEO',
			recommended: true,
		},
		messages: {
			exactlyOneH1: 'Page files must contain exactly one <h1> or <PageTitleHeader>; found {{count}} title providers.',
		},
		schema: [],
	},
	create(context) {
		const filename = context.getFilename();
		let titleProviderCount = 0;

		if (!/(?:^|[\\/])(page|index)\.[cm]?[jt]sx?$/.test(filename)) {
			return {};
		}

		return {
			JSXOpeningElement(node) {
				if (
					node.name.type === 'JSXIdentifier' &&
					(node.name.name === 'h1' || node.name.name === 'PageTitleHeader')
				) {
					titleProviderCount += 1;
				}
			},
			'Program:exit'(node) {
				if (titleProviderCount !== 1) {
					context.report({ node, messageId: 'exactlyOneH1', data: { count: titleProviderCount } });
				}
			},
		};
	},
};