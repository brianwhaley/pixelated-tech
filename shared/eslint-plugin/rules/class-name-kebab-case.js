export const classNameKebabCaseRule = {
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Enforce kebab-case for JSX className values',
			category: 'Stylistic',
			recommended: true,
		},
		messages: {
			invalidClass: 'Class name "{{className}}" should be kebab-case (e.g. "callout-title-text").',
		},
		schema: [],
	},
	create(context) {
		const kebabRe = /^[a-z0-9]+(-[a-z0-9]+)*$/;
		return {
			JSXAttribute(node) {
				if (!node.name) return;
				const name = node.name.name;
				if (name !== 'className' && name !== 'class') return;

				const value = node.value;
				if (!value) return;

				let text = null;
				if (value.type === 'Literal') text = value.value;
				else if (value.type === 'JSXExpressionContainer') {
					if (value.expression && value.expression.type === 'Literal') text = value.expression.value;
					else if (value.expression && value.expression.type === 'TemplateLiteral') {
						text = value.expression.quasis.map(q => q.value.cooked).join(' ');
					}
				}
				if (typeof text !== 'string') return;

				const parts = text.split(/\s+/).filter(Boolean);
				for (const part of parts) {
					if (!kebabRe.test(part)) {
						context.report({ node, messageId: 'invalidClass', data: { className: part } });
					}
				}
			},
		};
	},
};
