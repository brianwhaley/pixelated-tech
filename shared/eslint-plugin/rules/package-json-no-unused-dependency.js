import path from 'path';
import { getContextFilename, getNearestPackageJsonPath, readPackageJson, scanProjectImports, scanPackageJsonScriptPackages, getContextSourceCode } from './eslint-rules-helpers.js';

const reportedUnusedDependencyRoots = new Set();

export const packageJsonNoUnusedDependencyRule = {
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Detect dependencies declared in package.json that are not imported from runtime source.',
			category: 'Dependencies',
			recommended: true,
		},
		messages: {
			unusedDependency: 'Package "{{name}}" is declared in dependencies but not imported by any runtime source file. Remove it if it is no longer needed.',
			unusedOptionalDependency: 'Package "{{name}}" is declared in optionalDependencies but not imported by any runtime source file. Move it to devDependencies if it is only used by tests/build tooling, or remove it if it is no longer needed.',
		},
		schema: [],
	},
	create(context) {
		const filename = getContextFilename(context);
		const packageJsonPath = getNearestPackageJsonPath(filename);
		if (!packageJsonPath) return {};
		const projectRoot = path.dirname(packageJsonPath);
		const manifest = readPackageJson(packageJsonPath);
		if (!manifest) return {};

		const dependencies = manifest.dependencies || {};
		const optionalDependencies = manifest.optionalDependencies || {};
		const declaredPackages = new Set([ ...Object.keys(dependencies), ...Object.keys(optionalDependencies) ]);
		if (reportedUnusedDependencyRoots.has(projectRoot)) return {};
		reportedUnusedDependencyRoots.add(projectRoot);

		return {
			'Program:exit'() {
				const usedPackages = scanProjectImports(projectRoot);
				scanPackageJsonScriptPackages(projectRoot, manifest).forEach(pkg => usedPackages.add(pkg));
				const sourceCode = getContextSourceCode(context);
				for (const name of declaredPackages) {
					if (name.startsWith('@types/')) continue;
					if (!usedPackages.has(name)) {
						const messageId = optionalDependencies[name]
							? 'unusedOptionalDependency'
							: 'unusedDependency';
						context.report({ node: sourceCode?.ast || null, messageId, data: { name } });
					}
				}
			},
		};
	},
};
