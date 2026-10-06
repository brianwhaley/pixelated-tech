function getHeadingLevel(node) {
	if (node.name.type !== 'JSXIdentifier') {
		return null;
	}

	const match = /^h([1-6])$/.exec(node.name.name);
	return match ? Number(match[1]) : null;
}

export const noSkippedHeadingLevelsRule = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Disallow skipped heading levels in JSX source order',
			category: 'SEO',
			recommended: true,
		},
		messages: {
			skippedLevel: 'Heading level h{{level}} skips over h{{expected}}.',
		},
		schema: [],
	},
	create(context) {
		let previousLevel = null;

		return {
			JSXOpeningElement(node) {
				const level = getHeadingLevel(node);
				if (level === null) {
					return;
				}

				if (previousLevel !== null && level > previousLevel + 1) {
					context.report({
						node,
						messageId: 'skippedLevel',
						data: { level, expected: previousLevel + 1 },
					});
				}

				previousLevel = level;
			},
		};
	},
};