import { describe, it, expect, vi, beforeEach, afterEach, test as vitestTest } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

// NOTE: we intentionally avoid static imports of the script module because tests
// need to control the behavior of `child_process.exec` (which is promisified and
// exported as `_exec`). We mock `child_process` per-test with `vi.doMock` and
// then dynamically import the module so the module's `exec` binding picks up
// our mocked implementation.

const skipNetworkTests = false;

describe('createAndPushRemote (injected)', () => {
	let tmpDir;
	beforeEach(() => {
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'create-site-'));
	});

	afterEach(() => {
		try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
		vi.restoreAllMocks();
		// reset any module mocks
		vi.resetModules();
	});

	vitestTest.skip('creates repo successfully when provider returns token and GitHub returns clone_url', async () => {
		// Provide a mocked child_process.exec that calls the callback with stdout JSON for the inline tsx probe
		const mockExecCb = (cmd, opts, cb) => {
			if (typeof opts === 'function') { cb = opts; }
			if (String(cmd).includes('npx tsx')) {
				cb(null, JSON.stringify({ token: 'fake-token', defaultOwner: 'me' }), '');
				return;
			}
			// git commands
			cb(null, '', '');
		};

		// ensure git commands don't hit real ~/.gitconfig by providing a fake `git` in PATH
		const binDir = path.join(tmpDir, 'bin');
		await fs.promises.mkdir(binDir, { recursive: true });
		const gitPath = path.join(binDir, 'git');
		await fs.promises.writeFile(gitPath, '#!/bin/sh\necho "ok"\nexit 0\n');
		await fs.promises.chmod(gitPath, 0o755);
		process.env.PATH = `${binDir}${path.delimiter}${process.env.PATH}`;

		// Mock child_process.exec before importing module so internal exec is our stub
		vi.doMock('child_process', async (importOriginal) => {
			const actual = await importOriginal();
			const execFn = (cmd, opts, cb) => { if (typeof opts === 'function') cb = opts; if (String(cmd).includes('npx tsx')) return cb(null, JSON.stringify({ token: 'fake-token', defaultOwner: 'me' }), ''); return cb(null, '', ''); };
			return { ...actual, exec: execFn, default: { ...actual, exec: execFn } };
		});
		const appModule = await import('../scripts/create-pixelated-app.js');

		// Injected dependencies
		const injectedExec = async (cmd) => {
			if (String(cmd).includes('npx tsx')) return { stdout: JSON.stringify({ token: 'fake-token', defaultOwner: 'me' }), stderr: '' };
			return { stdout: '', stderr: '' };
		};
		const injectedFetch = vi.fn(async () => ({ ok: true, json: async () => ({ clone_url: 'https://github.com/me/test.git' }) }));

		await expect(appModule.createAndPushRemote(tmpDir, 'test', 'me', { exec: injectedExec, fetch: injectedFetch })).resolves.not.toThrow();
		const res = await appModule.createAndPushRemote(tmpDir, 'test', 'me', { exec: injectedExec, fetch: injectedFetch });
		expect(res).toHaveProperty('cloneUrl', 'https://github.com/me/test.git');
	});

	vitestTest.skip('throws when provider output does not include token', async () => {
		const mockExecCb = (cmd, opts, cb) => { if (typeof opts === 'function') { cb = opts; } if (String(cmd).includes('npx tsx')) { cb(null, JSON.stringify({}), ''); return; } cb(null, '', ''); };
		const binDir = path.join(tmpDir, 'bin');
		await fs.promises.mkdir(binDir, { recursive: true });
		const gitPath = path.join(binDir, 'git');
		await fs.promises.writeFile(gitPath, '#!/bin/sh\necho "ok"\nexit 0\n');
		await fs.promises.chmod(gitPath, 0o755);
		process.env.PATH = `${binDir}${path.delimiter}${process.env.PATH}`;

		// Injected exec that returns empty token output
		const injectedExecEmpty = async (cmd) => ({ stdout: '', stderr: '' });
		vi.doMock('child_process', async (importOriginal) => { const actual = await importOriginal(); const execFn = (cmd, opts, cb) => { if (typeof opts === 'function') cb = opts; return cb(null, '', ''); }; return { ...actual, exec: execFn, default: { ...actual, exec: execFn } }; });
		const appModule2 = await import('../scripts/create-pixelated-app.js');
		await expect(appModule2.createAndPushRemote(tmpDir, 'test', 'me')).rejects.toThrow(/Missing github.token/);
	});

	it('creates an Amplify app when AWS SDK client is present and commands succeed', async () => {
			const sendMock = vi.fn(async (cmd) => {
				if (cmd && cmd.input && cmd.input.name) return { app: { appId: 'd1example' } };
				return {};
			});
			const MockClient = vi.fn(function MockClientImpl(opts) { this.send = sendMock; });

		// For Amplify flow, inject exec, fs and Amplify client
		const injectedExecForAmplify = async (cmd) => ({ stdout: JSON.stringify({}), stderr: '' });
		const injectedFs = {
			access: async (p) => {},
			readFile: async (p) => {
				const s = String(p || '');
				if (s.includes('pixelated.config.json')) return JSON.stringify({ aws: { access_key_id: 'AKIA_TEST', secret_access_key: 'SECRET_TEST', region: 'us-east-2' } });
				if (s.endsWith('.env.local')) return 'PIXELATED_CONFIG_KEY=TEST_KEY_VALUE\n';
				return JSON.stringify({});
			}
		};
		const sendMock2 = vi.fn(async (cmd) => ({ app: { appId: 'd1example' } }));
		function MockClient2(opts) { this.send = sendMock2; }
		vi.doMock('child_process', async (importOriginal) => { const actual = await importOriginal(); const execFn = (cmd, opts, cb) => { if (typeof opts === 'function') cb = opts; return cb(null, '', ''); }; return { ...actual, exec: execFn, default: { ...actual, exec: execFn } }; });
		// Mock Amplify client module used in the script so it constructs our MockClient2
		vi.doMock('@aws-sdk/client-amplify', async () => ({ AmplifyClient: MockClient2, CreateAppCommand: function(i){ this.input = i }, UpdateAppCommand: function(i){ this.input = i }, UpdateBranchCommand: function(i){ this.input = i } }));
		const appModule3 = await import('../scripts/create-pixelated-app.js');
		await expect(appModule3.createAmplifyApp({ question: vi.fn().mockResolvedValue('') }, 'test-site', 'https://github.com/me/test-site.git', tmpDir)).resolves.not.toThrow();
		expect(sendMock2.mock.calls.length).toBeGreaterThan(0);
	});

});