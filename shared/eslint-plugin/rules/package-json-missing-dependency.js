import { getContextFilename, getNearestPackageJsonPath, readPackageJson, getPackageNameFromSource, isBuiltinModule } from './eslint-rules-helpers.js';

export const packageJsonMissingDependencyRule = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Detect imports that are not declared in package.json.',
			category: 'Dependencies',
			recommended: true,
		},
		messages: {
			missingDependency: 'Package "{{name}}" is imported but not declared in package.json.',
		},
		schema: [],
	},
	create(context) {
		const filename = getContextFilename(context);
		const packageJsonPath = getNearestPackageJsonPath(filename);
		if (!packageJsonPath) return {};
		const manifest = readPackageJson(packageJsonPath);
		if (!manifest) return {};

		const declaredPackages = new Set([
			...Object.keys(manifest.dependencies || {}),
			...Object.keys(manifest.devDependencies || {}),
			...Object.keys(manifest.optionalDependencies || {}),
			...Object.keys(manifest.peerDependencies || {}),
		]);

		function checkSource(node, source) {
			const name = getPackageNameFromSource(source);
			if (!name) return;
			if (declaredPackages.has(name)) return;
			if (isBuiltinModule(name)) return;
			context.report({ node, messageId: 'missingDependency', data: { name } });
		}

		return {
			ImportDeclaration(node) {
				checkSource(node.source, node.source.value);
			},
			ExportAllDeclaration(node) {
				if (node.source) checkSource(node.source, node.source.value);
			},
			ExportNamedDeclaration(node) {
				if (node.source) checkSource(node.source, node.source.value);
			},
			CallExpression(node) {
				if (node.callee.type === 'Identifier' && node.callee.name === 'require' && node.arguments.length === 1) {
					const arg = node.arguments[0];
					if (arg.type === 'Literal' && typeof arg.value === 'string') {
						checkSource(node, arg.value);
					}
				}
			},
			ImportExpression(node) {
				if (node.source.type === 'Literal' && typeof node.source.value === 'string') {
					checkSource(node, node.source.value);
				}
			},
		};
	},
};
