/*
 * Export validation classifies each component by its runtime boundary before
 * checking entry points. Explicit "use server" and "use client" directives
 * take precedence over incidental runtime matches. Without a directive,
 * server-only signals classify a file as server-only, client-only signals
 * classify it as client-only, and no signals classify it as shared. If both
 * server and client signals remain, the validator conservatively treats the
 * file as server-only because a module requiring server runtime cannot safely
 * be shipped in a client bundle. Shared files are expected in both entries;
 * exclusive files are expected only in their matching entry. A small set of
 * intentional entry-point exceptions is applied after classification when a
 * module's public barrel contract is more specific than its source signals.
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { CLIENT_ONLY_PATTERNS, TS_FILE_IGNORE_PATTERNS, TSX_FILE_IGNORE_PATTERNS, SERVER_ONLY_PATTERNS } from '../components/foundation/utilities';

console.log('🔍 Validating exports...\n');

const SERVER_DIRECTIVE_PATTERN = /^\s*["']use server["'];?\s*$/m;
const CLIENT_DIRECTIVE_PATTERN = /^\s*["']use client["'];?\s*$/m;

function stripComments(content) {
	return content
		.replace(/\/\*[\s\S]*?\*\//g, '')
		.replace(/\/\/.*$/gm, '');
}

export function classifyComponent(content) {
	const source = stripComments(content);
	const hasServerDirective = SERVER_DIRECTIVE_PATTERN.test(source);
	const hasClientDirective = CLIENT_DIRECTIVE_PATTERN.test(source);
	const hasServerRuntime = SERVER_ONLY_PATTERNS.some(pattern => pattern.test(source));
	const hasClientRuntime = CLIENT_ONLY_PATTERNS.some(pattern => pattern.test(source));

	if (hasServerDirective) return 'server-only';
	if (hasClientDirective) return 'client-only';
	if (hasServerRuntime && hasClientRuntime) return 'server-only';
	if (hasServerRuntime) return 'server-only';
	if (hasClientRuntime) return 'client-only';
	return 'shared';
}

// Find all .ts files (excluding .d.ts, test files, stories, examples, types.ts)
const tsFiles = glob.sync('src/components/**/*.ts', {
	ignore: TS_FILE_IGNORE_PATTERNS
});

// Find all .tsx files (excluding test files, stories, examples)
const tsxFiles = glob.sync('src/components/**/*.tsx', {
	ignore: TSX_FILE_IGNORE_PATTERNS
});

// Combine all component files
const allComponentFiles = [...tsFiles, ...tsxFiles];

// Analyze each component file to determine its semantic runtime boundary.
export function analyzeComponentFile(filePath) {
	const content = fs.readFileSync(filePath, 'utf8');
	const exportPath = filePath.replace('src/', './').replace(/\.tsx?$/, '');
	const classification = classifyComponent(content);

	return {
		filePath,
		classification,
		isClientOnly: classification === 'client-only',
		isServerOnly: classification === 'server-only',
		exportPath
	};
}

// Analyze all component files
const analyzedComponents = allComponentFiles.map(analyzeComponentFile);

// Special handling for foundation/utilities.ts - this file is safe for both client and server despite containing pattern definitions
analyzedComponents.forEach(comp => {
	if (comp.exportPath === './components/foundation/utilities') {
		comp.isClientOnly = false;
		comp.isServerOnly = false;
	}
});

// Separate admin and non-admin components
const isAdminComponent = comp =>
	comp.exportPath.startsWith('./components/admin/') ||
	comp.exportPath.startsWith('./components/sitebuilder/page/') ||
	comp.exportPath.startsWith('./components/sitebuilder/config/');
const adminComponents = analyzedComponents.filter(isAdminComponent);
const nonAdminComponents = analyzedComponents.filter(comp => !isAdminComponent(comp));

// Create arrays of components for each bundle (non-admin only)
// If a component has server-only patterns, it's server-only; if client-only and not server-only, client-only; else safe
const serverOnlyComponents = nonAdminComponents.filter(comp => comp.isServerOnly);
const clientOnlyComponents = nonAdminComponents.filter(comp => comp.isClientOnly && !comp.isServerOnly);
const clientAndServerSafeComponents = nonAdminComponents.filter(comp => !comp.isClientOnly && !comp.isServerOnly);
const shoppingCartComponents = nonAdminComponents.filter(comp => comp.exportPath.startsWith('./components/shoppingcart/'));
const generalComponents = nonAdminComponents.filter(comp => !comp.exportPath.startsWith('./components/shoppingcart/'));

const isServerRequired = component => component.isServerOnly;
const isClientRequired = component => component.isClientOnly && !component.isServerOnly;
const isSharedComponent = component => !component.isClientOnly && !component.isServerOnly;
const belongsInServerEntry = component => isSharedComponent(component) || isServerRequired(component);
const belongsInClientEntry = component => isSharedComponent(component) || isClientRequired(component);
const isForbiddenFromServerEntry = component => isClientRequired(component);
const isForbiddenFromClientEntry = component => isServerRequired(component);

// Read index files
const indexServer = fs.readFileSync('src/index.server.js', 'utf8');
const indexClient = fs.readFileSync('src/index.js', 'utf8');
const indexShoppingCartServer = fs.readFileSync('src/components/shoppingcart/index.shoppingcart.server.js', 'utf8');
const indexShoppingCartClient = fs.readFileSync('src/components/shoppingcart/index.shoppingcart.js', 'utf8');
const indexAdminServer = fs.readFileSync('src/components/admin/index.admin.server.js', 'utf8');
const indexAdminClient = fs.readFileSync('src/components/admin/index.admin.js', 'utf8');

// Updated to handle recursive barrel files
export function extractExports(content, currentFilePath = 'src/index.js') {
	// Remove comments
	content = content.replace(/\/\*[\s\S]*?\*\//g, '');
	content = content.replace(/\/\/.*$/gm, '');

	const currentDir = currentFilePath.substring(0, currentFilePath.lastIndexOf('/') + 1);
	const exports = [];

	// Handle export * from './path' syntax
	const exportAllRegex = /export\s+\*\s+from\s+['"]([^'"]+)['"]/g;
	let match;

	while ((match = exportAllRegex.exec(content)) !== null) {
		const exportPath = match[1];
		
		// Determine full path for file existence check
		let fullPath = path.normalize(currentDir + exportPath);
		if (fs.existsSync(fullPath + '.js') || fs.existsSync(fullPath + '.ts') || fs.existsSync(fullPath + '.tsx')) {
			if (exportPath.includes('index.')) {
				// Barrel file, recurse
				const barrelContent = fs.readFileSync(fullPath + '.js', 'utf8');
				exports.push(...extractExports(barrelContent, fullPath + '.js'));
			} else {
				// Regular component, map to root-relative path formatted as ./components/...
				const rootRelative = fullPath.replace('src/', './');
				exports.push(rootRelative);
			}
		}
	}

	// Handle export { ... } from './path' syntax
	const exportRegex = /export\s+{\s*([^}]+)\s*}\s+from\s+['"]([^'"]+)['"]/g;
	while ((match = exportRegex.exec(content)) !== null) {
		const exportPath = match[2];
		let fullPath = path.normalize(currentDir + exportPath);
		const rootRelative = fullPath.replace('src/', './');
		exports.push(rootRelative);
	}

	return exports;
}

// Extract exports from all index files
const serverExports = extractExports(indexServer, 'src/index.server.js');
const clientExports = extractExports(indexClient, 'src/index.js');
const shoppingCartServerExports = extractExports(indexShoppingCartServer, 'src/components/shoppingcart/index.shoppingcart.server.js');
const shoppingCartClientExports = extractExports(indexShoppingCartClient, 'src/components/shoppingcart/index.shoppingcart.js');
const adminServerExports = extractExports(indexAdminServer, 'src/components/admin/index.admin.server.js');
const adminClientExports = extractExports(indexAdminClient, 'src/components/admin/index.admin.js');

const entryPoints = [
	{
		name: 'server',
		label: 'server bundle',
		exports: serverExports,
		components: generalComponents,
		include: belongsInServerEntry,
		forbid: isForbiddenFromServerEntry,
	},
	{
		name: 'client',
		label: 'client bundle',
		exports: clientExports,
		components: generalComponents,
		include: belongsInClientEntry,
		forbid: isForbiddenFromClientEntry,
	},
	{
		name: 'shoppingCartServer',
		label: 'shopping cart server bundle',
		exports: shoppingCartServerExports,
		components: shoppingCartComponents,
		include: belongsInServerEntry,
		forbid: isForbiddenFromServerEntry,
	},
	{
		name: 'shoppingCartClient',
		label: 'shopping cart client bundle',
		exports: shoppingCartClientExports,
		components: shoppingCartComponents,
		include: belongsInClientEntry,
		forbid: isForbiddenFromClientEntry,
	},
	{
		name: 'adminServer',
		label: 'admin server bundle',
		exports: adminServerExports,
		components: adminComponents,
		include: belongsInServerEntry,
		forbid: isForbiddenFromServerEntry,
	},
	{
		name: 'adminClient',
		label: 'admin client bundle',
		exports: adminClientExports,
		components: adminComponents,
		include: belongsInClientEntry,
		forbid: isForbiddenFromClientEntry,
	},
];

const missing = Object.fromEntries(
	entryPoints.map(entryPoint => [entryPoint.name, []]),
);
missing.files = [];

const bundleErrors = Object.fromEntries(
	entryPoints.map(entryPoint => [entryPoint.name, []]),
);

// Check if exported paths correspond to existing files
export function checkExportPathsExist(exports, bundleName) {
	exports.forEach(exportPath => {
		// Convert export path to file path (./components/... -> src/components/...)
		const filePathBase = exportPath.replace('./', 'src/');
		const tsFile = `${filePathBase}.ts`;
		const tsxFile = `${filePathBase}.tsx`;
    
		const tsExists = fs.existsSync(tsFile);
		const tsxExists = fs.existsSync(tsxFile);
    
		if (!tsExists && !tsxExists) {
			missing.files.push(`${bundleName}: ${exportPath} (.ts/.tsx files not found)`);
		}
	});
}

for (const entryPoint of entryPoints) {
	checkExportPathsExist(entryPoint.exports, entryPoint.label);

	for (const component of entryPoint.components) {
		if (entryPoint.include(component) && !entryPoint.exports.includes(component.exportPath)) {
			missing[entryPoint.name].push(component.exportPath);
		}

		if (entryPoint.forbid(component) && entryPoint.exports.includes(component.exportPath)) {
			bundleErrors[entryPoint.name].push(component.exportPath);
		}
	}
}

// Report results
console.log('📊 Analysis Results:');
console.log(`   Found ${allComponentFiles.length} component files`);
console.log(`   ${clientOnlyComponents.length} client-only components`);
console.log(`   ${clientAndServerSafeComponents.length} client-and-server-safe components`);
console.log(`   ${serverOnlyComponents.length} server-only components`);
console.log(`   ${adminComponents.length} admin components`);

for (const entryPoint of entryPoints) {
	const entryMissing = missing[entryPoint.name];
	if (entryMissing.length > 0) {
		console.log(`❌ Missing from ${entryPoint.label}:`);
		entryMissing.forEach(path => console.log(`   - ${path}`));
		console.log('');
	}
}

for (const entryPoint of entryPoints) {
	const entryBundleErrors = bundleErrors[entryPoint.name];
	if (entryBundleErrors.length > 0) {
		console.log(`🚨 Bundle contamination errors in ${entryPoint.label}:`);
		entryBundleErrors.forEach(path => console.log(`   - ${path}`));
		console.log('');
	}
}

if (missing.files.length > 0) {
	console.log('❌ Exported paths that don\'t exist:');
	missing.files.forEach(path => console.log(`   - ${path}`));
	console.log('');
}

const hasErrors = [
	...Object.values(missing),
	...Object.values(bundleErrors),
].some(errors => errors.length > 0);

if (hasErrors) {
	console.log('❌ Validation failed!');
	process.exit(1);
} else {
	console.log('✅ All exports validated successfully!');
}
