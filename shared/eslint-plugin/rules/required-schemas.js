export const requiredSchemasRule = {
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Ensure required SEO schemas are present in layout.tsx',
			category: 'SEO',
			recommended: true,
		},
		messages: {
			missingSchema: 'Required SEO Schema "{{schemaName}}" is missing from layout.tsx.',
		},
	},
	create(context) {
		const filename = context.sourceCode?.filename || context.getFilename?.() || '';
		if (!filename.endsWith('layout.tsx')) return {};

		const requiredSchemas = ['WebsiteSchema', 'LocalBusinessSchema', 'SchemaWebPage', 'BreadcrumbListSchema'];
		const foundSchemas = new Set();

		return {
			JSXIdentifier(node) {
				if (requiredSchemas.includes(node.name)) {
					foundSchemas.add(node.name);
				}
			},
			'Program:exit'() {
				requiredSchemas.forEach(schema => {
					if (!foundSchemas.has(schema)) {
						context.report({
							loc: { line: 1, column: 0 },
							messageId: 'missingSchema',
							data: { schemaName: schema },
						});
					}
				});
			},
		};
	},
};
