import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDirectory, '..');
const buildRoot = path.join(appRoot, '.next');
const requiredServerFilesPath = path.join(buildRoot, 'required-server-files.json');
const maxArtifactBytes = 230686720;

async function pathExists(filePath) {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}

async function collectFiles(directory, excludedDirectories = new Set()) {
	const entries = await fs.readdir(directory, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const entryPath = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			if (!excludedDirectories.has(entry.name)) {
				files.push(...await collectFiles(entryPath, excludedDirectories));
			}
		} else {
			files.push(entryPath);
		}
	}

	return files;
}

async function readTraceFiles() {
	const artifactFiles = await collectFiles(buildRoot);
	const manifestPaths = artifactFiles.filter((filePath) => filePath.endsWith('.nft.json'));
	const tracedFiles = new Set();

	for (const manifestPath of manifestPaths) {
		const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
		for (const tracedFile of manifest.files ?? []) {
			tracedFiles.add(path.resolve(path.dirname(manifestPath), tracedFile));
		}
	}

	return { manifestPaths, tracedFiles };
}

async function main() {
	if (!(await pathExists(buildRoot))) {
		throw new Error(`Missing ${buildRoot}. Run the Admin production build first.`);
	}

	const [{ manifestPaths, tracedFiles }, requiredServerManifest] = await Promise.all([
		readTraceFiles(),
		fs.readFile(requiredServerFilesPath, 'utf8'),
	]);
	const requiredFiles = (JSON.parse(requiredServerManifest).files ?? [])
		.map((requiredFile) => path.resolve(appRoot, requiredFile));
	const filesToCheck = new Set([...tracedFiles, ...requiredFiles]);
	const missingFiles = [];
	const runtimeFiles = [
		'node_modules/next/dist/server/app-render/async-local-storage.js',
		'node_modules/next/dist/server/app-render/dynamic-access-async-storage-instance.js',
		'node_modules/next/dist/server/app-render/dynamic-access-async-storage.external.js',
		'node_modules/@swc/helpers/esm/_interop_require_default.js',
		'node_modules/tslib/tslib.js',
	];
	const missingRuntimeFiles = [];
	let artifactBytes = 0;
	for (const artifactFile of await collectFiles(buildRoot, new Set(['cache']))) {
		artifactBytes += (await fs.stat(artifactFile)).size;
	}

	for (const filePath of filesToCheck) {
		if (!(await pathExists(filePath))) {
			missingFiles.push(path.relative(appRoot, filePath));
		}
	}

	const swcHelperPath = path.resolve(appRoot, '../../node_modules/@swc/helpers/esm/_interop_require_default.js');
	const swcHelperIsTraced = [...tracedFiles].some((filePath) => filePath === swcHelperPath);
	for (const runtimeFile of runtimeFiles) {
		if (!(await pathExists(path.join(buildRoot, runtimeFile)))) {
			missingRuntimeFiles.push(runtimeFile);
		}
	}

	console.log(`Artifact root: ${buildRoot}`);
	console.log(`Trace manifests: ${manifestPaths.length}`);
	console.log(`Traced files: ${tracedFiles.size}`);
	console.log(`Required server files: ${requiredFiles.length}`);
	console.log(`Missing source files: ${missingFiles.length}`);
	console.log(`@swc/helpers traced: ${swcHelperIsTraced ? 'yes' : 'no'}`);
	console.log(`Missing physical runtime files: ${missingRuntimeFiles.length}`);
	console.log(`Artifact size: ${artifactBytes} bytes`);
	console.log(`Artifact size limit: ${maxArtifactBytes} bytes`);

	if (missingFiles.length > 0) {
		console.error('\nMissing files referenced by the generated trace:');
		for (const missingFile of missingFiles.sort()) {
			console.error(`- ${missingFile}`);
		}
	}

	if (!swcHelperIsTraced) {
		console.error('\nThe runtime SWC helper is not present in any generated trace manifest.');
	}
	if (missingRuntimeFiles.length > 0) {
		console.error('\nMissing physical runtime files from the deployable .next artifact:');
		for (const missingRuntimeFile of missingRuntimeFiles) {
			console.error(`- ${missingRuntimeFile}`);
		}
		console.error('\nRun `npm run prepare:artifact -w apps/pixelated-admin` before verification.');
	}
	if (artifactBytes > maxArtifactBytes) {
		console.error('\nThe deployable .next artifact exceeds Amplify\'s 220 MiB limit.');
	}

	if (missingFiles.length > 0 || !swcHelperIsTraced || missingRuntimeFiles.length > 0 || artifactBytes > maxArtifactBytes) {
		process.exitCode = 1;
		return;
	}

	console.log('\nDeployment artifact trace validation passed.');
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
});
