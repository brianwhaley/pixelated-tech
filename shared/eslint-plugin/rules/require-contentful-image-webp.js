export const requireContentfulImageWebpRule = {
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Require Contentful-hosted images to include ?fm=webp for optimized delivery.',
			category: 'Performance',
			recommended: true,
		},
		messages: {
			missingWebp: 'Contentful image URLs must include ?fm=webp for optimized WebP delivery.',
		},
		schema: [],
	},
	create(context) {
		function getAttributeValue(attr) {
			if (!attr || attr.type !== 'JSXAttribute' || !attr.value) return null;
			const value = attr.value;
			if (value.type === 'Literal') return String(value.value);
			if (value.type === 'JSXExpressionContainer' && value.expression) {
				if (value.expression.type === 'Literal') return String(value.expression.value);
				if (value.expression.type === 'TemplateLiteral') {
					return value.expression.quasis.map(q => q.value.cooked || '').join('');
				}
			}
			return null;
		}

		return {
			JSXOpeningElement(node) {
				for (const attr of node.attributes || []) {
					if (attr.type !== 'JSXAttribute') continue;
					const value = getAttributeValue(attr);
					if (!value || typeof value !== 'string') continue;

					const normalized = value.toLowerCase();
					if (!normalized.includes('images.ctfassets.net')) continue;

					const pathOnly = normalized.split(/[?#]/)[0];
					if (pathOnly.endsWith('/') || pathOnly.replace(/\/+/g, '') === 'https://images.ctfassets.net') continue;
					if (normalized.includes('fm=webp')) continue;
					const extensionMatch = pathOnly.match(/\.([a-z0-9]+)$/);
					if (!extensionMatch) continue;
					if (extensionMatch[1] === 'webp') continue;

					context.report({ node: attr, messageId: 'missingWebp' });
					break;
				}
			},
		};
	},
};
