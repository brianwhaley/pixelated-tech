/**
 * Dynamic Component Discovery
 * Discovers components by parsing pixelated-components exports at runtime
 */

import fs from 'fs';
import path from 'path';

/**
 * Get the pixelated-components package path (now that we're inside the library)
 */
function getPixelatedComponentsPath(): string {
	// Since this is now running in pixelated-admin, resolve from the current working directory
	try {
		// Get the current working directory (should be pixelated-admin root)
		const cwd = process.cwd();
    
		// Navigate to node_modules/@pixelated-tech/components
		const packagePath = path.join(cwd, 'node_modules', '@pixelated-tech', 'components');
    
		// Verify the path exists
		if (fs.existsSync(packagePath)) {
			return packagePath;
		} else {
			// Fallback to require.resolve the package entrypoint rather than package.json.
			// Some package export maps do not expose package.json.
			let resolvedPath = require.resolve('@pixelated-tech/components');
			if (resolvedPath.startsWith('/ROOT/')) {
				resolvedPath = resolvedPath.replace('/ROOT/', '/');
			}
			let packageDir = path.dirname(resolvedPath);
			if (path.basename(packageDir) === 'dist') {
				packageDir = path.dirname(packageDir);
			}
			return packageDir;
		}
	} catch (error) {
		console.error('Error resolving package path:', error);
		// Fallback to relative path resolution
		const currentDir = __dirname;
		// Navigate up: componentusage -> admin -> components -> pixelated-components root
		const fallbackPath = path.resolve(currentDir, '../../../');
		return fallbackPath;
	}
}

/**
 * Discover components dynamically by parsing the pixelated-components index files
 * This runs on the server side during API calls
 */
export async function discoverComponentsFromLibrary(): Promise<string[]> {
	try {
		// Get the pixelated-components package path
		const pixelatedPath = getPixelatedComponentsPath();

		const componentNames: string[] = [];
		const distDir = path.join(pixelatedPath, 'dist');
		const componentsRoot = path.join(distDir, 'components');

		// Read from main index.js
		const indexPath = path.join(distDir, 'index.js');
		if (fs.existsSync(indexPath)) {
			const indexContent = fs.readFileSync(indexPath, 'utf-8');
			componentNames.push(...parseComponentExports(indexContent, path.dirname(indexPath), componentsRoot));
		}

		// Read from admin runtime index (nested admin location)
		const adminClientNestedPath = path.join(distDir, 'components', 'admin', 'index.admin.js');
		if (fs.existsSync(adminClientNestedPath)) {
			const adminClientContent = fs.readFileSync(adminClientNestedPath, 'utf-8');
			componentNames.push(...parseComponentExports(adminClientContent, path.dirname(adminClientNestedPath), componentsRoot));
		}

		// Read from admin server runtime index (nested admin location)
		const adminServerNestedPath = path.join(distDir, 'components', 'admin', 'index.admin.server.js');
		if (fs.existsSync(adminServerNestedPath)) {
			const adminServerContent = fs.readFileSync(adminServerNestedPath, 'utf-8');
			componentNames.push(...parseComponentExports(adminServerContent, path.dirname(adminServerNestedPath), componentsRoot));
		}

		return [...new Set(componentNames)].sort(); // Remove duplicates and sort alphabetically
	} catch (error) {
		console.error('Error in dynamic component discovery:', error);
		// Return empty array if discovery fails
		return [];
	}
}

/**
 * Parse ALL export statements from index.js and format as folder/filename
 * No filtering - includes everything for maximum inclusivity
 */
function parseComponentExports(content: string, currentDir: string, componentsRoot: string, visited = new Set<string>()): string[] {
	const componentNames: string[] = [];
	const lines = content.split('\n');

	for (const line of lines) {
		const trimmed = line.trim();

		// Skip commented export lines
		if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
			continue;
		}

		const match = trimmed.match(/export \* from ['"](.+)['"];/);
		if (!match) continue;

		const exportPath = match[1];
		if (!exportPath.startsWith('./')) continue;

		const resolvedPath = path.join(currentDir, exportPath);
		let resolvedJsPath = resolvedPath.endsWith('.js') ? resolvedPath : `${resolvedPath}.js`;
		if (!fs.existsSync(resolvedJsPath) && exportPath.startsWith('./components/')) {
			const altPath = path.join(componentsRoot, exportPath.replace('./components/', ''));
			const altJsPath = altPath.endsWith('.js') ? altPath : `${altPath}.js`;
			if (fs.existsSync(altJsPath)) {
				resolvedJsPath = altJsPath;
			}
		}
		if (!fs.existsSync(resolvedJsPath)) continue;

		const baseName = path.basename(resolvedJsPath);
		if (baseName.startsWith('index.')) {
			if (visited.has(resolvedJsPath)) continue;
			visited.add(resolvedJsPath);
			const nestedContent = fs.readFileSync(resolvedJsPath, 'utf-8');
			componentNames.push(...parseComponentExports(nestedContent, path.dirname(resolvedJsPath), componentsRoot, visited));
			continue;
		}

		let relativeName = path.relative(componentsRoot, resolvedJsPath).replace(/\\/g, '/').replace(/\.js$/, '');
		if (relativeName.startsWith('admin/components/')) {
			relativeName = relativeName.replace(/^admin\/components\//, 'admin/');
		}
		componentNames.push(relativeName);
	}

	return [...new Set(componentNames)].sort();
}