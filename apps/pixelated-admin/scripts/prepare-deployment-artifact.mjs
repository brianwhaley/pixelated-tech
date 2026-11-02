import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDirectory, '..');
const repositoryRoot = path.resolve(appRoot, '../..');
const buildRoot = path.join(appRoot, '.next');

const runtimePackages = [
	'@swc/helpers',
	'tslib',
];
const runtimeFiles = [
	'next/dist/build/adapter/setup-node-env.external.js',
	'next/dist/compiled/next-server/app-route.runtime.prod.js',
	'next/dist/server/node-environment.js',
	'next/dist/server/node-environment-baseline.js',
	'next/dist/server/patch-error-inspect.js',
	'next/dist/server/lib/source-maps.js',
	'next/dist/server/lib/lru-cache.js',
	'next/dist/server/lib/parse-stack.js',
	'next/dist/server/dev/browser-logs/file-logger.js',
	'next/dist/client/lib/console.js',
	'next/dist/lib/is-error.js',
	'next/dist/shared/lib/is-plain-object.js',
	'next/dist/server/runtime-reacts.external.js',
	'next/dist/server/app-render/async-local-storage.js',
	'next/dist/server/app-render/work-async-storage.external.js',
	'next/dist/server/app-render/work-async-storage-instance.js',
	'next/dist/server/app-render/dynamic-rendering.js',
	'next/dist/client/components/hooks-server-context.js',
	'next/dist/client/components/static-generation-bailout.js',
	'next/dist/server/app-render/console-async-storage.external.js',
	'next/dist/server/app-render/console-async-storage-instance.js',
	'next/dist/server/app-render/work-unit-async-storage.external.js',
	'next/dist/server/app-render/work-unit-async-storage-instance.js',
	'next/dist/shared/lib/invariant-error.js',
	'next/dist/lib/picocolors.js',
	'next/dist/server/app-render/dynamic-access-async-storage-instance.js',
	'next/dist/server/app-render/dynamic-access-async-storage.external.js',
];
const runtimeDirectories = [
	'next/dist/compiled/@opentelemetry/api',
	'next/dist/compiled/source-map',
	'next/dist/compiled/stacktrace-parser',
	'next/dist/client',
	'next/dist/lib',
	'next/dist/server',
	'next/dist/shared',
	'next/dist/server/node-environment-extensions',
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

	for (const runtimeFile of runtimeFiles) {
		const sourcePath = path.join(repositoryRoot, 'node_modules', runtimeFile);
		const targetPath = path.join(buildRoot, 'node_modules', runtimeFile);

		if (!(await pathExists(sourcePath))) {
			throw new Error(`Missing runtime file source: ${sourcePath}`);
		}

		await fs.mkdir(path.dirname(targetPath), { recursive: true });
		await fs.cp(sourcePath, targetPath, { force: true });
		console.log(`Packaged ${runtimeFile} into ${path.relative(appRoot, targetPath)}`);
	}

	for (const runtimeDirectory of runtimeDirectories) {
		const sourcePath = path.join(repositoryRoot, 'node_modules', runtimeDirectory);
		const targetPath = path.join(buildRoot, 'node_modules', runtimeDirectory);

		if (!(await pathExists(sourcePath))) {
			throw new Error(`Missing runtime directory source: ${sourcePath}`);
		}

		await fs.mkdir(path.dirname(targetPath), { recursive: true });
		await fs.cp(sourcePath, targetPath, { recursive: true, force: true });
		console.log(`Packaged ${runtimeDirectory} into ${path.relative(appRoot, targetPath)}`);
	}

	const configSourcePath = path.join(buildRoot, 'server', 'pixelated.config.json');
	const configTargetPath = path.join(buildRoot, 'pixelated.config.json');
	if (!(await pathExists(configSourcePath))) {
		throw new Error(`Missing decrypted deployment config: ${configSourcePath}`);
	}
	await fs.cp(configSourcePath, configTargetPath, { force: true });
	console.log(`Packaged deployment config into ${path.relative(appRoot, configTargetPath)}`);
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
});
