import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createRequire } from 'module';
import vm from 'node:vm';
import ts from 'typescript';
import { encrypt } from '../components/config/crypto';

function mkdtmp(prefix = 'pv-test-') {
	return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function loadConfigVault() {
	const scriptPath = path.join(__dirname, '..', 'scripts', 'config-vault.ts');
	let source = fs.readFileSync(scriptPath, 'utf8');
	source = source.replace(
		"import { encrypt, decrypt, isEncrypted } from '../components/config/crypto';",
		"const { encrypt, decrypt, isEncrypted } = require('../components/config/crypto.ts');"
	);
	// preserve module execution flow; we only need decryptPostBuild exported
	// only replace the no-encrypted-config exit inside the helper function
	source = source.replace(
		"if (!foundEnc) {\n\t\tif (debug) console.log('No encrypted config found; nothing to do.');\n\t\tprocess.exit(0);\n\t}\n",
		"if (!foundEnc) {\n\t\tif (debug) console.log('No encrypted config found; nothing to do.');\n\t\treturn;\n\t}\n"
	);
	const runtimeStart = source.lastIndexOf('try {');
	if (runtimeStart === -1) {
		throw new Error('Unable to find CLI runtime block in config-vault.ts');
	}
	const patched = source.slice(0, runtimeStart)
		+ 'module.exports.decryptPostBuild = decryptPostBuild;\nif (false) {\n'
		+ source.slice(runtimeStart)
		+ '\n}\n';
	const transpiled = ts.transpileModule(patched, {
		compilerOptions: {
			module: ts.ModuleKind.CommonJS,
			target: ts.ScriptTarget.ES2020,
			moduleResolution: ts.ModuleResolutionKind.NodeNext,
			esModuleInterop: true,
			allowJs: true,
			isolatedModules: true,
		},
	});
	const requireFunc = createRequire(scriptPath);
	requireFunc.extensions = requireFunc.extensions || (require as any).extensions;
	requireFunc.extensions['.ts'] = function (module: any, filename: string) {
		const tsSource = fs.readFileSync(filename, 'utf8');
		const transpiled = ts.transpileModule(tsSource, {
			compilerOptions: {
				module: ts.ModuleKind.CommonJS,
				target: ts.ScriptTarget.ES2020,
				moduleResolution: ts.ModuleResolutionKind.NodeNext,
				esModuleInterop: true,
				allowJs: true,
				isolatedModules: true,
			},
			fileName: filename,
		});
		module._compile(transpiled.outputText, filename);
	};

	const fakeProcess = Object.create(process);
	fakeProcess.argv = ['node', scriptPath];
	fakeProcess.exit = (_code?: number) => undefined;

	const module = { exports: {} as any };
	const context = vm.createContext({
		console,
		process: fakeProcess,
		require: requireFunc,
		exports: module.exports,
		module,
		__filename: scriptPath,
		__dirname: path.dirname(scriptPath),
		Buffer,
		URL,
	});
	const script = new vm.Script(transpiled.outputText, { filename: scriptPath });
	script.runInContext(context);
	return module.exports.decryptPostBuild as (opts: { debug?: boolean }) => void;
}

describe('config-vault postbuild integration', () => {
	const decryptPostBuild = loadConfigVault();

	it('should decrypt .enc and inject into .next/server', () => {
		const tmp = mkdtmp();
		const appConfigDir = path.join(tmp, 'src', 'app', 'config');
		fs.mkdirSync(appConfigDir, { recursive: true });

		const json = JSON.stringify({ siteName: 'EncSite' });
		const key = 'a'.repeat(64); // valid 32 byte hex key
		const encrypted = encrypt(json, key);

		const encPath = path.join(appConfigDir, 'pixelated.config.json.enc');
		fs.writeFileSync(encPath, encrypted, 'utf8');

		// Run the CLI via npx so it uses the workspace-installed tsx executable
		const originalCwd = process.cwd();
		try {
			process.chdir(tmp);
			process.env.PIXELATED_CONFIG_KEY = key;

			decryptPostBuild({ debug: false });

			const injected = path.join(tmp, '.next', 'server', 'pixelated.config.json');
			expect(fs.existsSync(injected)).toBe(true);
			const read = fs.readFileSync(injected, 'utf8');
			expect(JSON.parse(read)).toEqual({ siteName: 'EncSite' });
		} finally {
			process.chdir(originalCwd);
			fs.rmSync(tmp, { recursive: true, force: true });
		}
	}, 120_000);

	it('should be a no-op if no .enc exists', () => {
		const tmp = mkdtmp();
		// no encrypted file created
		const originalCwd = process.cwd();
		try {
			process.chdir(tmp);
			decryptPostBuild({ debug: true });

			expect(fs.existsSync(path.join(tmp, '.next', 'server', 'pixelated.config.json'))).toBe(false);
		} finally {
			process.chdir(originalCwd);
			fs.rmSync(tmp, { recursive: true, force: true });
		}
	}, 120_000);
});