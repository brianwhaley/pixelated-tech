#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import ts from 'typescript';
import { spawn, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { patchConfigLastModified } from './update-sitemap-lastmodified.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getNpmOriginalArgs() {
	const raw = process.env.npm_config_argv;
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed.original) ? parsed.original : [];
	} catch {
		return [];
	}
}

const npmOriginalArgs = getNpmOriginalArgs();
const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v') || npmOriginalArgs.includes('--verbose') || npmOriginalArgs.includes('-v') || process.env.RELEASE_PREP_VERBOSE === '1';

const RELEASE_PREP_NAME = 'release-prep';

function runCommand(command, args, options) {
	const result = spawnSync(command, args, {
		encoding: 'utf8',
		stdio: isVerbose ? 'inherit' : 'pipe',
		...options,
	});

	return {
		status: result.status,
		stdout: result.stdout?.trim() ?? '',
		stderr: result.stderr?.trim() ?? '',
	};
}

async function existsFile(filePath) {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}

async function findMonorepoRoot(startDir) {
	const result = runCommand('git', ['rev-parse', '--show-toplevel'], { cwd: startDir, stdio: 'pipe' });
	if (result.status === 0 && result.stdout) {
		return path.resolve(result.stdout);
	}

	let current = path.resolve(startDir);
	while (true) {
		if (await existsFile(path.join(current, 'package.json'))) {
			return current;
		}
		const parent = path.dirname(current);
		if (parent === current) break;
		current = parent;
	}

	throw new Error('Unable to determine monorepo root');
}

function getTrackedPlaintextConfigs(monorepoRoot) {
	const result = runCommand('git', ['ls-files', '--', ':(glob)**/pixelated.config.json'], { cwd: monorepoRoot, stdio: 'pipe' });
	if (result.status !== 0) {
		throw new Error(result.stderr || 'Unable to inspect tracked configuration files');
	}
	return result.stdout ? result.stdout.split('\n').filter(Boolean) : [];
}

async function findWorkspaceRoot(startDir, monorepoRoot) {
	let current = path.resolve(startDir);
	while (true) {
		if (await existsFile(path.join(current, 'package.json'))) {
			return current;
		}
		if (current === monorepoRoot) {
			return monorepoRoot;
		}
		const parent = path.dirname(current);
		if (parent === current) break;
		current = parent;
	}
	return monorepoRoot;
}

async function readPackageJson(pkgDir) {
	const pkgPath = path.join(pkgDir, 'package.json');
	const file = await fs.readFile(pkgPath, 'utf8');
	return JSON.parse(file);
}

async function validateJsonFiles(workspaceDir) {
	const invalidFiles = [];
	let checkedFiles = 0;
	const ignoredDirectories = new Set(['.git', 'node_modules', '.next', 'coverage', 'dist', 'out']);
	async function walk(directory) {
		const entries = await fs.readdir(directory, { withFileTypes: true });
		for (const entry of entries) {
			const entryPath = path.join(directory, entry.name);
			if (entry.isDirectory()) {
				if (!ignoredDirectories.has(entry.name)) await walk(entryPath);
				continue;
			}
			if (!entry.name.endsWith('.json')) continue;
			checkedFiles += 1;
			const raw = await fs.readFile(entryPath, 'utf8');
			try {
				JSON.parse(raw);
			} catch (jsonError) {
				const config = ts.readConfigFile(entryPath, () => raw);
				const parsed = config.error ? { errors: [config.error] } : ts.parseJsonConfigFileContent(config.config, ts.sys, path.dirname(entryPath), undefined, entryPath);
				if (parsed.errors.length) {
					const details = parsed.errors.map((error) => ts.flattenDiagnosticMessageText(error.messageText, '\n')).join('\n');
					invalidFiles.push(`${path.relative(workspaceDir, entryPath)}: ${jsonError.message}; ${details}`);
				}
			}
		}
	}
	await walk(workspaceDir);
	return { invalidFiles, checkedFiles };
}

async function findStaticAppRoutes(workspaceDir) {
	const appDir = path.join(workspaceDir, 'src', 'app');
	const routes = [];
	if (!(await existsFile(appDir))) return routes;
	async function walk(directory, segments = []) {
		const entries = await fs.readdir(directory, { withFileTypes: true });
		for (const entry of entries) {
			const entryPath = path.join(directory, entry.name);
			if (entry.isDirectory()) {
				if (entry.name.startsWith('[')) continue;
				await walk(entryPath, entry.name.startsWith('(') ? segments : [...segments, entry.name]);
				continue;
			}
			if (!/^page\.(tsx?|jsx?)$/.test(entry.name)) continue;
			const route = `/${segments.join('/')}`.replace(/\/+/g, '/') || '/';
			if (!routes.includes(route)) routes.push(route);
		}
	}
	await walk(appDir);
	return routes.sort();
}

async function runRouteSmokeStep(workspaceDir) {
	const routes = await findStaticAppRoutes(workspaceDir);
	if (routes.length === 0) return { status: 'skipped', label: 'Route Smoke', detail: 'No static App Router routes found' };
	const port = 3100 + (process.pid % 1000);
	const server = spawn('npm', ['exec', '--', 'next', 'start', '--port', String(port)], {
		cwd: workspaceDir,
		stdio: ['ignore', 'pipe', 'pipe']
	});
	let output = '';
	server.stdout.on('data', (chunk) => { output += chunk.toString(); });
	server.stderr.on('data', (chunk) => { output += chunk.toString(); });
	try {
		let ready = false;
		const startedAt = Date.now();
		while (Date.now() - startedAt < 30000) {
			ready = output.includes('Ready in');
			if (ready) break;
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
		if (!ready) return { status: 'failed', label: 'Route Smoke', detail: `Server did not become ready. ${output}` };
		const failures = [];
		for (const route of routes) {
			try {
				const response = await fetch(`http://127.0.0.1:${port}${route}`, {
					redirect: 'manual',
					signal: AbortSignal.timeout(10000)
				});
				if (response.status >= 500) failures.push(`${route} returned ${response.status}`);
				if (response.status >= 300 && response.status < 400 && !response.headers.get('location')) {
					failures.push(`${route} returned ${response.status} without a Location header`);
				}
			} catch (error) {
				failures.push(`${route} request failed: ${error.message}`);
			}
		}
		if (failures.length) return { status: 'failed', label: 'Route Smoke', detail: failures.join('\n') };
		return { status: 'success', label: `Route Smoke (${routes.length} routes)` };
	} finally {
		server.kill('SIGTERM');
	}
}

async function runJsonValidationStep(workspaceDir) {
	const { invalidFiles, checkedFiles } = await validateJsonFiles(workspaceDir);
	if (invalidFiles.length) return { status: 'failed', label: 'JSON Validation', detail: invalidFiles.join('\n') };
	return { status: 'success', label: `JSON Validation (${checkedFiles} files checked)` };
}

function getContextType(workspaceRoot, monorepoRoot) {
	if (workspaceRoot === monorepoRoot) {
		return 'root';
	}

	const relative = path.relative(monorepoRoot, workspaceRoot).replace(/\\/g, '/');
	if (relative.startsWith('apps/')) return 'app';
	if (relative.startsWith('packages/')) return 'package';
	return 'standalone';
}

async function listWorkspaceDirs(monorepoRoot) {
	const workspaceDirs = [];
	for (const group of ['packages', 'apps']) {
		const groupDir = path.join(monorepoRoot, group);
		try {
			const entries = await fs.readdir(groupDir, { withFileTypes: true });
			for (const entry of entries) {
				if (!entry.isDirectory()) continue;
				const workspaceDir = path.join(groupDir, entry.name);
				if (await existsFile(path.join(workspaceDir, 'package.json'))) {
					workspaceDirs.push(workspaceDir);
				}
			}
		} catch {
			continue;
		}
	}
	return workspaceDirs;
}

function formatStatus(step) {
	if (step.status === 'success') return '✅';
	if (step.status === 'failed') return '❌';
	return '⏭️';
}

function printWorkspaceHeader(workspaceName) {
	console.log('\n=================================================');
	console.log(`📦 ${workspaceName}`);
	console.log('=================================================');
}

function printWorkspaceSummary(workspaceResult) {
	for (const [stepName, stepResult] of Object.entries(workspaceResult.steps)) {
		console.log(`${formatStatus(stepResult)} ${stepResult.label}${stepResult.status === 'skipped' ? ' (skipped)' : ''}`);
		if (stepResult.status === 'failed' && stepResult.detail) {
			console.log(`   ${stepResult.detail.split('\n').join('\n   ')}`);
		}
	}
}

function commandLabel(command, args) {
	return `${command} ${args.map(String).join(' ')}`;
}

async function runInternalStep(workspaceDir, label, callback) {
	console.log(`\n--- ${label} (${path.basename(workspaceDir)}) ---`);
	const result = await callback();
	if (result.status === 'failed' && result.detail) console.error(result.detail);
	if (result.status === 'success' && result.label !== label) console.log(result.label);
	return result;
}

function runExternalStep(workspaceDir, label, command, args) {
	console.log(`\n--- ${label} (${path.basename(workspaceDir)}) ---`);
	console.log(commandLabel(command, args));
	const result = runCommand(command, args, { cwd: workspaceDir });
	if (isVerbose) {
		if (result.stdout) console.log(result.stdout);
		if (result.stderr) console.error(result.stderr);
	}
	if (result.status === 0) {
		return { status: 'success', label };
	}

	const detail = result.stderr || result.stdout || 'Unknown error';
	console.error(detail);
	return { status: 'failed', label, detail };
}

async function workspaceHasScript(pkgJson, name) {
	return pkgJson.scripts && typeof pkgJson.scripts[name] === 'string';
}

async function workspaceHasVitest(pkgJson) {
	const deps = { ...pkgJson.dependencies, ...pkgJson.devDependencies, ...pkgJson.optionalDependencies, ...pkgJson.peerDependencies };
	return typeof deps?.vitest !== 'undefined';
}

async function runUpdateStep(workspaceDir, pkgJson) {
	if (await workspaceHasScript(pkgJson, 'update')) {
		return runExternalStep(workspaceDir, 'Update', 'npm', ['run', 'update']);
	}
	return { status: 'skipped', label: 'Update' };
}

async function runLintStep(workspaceDir, pkgJson) {
	if (await workspaceHasScript(pkgJson, 'lint')) {
		return runExternalStep(workspaceDir, 'Lint', 'npm', ['run', 'lint']);
	}
	return { status: 'skipped', label: 'Lint' };
}

async function runTestStep(workspaceDir, pkgJson) {
	if (await workspaceHasScript(pkgJson, 'test:coverage')) {
		return runExternalStep(workspaceDir, 'Test', 'npm', ['run', 'test:coverage']);
	}
	if (await workspaceHasScript(pkgJson, 'test')) {
		return runExternalStep(workspaceDir, 'Test', 'npm', ['run', 'test']);
	}
	if (await workspaceHasVitest(pkgJson)) {
		return runExternalStep(workspaceDir, 'Test', 'npm', ['exec', '--', 'vitest', 'run', '--coverage', '--silent', '--passWithNoTests']);
	}
	return { status: 'skipped', label: 'Test' };
}

async function runBuildStep(workspaceDir, pkgJson) {
	if (await workspaceHasScript(pkgJson, 'build')) {
		return runExternalStep(workspaceDir, 'Build', 'npm', ['run', 'build']);
	}
	return { status: 'skipped', label: 'Build' };
}

async function runGenerateImagesStep(workspaceDir, pkgJson) {
	if (await workspaceHasScript(pkgJson, 'generate-site-images')) {
		return runExternalStep(workspaceDir, 'Generate Images', 'npm', ['run', 'generate-site-images']);
	}
	return { status: 'skipped', label: 'Generate Images' };
}

async function runWorkspacePipeline(workspaceDir) {
	const pkgJson = await readPackageJson(workspaceDir);
	const workspaceName = pkgJson.name || path.basename(workspaceDir);
	const steps = {
		json: { label: 'JSON Validation', status: 'skipped' },
		update: { label: 'Update', status: 'skipped' },
		patchConfig: { label: 'Patch Config lastModified', status: 'skipped' },
		lint: { label: 'Lint', status: 'skipped' },
		test: { label: 'Test', status: 'skipped' },
		build: { label: 'Build', status: 'skipped' },
		routes: { label: 'Route Smoke', status: 'skipped' },
		images: { label: 'Generate Images', status: 'skipped' },
	};

	steps.json = await runInternalStep(workspaceDir, 'JSON Validation', () => runJsonValidationStep(workspaceDir));
	if (steps.json.status === 'failed') {
		for (const stepName of ['update', 'lint', 'test', 'build', 'routes', 'images']) {
			steps[stepName] = { status: 'skipped', label: steps[stepName].label, detail: 'Skipped because JSON validation failed' };
		}
		return { name: workspaceName, dir: workspaceDir, steps };
	}
	steps.update = await runUpdateStep(workspaceDir, pkgJson);
	steps.patchConfig = await runInternalStep(workspaceDir, 'Patch Config lastModified', () => patchConfigLastModified(workspaceDir));
	steps.lint = await runLintStep(workspaceDir, pkgJson);

	if (steps.lint.status === 'failed') {
		steps.test = { status: 'skipped', label: 'Test', detail: 'Skipped because lint failed' };
	} else {
		steps.test = await runTestStep(workspaceDir, pkgJson);
	}

	if (steps.test.status === 'failed') {
		steps.build = { status: 'skipped', label: 'Build', detail: 'Skipped because tests failed' };
	} else {
		steps.build = await runBuildStep(workspaceDir, pkgJson);
	}
	if (steps.build.status !== 'success') {
		steps.routes = { status: 'skipped', label: 'Route Smoke', detail: 'Skipped because build did not complete successfully' };
	} else {
		steps.routes = await runInternalStep(workspaceDir, 'Route Smoke', () => runRouteSmokeStep(workspaceDir));
	}

	if (steps.build.status !== 'success' || steps.routes.status === 'failed') {
		steps.images = { status: 'skipped', label: 'Generate Images', detail: 'Skipped because build or route smoke failed' };
	} else {
		steps.images = await runGenerateImagesStep(workspaceDir, pkgJson);
	}

	return { name: workspaceName, dir: workspaceDir, steps };
}

async function run() {
	const cwd = process.cwd();
	const monorepoRoot = await findMonorepoRoot(cwd);
	const trackedPlaintextConfigs = getTrackedPlaintextConfigs(monorepoRoot);
	if (trackedPlaintextConfigs.length > 0) {
		console.error('❌ Error: Decrypted pixelated.config.json files are tracked by Git:');
		trackedPlaintextConfigs.forEach((configPath) => console.error(`   ${configPath}`));
		process.exit(1);
	}

	const workspaceRoot = await findWorkspaceRoot(cwd, monorepoRoot);
	const contextType = getContextType(workspaceRoot, monorepoRoot);
	const workspaceDirs = contextType === 'root'
		? await listWorkspaceDirs(monorepoRoot)
		: [workspaceRoot];

	if (workspaceDirs.length === 0) {
		console.error('No workspace packages found to run release prep.');
		process.exit(1);
	}

	if (isVerbose) {
		console.log('--- verbose mode enabled: streaming child command output live ---');
	}

	console.log('=================================================');
	console.log(`🚀 release-prep starting from ${cwd}`);
	console.log(`Context: ${contextType}`);
	console.log('Workspaces:');
	workspaceDirs.forEach((dir) => console.log(` - ${path.relative(monorepoRoot, dir)}`));
	console.log('=================================================');

	const workspaceResults = [];
	for (const workspaceDir of workspaceDirs) {
		const pkgJson = await readPackageJson(workspaceDir);
		printWorkspaceHeader(pkgJson.name || path.basename(workspaceDir));
		const result = await runWorkspacePipeline(workspaceDir);
		workspaceResults.push(result);
		printWorkspaceSummary(result);
	}

	console.log('\n=================================================');
	console.log('📊 Release-prep summary');
	console.log('=================================================');
	let failedCount = 0;
	for (const result of workspaceResults) {
		const failedSteps = Object.values(result.steps).filter((step) => step.status === 'failed');
		console.log(`\n${result.name}`);
		if (failedSteps.length === 0) {
			console.log('  ✅ All requested steps completed successfully');
		} else {
			failedCount += 1;
			failedSteps.forEach((step) => console.log(`  ❌ ${step.label}`));
		}
	}

	if (failedCount > 0) {
		console.error(`\nrelease-prep failed for ${failedCount} workspace(s)`);
		process.exit(1);
	}

	console.log('\n✅ release-prep complete');
	process.exit(0);
}

run().catch((error) => {
	console.error('Unexpected error in release-prep:', error);
	process.exit(1);
});
