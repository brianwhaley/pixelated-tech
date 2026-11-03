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
	'next/dist/build/adapter/setup-node-env.external.js',
	'next/dist/compiled/next-server/app-route.runtime.prod.js',
	'next/dist/server/node-environment.js',
	'next/dist/server/node-environment-baseline.js',
	'next/dist/server/app-render/dynamic-access-async-storage.external.js',
	'@swc/helpers/esm/_interop_require_default.js',
	'tslib/tslib.js',
];
const routeModules = [
	'server/app/manifest.webmanifest/route.js',
	'server/app/api/auth/[...nextauth]/route.js',
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
	const routeErrors = [];
	for (const routeModule of routeModules) {
		try {
			stagedRequire(path.join(stagingRoot, routeModule));
		} catch (error) {
			routeErrors.push(`${routeModule}: ${error instanceof Error ? error.message : error}`);
		}
	}
	const dataErrors = [];
	try {
		const sitesData = JSON.parse(await fs.readFile(path.join(stagingRoot, 'src', 'app', 'data', 'sites.json'), 'utf8'));
		if (!Array.isArray(sitesData.sites)) {
			dataErrors.push('src/app/data/sites.json is missing a sites array');
		}
	} catch (error) {
		dataErrors.push(`src/app/data/sites.json: ${error instanceof Error ? error.message : error}`);
	}
	let configError = '';
	try {
		const config = JSON.parse(await fs.readFile(path.join(stagingRoot, 'pixelated.config.json'), 'utf8'));
		if (!config.siteInfo || !config.integrations?.nextAuth?.secret || !config.integrations?.aws?.region) {
			configError = 'pixelated.config.json is missing siteInfo, integrations.nextAuth.secret, or integrations.aws.region';
		}
	} catch (error) {
		configError = error instanceof Error ? error.message : String(error);
	}

	console.log(`Amplify artifact staging root: ${stagingRoot}`);
	console.log(`Amplify artifact size: ${artifactBytes} bytes`);
	console.log(`Amplify artifact size limit: ${maxArtifactBytes} bytes`);
	console.log(`Runtime modules checked: ${runtimeModules.length}`);
	console.log(`Runtime modules missing: ${missingModules.length}`);
	console.log(`Route bundles checked: ${routeModules.length}`);
	console.log(`Route bundle errors: ${routeErrors.length}`);
	console.log(`Data files checked: 1`);
	console.log(`Data file errors: ${dataErrors.length}`);
	console.log(`Artifact-root config: ${configError ? 'invalid' : 'valid'}`);

	if (missingModules.length > 0) {
		console.error('\nRuntime modules missing from the staged Amplify artifact:');
		for (const missingModule of missingModules) {
			console.error(`- ${missingModule}`);
		}
	}
	if (artifactBytes > maxArtifactBytes) {
		console.error('\nThe staged Amplify artifact exceeds the 220 MiB limit.');
	}
	if (configError) {
		console.error(`\nThe staged Amplify artifact config is invalid: ${configError}`);
	}
	if (routeErrors.length > 0) {
		console.error('\nStaged route bundles failed to load:');
		for (const routeError of routeErrors) {
			console.error(`- ${routeError}`);
		}
	}
	if (dataErrors.length > 0) {
		console.error('\nStaged data files are invalid:');
		for (const dataError of dataErrors) {
			console.error(`- ${dataError}`);
		}
	}

	if (missingModules.length > 0 || routeErrors.length > 0 || dataErrors.length > 0 || artifactBytes > maxArtifactBytes || configError) {
		process.exitCode = 1;
		return;
	}

	console.log('\nAmplify artifact validation passed.');
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
});
