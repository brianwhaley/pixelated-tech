export const requireSectionIdsRule = {
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Require `id` attributes on every <section> and <PageSection> for jump links and SEO',
			category: 'Accessibility',
			recommended: false,
		},
		messages: {
			missingId: '`section` and `PageSection` elements must have an `id` attribute for jump-link support and SEO hierarchy.',
		},
		schema: [],
	},
	create(context) {
		function getJSXElementName(node) {
			if (!node) return null;
			if (node.type === 'JSXIdentifier') return node.name;
			if (node.type === 'JSXMemberExpression') return node.property?.name || null;
			return null;
		}

		return {
			JSXOpeningElement(node) {
				try {
					const name = getJSXElementName(node.name);
					if (!name || !['section', 'PageSection'].includes(name)) return;

					const hasId = (node.attributes || []).some(attr => (
						attr.type === 'JSXAttribute' &&
						attr.name && attr.name.name === 'id' &&
						attr.value != null
					));
					if (!hasId) {
						context.report({ node, messageId: 'missingId' });
					}
				} catch {
					// defensive: don't crash lint
				}
			},
		};
	},
};
