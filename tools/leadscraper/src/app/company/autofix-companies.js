#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const child = require('child_process');

const ROOT = process.cwd();
const BUILD_DIR = path.join(ROOT, 'build', 'validate');
const FALLBACK_DIR = path.join('/tmp', 'validate');

function runTSC() {
	const tsc = path.join(ROOT, 'node_modules', '.bin', 'tsc');
	const cmd = fs.existsSync(tsc) ? tsc : 'tsc';
	console.log('Compiling TypeScript (this may take a moment)...');
	// override 'noEmit' in tsconfig by passing --noEmit false
	let res = child.spawnSync(cmd, ['-p', 'tsconfig.json', '--outDir', BUILD_DIR, '--noEmit', 'false'], { stdio: 'inherit' });
	if (res.status !== 0) {
		console.warn('Local build failed, retrying to /tmp/...');
		res = child.spawnSync(cmd, ['-p', 'tsconfig.json', '--outDir', FALLBACK_DIR], { stdio: 'inherit' });
		if (res.status !== 0) throw new Error('tsc failed');
	}
}

function findCompiledAutofix() {
	const possible = [
		path.join(BUILD_DIR, 'src', 'app', 'company', 'autofix.js'),
		path.join(BUILD_DIR, 'autofix.js'),
		path.join(FALLBACK_DIR, 'src', 'app', 'company', 'autofix.js'),
		path.join(FALLBACK_DIR, 'autofix.js')
	];
	for (const p of possible) if (fs.existsSync(p)) return p;
	throw new Error('Compiled autofix module not found in ' + possible.join(', '));
}

function run() {
	runTSC();
	const autofixPath = findCompiledAutofix();
	const argv = process.argv.slice(2);
	// Use a separate node process and dynamic import there to avoid CJS/ESM interop issues.
	const node = process.execPath;
	const qpath = autofixPath.replace(/\\/g, '\\\\');
	const runner = `(async()=>{const m=await import(${JSON.stringify(qpath)}); await (m.default?m.default(process.argv.slice(1)):m.run(process.argv.slice(1)));})()`;
	const args = ['-e', runner, '--', ...argv];
	const res = child.spawnSync(node, args, { stdio: 'inherit' });
	if (res.status !== 0) throw new Error('autofix runner failed');
}

if (require.main === module) run();

module.exports = run;
