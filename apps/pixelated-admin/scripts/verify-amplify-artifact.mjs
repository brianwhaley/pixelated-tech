import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDirectory, '..');
const buildRoot = path.join(appRoot, '.next');
const maxArtifactBytes = 230686720;
const excludedDirectories = new Set(['cache', 'dev', 'diagnostics', 'types']);
const runtimeModules = [
	'next/dist/server/app-render/dynamic-access-async-storage.external.js',
	'@swc/helpers/esm/_interop_require_default.js',
	'tslib/tslib.js',
];

async function collectFiles(directory) {
	const entries = await fs.readdir(directory, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const entryPath = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			files.push(...await collectFiles(entryPath));
		} else {
			files.push(entryPath);
		}
	}

	return files;
}

async function stageArtifact() {
	try {
		await fs.access(buildRoot);
	} catch {
		throw new Error(`Missing ${buildRoot}. Run the Admin production build first.`);
	}

	const stagingRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pixelated-admin-amplify-'));
	await fs.mkdir(stagingRoot, { recursive: true });

	for (const entry of await fs.readdir(buildRoot, { withFileTypes: true })) {
		if (entry.isDirectory() && excludedDirectories.has(entry.name)) {
			continue;
		}

		await fs.cp(
			path.join(buildRoot, entry.name),
			path.join(stagingRoot, entry.name),
			{ recursive: true },
		);
	}

	return stagingRoot;
}

async function main() {
	const stagingRoot = await stageArtifact();

	let artifactBytes = 0;
	for (const artifactFile of await collectFiles(stagingRoot)) {
		artifactBytes += (await fs.stat(artifactFile)).size;
	}

	const stagedRequire = createRequire(path.join(stagingRoot, 'server', 'runtime-smoke-test.cjs'));
	const missingModules = [];
	for (const runtimeModule of runtimeModules) {
		try {
			stagedRequire(runtimeModule);
		} catch (error) {
			missingModules.push(`${runtimeModule}: ${error instanceof Error ? error.message : error}`);
		}
	}

	console.log(`Amplify artifact staging root: ${stagingRoot}`);
	console.log(`Amplify artifact size: ${artifactBytes} bytes`);
	console.log(`Amplify artifact size limit: ${maxArtifactBytes} bytes`);
	console.log(`Runtime modules checked: ${runtimeModules.length}`);
	console.log(`Runtime modules missing: ${missingModules.length}`);

	if (missingModules.length > 0) {
		console.error('\nRuntime modules missing from the staged Amplify artifact:');
		for (const missingModule of missingModules) {
			console.error(`- ${missingModule}`);
		}
	}
	if (artifactBytes > maxArtifactBytes) {
		console.error('\nThe staged Amplify artifact exceeds the 220 MiB limit.');
	}

	if (missingModules.length > 0 || artifactBytes > maxArtifactBytes) {
		process.exitCode = 1;
		return;
	}

	console.log('\nAmplify artifact validation passed.');
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
});
