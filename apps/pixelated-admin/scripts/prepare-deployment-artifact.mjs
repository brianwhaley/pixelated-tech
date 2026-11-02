import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDirectory, '..');
const repositoryRoot = path.resolve(appRoot, '../..');
const buildRoot = path.join(appRoot, '.next');

const runtimePackages = [
	'next',
	'@next/env',
	'@swc/helpers',
	'baseline-browser-mapping',
	'caniuse-lite',
	'postcss',
	'styled-jsx',
	'tslib',
];

async function pathExists(filePath) {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}

async function main() {
	if (!(await pathExists(buildRoot))) {
		throw new Error(`Missing ${buildRoot}. Run the Admin production build first.`);
	}

	for (const packageName of runtimePackages) {
		const sourcePath = path.join(repositoryRoot, 'node_modules', packageName);
		const targetPath = path.join(buildRoot, 'node_modules', packageName);

		if (!(await pathExists(sourcePath))) {
			throw new Error(`Missing runtime package source: ${sourcePath}`);
		}

		await fs.mkdir(path.dirname(targetPath), { recursive: true });
		await fs.cp(sourcePath, targetPath, { recursive: true, force: true });
		console.log(`Packaged ${packageName} into ${path.relative(appRoot, targetPath)}`);
	}
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
});
