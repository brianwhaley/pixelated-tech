export const noDirectFetchRule = {
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Warn when fetch() is used directly instead of smartFetch. smartFetch provides caching, retries, error handling, and timeout support.',
			category: 'Best Practices',
			recommended: true,
		},
		fixable: false,
		schema: [],
		messages: {
			useSmartFetch: 'Use smartFetch instead of direct fetch(). smartFetch provides caching, retries, proper error handling, timeouts, and proxy fallback. See components/general/smartfetch.ts for details.',
		},
	},
	create(context) {
		const filename = context.sourceCode?.filename || '';

		if (
			filename.includes('node_modules') ||
			filename.includes('eslint.config') ||
			filename.includes('.old.') ||
			filename.endsWith('.old.js') ||
			filename.endsWith('.old.ts') ||
			filename.includes('/scripts/') ||
			filename.includes('/build/') ||
			filename.endsWith('/smartfetch.ts')
		) {
			return {};
		}

		return {
			CallExpression(node) {
				if (node.callee.type === 'Identifier' && node.callee.name === 'fetch') {
					context.report({ node, messageId: 'useSmartFetch' });
				}
			},
		};
	},
};
