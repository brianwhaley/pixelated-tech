import path from 'path';
import { getContextFilename, getNearestPackageJsonPath, readPackageJson, getPackageNameFromSource, isConfigFile, isDevFile, scanProjectRuntimeImports } from './eslint-rules-helpers.js';

export const packageJsonWrongDependencyTypeRule = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Detect mismatches between import file locations and package.json dependency type.',
			category: 'Dependencies',
			recommended: true,
		},
		messages: {
			prodUsedInDev: 'Package "{{name}}" is declared in {{declaredType}} but imported from dev-only source "{{filename}}". Move it to devDependencies if it is only used for development or testing.',
			devUsedInProd: 'Package "{{name}}" is declared in devDependencies but imported by runtime source "{{filename}}". Move it to dependencies or optionalDependencies.',
			optionalUsedInDev: 'Package "{{name}}" is declared in optionalDependencies but imported from dev-only source "{{filename}}". Move it to devDependencies if it is a build/test-only dependency.',
		},
		schema: [],
	},
	create(context) {
		const filename = getContextFilename(context);
		const packageJsonPath = getNearestPackageJsonPath(filename);
		if (!packageJsonPath) return {};
		const manifest = readPackageJson(packageJsonPath);
		if (!manifest) return {};

		const categories = {
			dependencies: new Set(Object.keys(manifest.dependencies || {})),
			devDependencies: new Set(Object.keys(manifest.devDependencies || {})),
			optionalDependencies: new Set(Object.keys(manifest.optionalDependencies || {})),
			peerDependencies: new Set(Object.keys(manifest.peerDependencies || {})),
		};

		const fileIsDev = isDevFile(filename);
		const runtimePackages = scanProjectRuntimeImports(path.dirname(packageJsonPath));

		function checkSource(node, source) {
			const name = getPackageNameFromSource(source);
			if (!name) return;
			const declaredType = categories.devDependencies.has(name)
				? 'devDependencies'
				: categories.optionalDependencies.has(name)
					? 'optionalDependencies'
					: categories.dependencies.has(name)
						? 'dependencies'
						: categories.peerDependencies.has(name)
							? 'peerDependencies'
							: null;
			if (!declaredType) return;
			if (fileIsDev) {
				if ((declaredType === 'dependencies' || declaredType === 'optionalDependencies') && runtimePackages.has(name)) {
					return;
				}
				if (declaredType === 'dependencies') {
					if (isConfigFile(filename)) return;
					context.report({ node, messageId: 'prodUsedInDev', data: { name, declaredType, filename } });
				}
				if (declaredType === 'optionalDependencies') {
					context.report({ node, messageId: 'optionalUsedInDev', data: { name, declaredType, filename } });
				}
				return;
			}
			if (declaredType === 'devDependencies') {
				context.report({ node, messageId: 'devUsedInProd', data: { name, declaredType, filename } });
			}
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
				const isRequireCall = node.callee.type === 'Identifier' && node.callee.name === 'require';
				const isRequireResolveCall = node.callee.type === 'MemberExpression'
					&& node.callee.object.type === 'Identifier'
					&& node.callee.object.name === 'require'
					&& node.callee.property.type === 'Identifier'
					&& node.callee.property.name === 'resolve';
				if ((isRequireCall || isRequireResolveCall) && node.arguments.length === 1) {
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
