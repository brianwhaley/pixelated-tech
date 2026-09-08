#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

function runGit(args, cwd) {
	const result = spawnSync('git', args, { cwd, encoding: 'utf8', stdio: 'pipe' });
	return result.status === 0 ? result.stdout.trim() : '';
}

function findMonorepoRoot(startDir) {
	const gitRoot = runGit(['rev-parse', '--show-toplevel'], startDir);
	if (gitRoot) return path.resolve(gitRoot);

	let current = path.resolve(startDir);
	while (true) {
		if (fs.existsSync(path.join(current, 'package.json'))) return current;
		const parent = path.dirname(current);
		if (parent === current) throw new Error('Unable to find a package.json or Git root.');
		current = parent;
	}
}

function findWorkspaceRoot(startDir, monorepoRoot) {
	let current = path.resolve(startDir);
	while (true) {
		if (fs.existsSync(path.join(current, 'package.json'))) return current;
		if (current === monorepoRoot) return monorepoRoot;
		const parent = path.dirname(current);
		if (parent === current) return monorepoRoot;
		current = parent;
	}
}

function readJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getContextType(workspaceRoot, monorepoRoot) {
	if (workspaceRoot === monorepoRoot) return 'root';
	const relative = path.relative(monorepoRoot, workspaceRoot).replace(/\\/g, '/');
	if (relative.startsWith('apps/')) return 'app';
	if (relative.startsWith('tools/')) return 'tool';
	if (relative.startsWith('packages/')) return 'package';
	return 'workspace';
}

function listWorkspaceDirs(monorepoRoot) {
	const result = [];
	for (const group of ['packages', 'apps', 'tools']) {
		const groupDir = path.join(monorepoRoot, group);
		if (!fs.existsSync(groupDir)) continue;
		for (const entry of fs.readdirSync(groupDir, { withFileTypes: true })) {
			if (!entry.isDirectory()) continue;
			const workspaceDir = path.join(groupDir, entry.name);
			if (fs.existsSync(path.join(workspaceDir, 'package.json'))) result.push(workspaceDir);
		}
	}
	return result;
}

function dependencySections(pkgJson) {
	return {
		dependencies: pkgJson.dependencies ?? {},
		devDependencies: pkgJson.devDependencies ?? {},
		optionalDependencies: pkgJson.optionalDependencies ?? {},
		peerDependencies: pkgJson.peerDependencies ?? {},
	};
}

function addFinding(findings, workspaceRoot, message) {
	const relativeWorkspace = path.relative(process.cwd(), workspaceRoot).replace(/\\/g, '/') || '.';
	findings.push(`${relativeWorkspace}/package.json: ${message}`);
}

function isValidRange(range) {
	return typeof range === 'string' && range.trim().length > 0 && !/^(latest|next|canary)$/i.test(range.trim());
}

function checkManifest(workspaceRoot, findings) {
	const packagePath = path.join(workspaceRoot, 'package.json');
	const pkgJson = readJson(packagePath);
	const sections = dependencySections(pkgJson);
	const sectionNames = Object.keys(sections);
	const allNames = new Map();

	for (const sectionName of sectionNames) {
		for (const [packageName, range] of Object.entries(sections[sectionName])) {
			if (!allNames.has(packageName)) allNames.set(packageName, []);
			allNames.get(packageName).push(sectionName);
			if (!isValidRange(range)) {
				addFinding(findings, workspaceRoot, `${packageName} has an invalid or disallowed range ${JSON.stringify(range)}.`);
			}
		}
	}

	for (const [packageName, sectionsUsed] of allNames) {
		if (sectionsUsed.includes('dependencies') && sectionsUsed.includes('devDependencies')) {
			addFinding(findings, workspaceRoot, `${packageName} is declared in both dependencies and devDependencies.`);
		}
	}

	return pkgJson;
}

function checkLockfile(monorepoRoot, workspaceRoot, pkgJson, findings) {
	const lockPath = path.join(monorepoRoot, 'package-lock.json');
	if (!fs.existsSync(lockPath)) {
		addFinding(findings, workspaceRoot, 'package-lock.json is missing at the monorepo root.');
		return;
	}
	const lock = readJson(lockPath);
	const relativeWorkspace = path.relative(monorepoRoot, workspaceRoot).replace(/\\/g, '/');
	const lockEntry = lock.packages?.[relativeWorkspace];
	if (!lockEntry) {
		addFinding(findings, workspaceRoot, `package-lock.json has no workspace entry for ${relativeWorkspace}.`);
		return;
	}

	for (const sectionName of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
		const manifestSection = pkgJson[sectionName] ?? {};
		const lockSection = lockEntry[sectionName] ?? {};
		for (const [packageName, range] of Object.entries(manifestSection)) {
			if (lockSection[packageName] !== range) {
				addFinding(findings, workspaceRoot, `package-lock.json does not match ${sectionName}.${packageName} (${JSON.stringify(range)}).`);
			}
		}
		for (const packageName of Object.keys(lockSection)) {
			if (!Object.prototype.hasOwnProperty.call(manifestSection, packageName)) {
				addFinding(findings, workspaceRoot, `package-lock.json contains undeclared ${sectionName}.${packageName}.`);
			}
		}
	}
}

function main() {
	const cwd = process.cwd();
	const monorepoRoot = findMonorepoRoot(cwd);
	const workspaceRoot = findWorkspaceRoot(cwd, monorepoRoot);
	const contextType = getContextType(workspaceRoot, monorepoRoot);
	const workspaceDirs = contextType === 'root' ? listWorkspaceDirs(monorepoRoot) : [workspaceRoot];
	const findings = [];

	console.log(`Dependency hygiene check (${contextType})`);
	for (const workspaceDir of workspaceDirs) {
		const pkgJson = checkManifest(workspaceDir, findings);
		checkLockfile(monorepoRoot, workspaceDir, pkgJson, findings);
	}

	if (findings.length > 0) {
		console.error('\nDependency hygiene failed:\n');
		for (const finding of findings) console.error(`- ${finding}`);
		console.error(`\n${findings.length} issue(s) found. No files were modified.`);
		process.exitCode = 1;
		return;
	}

	console.log(`Passed for ${workspaceDirs.length} workspace(s). No files were modified.`);
}

main();
