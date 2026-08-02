import fs from 'fs';
import path from 'path';
import { builtinModules } from 'module';

export const CLIENT_ONLY_PATTERNS = [
	/\baddEventListener\b/,
	/\bcreateContext\b/,
	/\bdocument\./,
	/\blocalStorage\b/,
	/\bnavigator\./,
	/\bonBlur\b/,
	/\bonChange\b/,
	/\bonClick\b/,
	/\bonFocus\b/,
	/\bonInput\b/,
	/\bonKey\b/,
	/\bonMouse\b/,
	/\bonSubmit\b/,
	/\bremoveEventListener\b/,
	/\bsessionStorage\b/,
	/\buseCallback\b/,
	/\buseContext\b/,
	/\buseEffect\b/,
	/\buseLayoutEffect\b/,
	/\buseMemo\b/,
	/\buseReducer\b/,
	/\buseRef\b/,
	/\buseState\b/,
	/\bwindow\./,
	/["']use client["']/,
];

export const ALLOWED_ENV_VARS = [
	'NEXTAUTH_URL',
	'NODE_ENV',
	'PIXELATED_CONFIG_KEY',
	'PUPPETEER_EXECUTABLE_PATH',
];

export function isClientComponent(fileContent) {
	return CLIENT_ONLY_PATTERNS.some(pattern => pattern.test(fileContent));
}

export function isRelativeOrAliasImport(source) {
	return source.startsWith('.') || source.startsWith('/') || source.startsWith('@/') || source.startsWith('~/');
}

export function getPackageNameFromSource(source) {
	if (!source || typeof source !== 'string') return null;
	if (isRelativeOrAliasImport(source)) return null;
	if (source.startsWith('node:')) source = source.slice(5);
	const segments = source.split('/');
	if (source.startsWith('@')) {
		return segments.length >= 2 ? `${segments[0]}/${segments[1]}` : source;
	}
	return segments[0];
}

export function isBuiltinModule(name) {
	if (!name || typeof name !== 'string') return false;
	if (name.startsWith('node:')) name = name.slice(5);
	return builtinModules.includes(name);
}

export function getNearestPackageJsonPath(filename) {
	if (!filename || filename === '<input>' || filename === '<text>') {
		const cwd = process.cwd();
		const candidate = path.join(cwd, 'package.json');
		return fs.existsSync(candidate) ? candidate : null;
	}

	let current = path.resolve(filename);
	if (fs.existsSync(current) && fs.statSync(current).isFile()) {
		current = path.dirname(current);
	}

	while (true) {
		const candidate = path.join(current, 'package.json');
		if (fs.existsSync(candidate)) return candidate;
		const parent = path.dirname(current);
		if (parent === current) break;
		current = parent;
	}
	return null;
}

export function readPackageJson(packageJsonPath) {
	try {
		return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
	} catch {
		return null;
	}
}

export function getContextFilename(context) {
	if (!context) return null;
	if (typeof context.getFilename === 'function') return context.getFilename();
	if (typeof context.filename === 'string') return context.filename;
	if (context.sourceCode?.filename) return context.sourceCode.filename;
	return null;
}

export function getContextSourceCode(context) {
	if (!context) return null;
	if (typeof context.getSourceCode === 'function') return context.getSourceCode();
	if (context.sourceCode) return context.sourceCode;
	return null;
}

export function stripComments(source) {
	return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

export function collectImportsFromSource(source) {
	const cleaned = stripComments(source);
	const imports = new Set();
	const regex = /(?:import\s+(?:[^'"\n]+?\s+from\s+)?|export\s+(?:\*\s+from\s+|\{[^}]*\}\s+from\s+)?|require\(\s*|import\()(['"])([^'"\\]+)\1/g;
	let match;
	while ((match = regex.exec(cleaned))) {
		const specifier = match[2];
		const name = getPackageNameFromSource(specifier);
		if (name) imports.add(name);
	}
	return [...imports];
}

export function collectCommandPackagesFromScript(script, declaredPackages) {
	const packages = new Set();
	if (typeof script !== 'string' || !script.trim()) return packages;

	const cleaned = script.replace(/#.*/g, '').trim();
	const tokens = cleaned.split(/[\s|&;]+/);
	const ignoredCommands = new Set([
		'npm', 'npx', 'pnpm', 'yarn', 'node', 'bash', 'sh', 'git', 'cd', 'mkdir',
		'rimraf', 'cross-env', 'run', 'exec', 'npm/run', 'pnpm/exec', 'yarn/exec',
	]);

	for (const token of tokens) {
		if (!token || token.startsWith('-')) continue;
		const normalized = token.replace(/^node_modules\/\.bin\//, '');
		if (!normalized || normalized.startsWith('.') || normalized.startsWith('/')) continue;
		if (ignoredCommands.has(normalized)) continue;

		const candidate = getPackageNameFromSource(normalized);
		if (candidate && declaredPackages.has(candidate)) {
			packages.add(candidate);
			continue;
		}

		for (const declared of declaredPackages) {
			if (declared === normalized || declared.endsWith(`/${normalized}`)) {
				packages.add(declared);
				break;
			}
		}
	}

	return packages;
}

export function scanPackageJsonScriptPackages(projectRoot, manifest) {
	const packages = new Set();
	if (!manifest || !manifest.scripts) return packages;

	const declaredPackages = new Set([
		...Object.keys(manifest.dependencies || {}),
		...Object.keys(manifest.devDependencies || {}),
		...Object.keys(manifest.optionalDependencies || {}),
		...Object.keys(manifest.peerDependencies || {}),
	]);

	for (const script of Object.values(manifest.scripts || {})) {
		collectCommandPackagesFromScript(script, declaredPackages).forEach(pkg => packages.add(pkg));
	}

	return packages;
}

export function scanProjectImports(projectRoot) {
	const importedPackages = new Set();
	const extensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.mts', '.cts']);

	function walk(directory) {
		let entries;
		try {
			entries = fs.readdirSync(directory, { withFileTypes: true });
		} catch {
			return;
		}

		for (const entry of entries) {
			if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.next' || entry.name === 'dist' || entry.name.startsWith('.')) {
				continue;
			}

			const fullPath = path.join(directory, entry.name);
			if (entry.isDirectory()) {
				walk(fullPath);
				continue;
			}

			if (!extensions.has(path.extname(entry.name))) continue;
			let source;
			try {
				source = fs.readFileSync(fullPath, 'utf8');
			} catch {
				continue;
			}
			collectImportsFromSource(source).forEach(pkg => importedPackages.add(pkg));
		}
	}

	walk(projectRoot);
	return importedPackages;
}

export function scanProjectRuntimeImports(projectRoot) {
	const importedPackages = new Set();
	const extensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.mts', '.cts']);

	function walk(directory) {
		let entries;
		try {
			entries = fs.readdirSync(directory, { withFileTypes: true });
		} catch {
			return;
		}

		for (const entry of entries) {
			if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.next' || entry.name === 'dist' || entry.name.startsWith('.')) {
				continue;
			}

			const fullPath = path.join(directory, entry.name);
			if (entry.isDirectory()) {
				walk(fullPath);
				continue;
			}

			if (!extensions.has(path.extname(entry.name))) continue;
			const normalizedPath = fullPath.replace(/\\/g, '/');
			if (
				normalizedPath.includes('/tests/') ||
				normalizedPath.includes('/__tests__/') ||
				normalizedPath.includes('/stories/') ||
				/\.(?:test|spec)\.(?:t|j)sx?$/i.test(normalizedPath)
			) continue;
			if (isDevFile(normalizedPath)) continue;
			let source;
			try {
				source = fs.readFileSync(fullPath, 'utf8');
			} catch {
				continue;
			}
			collectImportsFromSource(source).forEach(pkg => importedPackages.add(pkg));
		}
	}

	walk(projectRoot);
	return importedPackages;
}

export function isConfigFile(filename) {
	if (!filename) return false;
	const normalized = filename.replace(/\\/g, '/');
	return [
		/\.rc(?:\.(?:js|cjs|mjs|ts|tsx|json))?$/i,
		/\.(?:config)\.(?:js|cjs|mjs|ts|tsx|json)$/i,
	].some(re => re.test(normalized));
}

export function isTestFile(filename) {
	if (!filename) return false;
	const normalized = filename.replace(/\\/g, '/');
	return [
		/(?:^|\/)(?:tests?|__tests?)(?:\/|$)/i,
		/\.(?:test|spec)\.(?:t|j)sx?$/i,
		/\.stories?\.(?:t|j)sx?$/i,
	].some(re => re.test(normalized));
}

export function isDevFile(filename) {
	if (!filename) return false;
	if (isConfigFile(filename)) return true;
	if (isTestFile(filename)) return true;

	const packageJsonPath = getNearestPackageJsonPath(filename);
	const normalized = filename.replace(/\\/g, '/');
	const relative = packageJsonPath
		? path.relative(path.dirname(packageJsonPath), normalized).replace(/\\/g, '/')
		: normalized;

	const patterns = [
		/(?:^|\/)scripts\//,
		/(?:^|\/)build\//,
		/(?:^|\/)tools\//,
		/(?:^|\/)config\//,
		/\b(?:jest|vite|webpack|rollup|tailwind|postcss|tsconfig|swc|vitest|eslint)\.(?:js|cjs|mjs|ts|tsx|json)$/i,
	];
	return patterns.some(re => re.test(relative));
}

export function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
}

export function normalizeCtaText(value) {
	return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

export function getStringFromJsxNode(node) {
	if (!node) return null;
	if (node.type === 'JSXText') return node.value;
	if (node.type === 'JSXExpressionContainer' && node.expression) {
		const expression = node.expression;
		if (expression.type === 'Literal' && typeof expression.value === 'string') return expression.value;
		if (expression.type === 'TemplateLiteral' && expression.expressions.length === 0) {
			return expression.quasis.map((q) => q.value.cooked).join('');
		}
	}
	return null;
}

export function isGenericCtaText(value) {
	const normalized = normalizeCtaText(value);
	return [
		'click here',
		'source',
		'read more',
		'learn more',
		'more info',
		'see more',
		'view more',
		'details',
	].includes(normalized);
}
