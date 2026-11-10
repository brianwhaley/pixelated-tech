import { findSecretMatches } from '../../../packages/pixelated-components/src/scripts/secret-scanning.js';

export const noSecretLiteralsRule = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Prevent credential-shaped secrets in source code and tests',
			category: 'Security',
			recommended: true,
		},
		fixable: false,
		schema: [],
		messages: {
			secretLiteral: 'Credential-shaped {{rule}} detected in a literal. Use configuration or a safe test placeholder.',
		},
	},
	create(context) {
		function checkLiteral(node, value) {
			if (typeof value !== 'string') return;
			const findings = findSecretMatches(value);
			for (const finding of findings) {
				context.report({
					node,
					messageId: 'secretLiteral',
					data: { rule: finding.rule },
				});
			}
		}

		return {
			Literal(node) {
				checkLiteral(node, node.value);
			},
			TemplateLiteral(node) {
				for (const quasi of node.quasis) checkLiteral(quasi, quasi.value.raw);
			},
		};
	},
};
