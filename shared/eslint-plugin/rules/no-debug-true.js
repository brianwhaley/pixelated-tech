export const noDebugTrueRule = {
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Warn when `debug` is set to `true` in source files — ensure debug is disabled before shipping.',
			category: 'Best Practices',
			recommended: true,
		},
		messages: {
			debugOn: 'Found `debug = true` in source. Ensure debug is disabled or gated behind a dev-only flag before shipping.',
		},
		schema: [],
	},
	create(context) {
		const filename = context.sourceCode?.filename || '';
		if (filename.includes('/src/tests/') || filename.includes('/src/test/') || filename.includes('/src/stories/')) {
			return {};
		}

		function isDebugName(n) {
			return typeof n === 'string' && /^debug$/i.test(n);
		}

		return {
			VariableDeclarator(node) {
				if (node.id && node.id.type === 'Identifier' && isDebugName(node.id.name) && node.init && node.init.type === 'Literal' && node.init.value === true) {
					context.report({ node: node.id, messageId: 'debugOn' });
				}

				if (node.init && node.init.type === 'ObjectExpression') {
					node.init.properties.forEach(p => {
						const key = p.key && (p.key.name || p.key.value);
						if (isDebugName(key) && p.value && p.value.type === 'Literal' && p.value.value === true) {
							context.report({ node: p, messageId: 'debugOn' });
						}
					});
				}
			},

			AssignmentExpression(node) {
				if (node.left.type === 'Identifier' && isDebugName(node.left.name) && node.right.type === 'Literal' && node.right.value === true) {
					context.report({ node: node.left, messageId: 'debugOn' });
				}
				if (node.left.type === 'MemberExpression') {
					const prop = node.left.property;
					const propName = prop && (prop.name || prop.value);
					if (isDebugName(propName) && node.right.type === 'Literal' && node.right.value === true) {
						context.report({ node: node.left, messageId: 'debugOn' });
					}
				}
			},
		};
	},
};
