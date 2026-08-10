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

describe('create-pixelated-app CLI', () => {
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