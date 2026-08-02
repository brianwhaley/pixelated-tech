import { ALLOWED_ENV_VARS } from './eslint-rules-helpers.js';

export const noProcessEnvRule = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Disallow runtime environment-variable reads in source; use `pixelated.config.json` instead. Exception: PIXELATED_CONFIG_KEY',
			category: 'Security',
			recommended: true,
		},
		messages: {
			forbiddenEnv: 'Direct access to environment variables is forbidden; use the config provider. Allowed exceptions: PIXELATED_CONFIG_KEY, PUPPETEER_EXECUTABLE_PATH.',
		},
		schema: [
			{
				type: 'object',
				properties: { allowed: { type: 'array', items: { type: 'string' } } },
				additionalProperties: false,
			},
		],
	},
	create(context) {
		const options = context.options[0] || {};
		const allowed = new Set((options.allowed || ALLOWED_ENV_VARS).map(String));

		function rootIsProcessEnv(node) {
			let cur = node;
			while (cur && cur.type === 'MemberExpression') {
				if (cur.object && cur.object.type === 'Identifier' && cur.object.name === 'process') {
					if (cur.property && ((cur.property.name === 'env') || (cur.property.value === 'env'))) return true;
				}
				cur = cur.object;
			}
			return false;
		}

		function reportIfForbidden(nameNode, node) {
			const keyName = nameNode && (nameNode.name || nameNode.value);
			if (!keyName) { context.report({ node, messageId: 'forbiddenEnv' }); return; }
			if (!allowed.has(keyName)) context.report({ node, messageId: 'forbiddenEnv' });
		}

		return {
			MemberExpression(node) {
				if (node.object && node.object.type === 'MemberExpression') {
					const obj = node.object;
					if (obj.object && obj.object.type === 'Identifier' && obj.object.name === 'process' && (obj.property.name === 'env' || obj.property.value === 'env')) {
						if (node.property.type === 'Identifier') reportIfForbidden(node.property, node);
						else if (node.property.type === 'Literal') reportIfForbidden(node.property, node);
						else context.report({ node, messageId: 'forbiddenEnv' });
					}
				}

				if (node.object && node.object.type === 'MemberExpression' && node.object.object && node.object.object.type === 'MetaProperty') {
					if (node.object.property && (node.object.property.name === 'env' || node.object.property.value === 'env')) {
						if (node.property.type === 'Identifier') reportIfForbidden(node.property, node);
						else context.report({ node, messageId: 'forbiddenEnv' });
					}
				}
			},

			VariableDeclarator(node) {
				if (node.init && node.init.type === 'MemberExpression' && rootIsProcessEnv(node.init) && node.id.type === 'ObjectPattern') {
					node.id.properties.forEach(p => {
						if (p.key) reportIfForbidden(p.key, p);
						else context.report({ node: p, messageId: 'forbiddenEnv' });
					});
				}
			},

			'Program:exit'() {
				const sourceCode = context.sourceCode || context.getSourceCode?.();
				const source = sourceCode?.text || '';
				if (/\bprocess\s*\.\s*env\b/.test(source) && !(new RegExp('(?:' + ALLOWED_ENV_VARS.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')').test(source))) {
					context.report({ loc: { line: 1, column: 0 }, messageId: 'forbiddenEnv' });
				}
			},
		};
	},
};
