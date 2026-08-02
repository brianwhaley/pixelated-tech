import { isClientComponent } from './eslint-rules-helpers.js';

export const propTypesJsdocRule = {
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Require JSDoc for components using PropTypes (either a JSDoc block above propTypes or inline comments for props)',
			category: 'Documentation',
			recommended: true,
		},
		messages: {
			missingJsDoc: 'Component "{{componentName}}" propTypes should have a JSDoc comment above propTypes or inline per-prop comments.',
		},
		schema: [],
	},
	create(context) {
		return {
			AssignmentExpression(node) {
				if (
					node.left &&
					node.left.type === 'MemberExpression' &&
					node.left.property &&
					node.left.property.name === 'propTypes'
				) {
					const componentName = node.left.object.name;
					const sourceCode = context.sourceCode || context.getSourceCode?.();
					const fileContent = sourceCode.text;
					if (!isClientComponent(fileContent)) return;

					const comments = sourceCode.getCommentsBefore(node);
					const hasJSDoc = comments.some(c => c.type === 'Block' && c.value.startsWith('*') && c.value.includes('@param'));

					let hasInline = false;
					if (node.right && node.right.properties) {
						for (const prop of node.right.properties) {
							const pc = sourceCode.getCommentsBefore(prop);
							if (pc && pc.length > 0) {
								hasInline = true;
								break;
							}
						}
					}

					if (!hasJSDoc && !hasInline) {
						context.report({ node, messageId: 'missingJsDoc', data: { componentName } });
					}
				}
			},
		};
	},
};
