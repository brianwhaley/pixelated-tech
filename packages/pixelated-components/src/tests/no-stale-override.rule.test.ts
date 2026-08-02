import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { pixelatedEslintPlugin as plugin } from '../test/test-utils';

function createTemporaryProject(files: Record<string, string>) {
	const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pixelated-eslint-'));
	for (const [relativePath, contents] of Object.entries(files)) {
		const absolutePath = path.join(projectRoot, relativePath);
		fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
		fs.writeFileSync(absolutePath, contents);
	}
	return projectRoot;
}

describe('pixelated no-stale-override rule', () => {
	it('errors when a root override target is missing from the lockfile', async () => {
		const { Linter } = await import('eslint');
		const linter = new Linter({ configType: 'flat' });

		const projectRoot = createTemporaryProject({
			'package-lock.json': JSON.stringify({ packages: { '': { dependencies: { react: '^19.0.0' } } } }, null, 2),
			'package.json': JSON.stringify({ overrides: { 'left-pad': '^1.3.0' } }, null, 2),
		});

		const oldCwd = process.cwd();
		process.chdir(projectRoot);
		try {
			const messages = linter.verify('const x = 1;', {
				files: ['**/*.{js,jsx,mjs,mjsx,cjs,cjsx,ts,tsx,mts,mtsx,cts,ctsx}'],
				languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
				plugins: { pixelated: plugin },
				rules: { 'pixelated/no-stale-override': 'error' },
			}, { filename: 'src/index.ts' });

			expect(messages.some((message) => message.ruleId === 'pixelated/no-stale-override')).toBe(true);
		} finally {
			process.chdir(oldCwd);
			fs.rmSync(projectRoot, { recursive: true, force: true });
		}
	});

	it('does not error when override is necessary', async () => {
		const { Linter } = await import('eslint');
		const linter = new Linter({ configType: 'flat' });

		const projectRoot = createTemporaryProject({
			'package-lock.json': JSON.stringify({
				packages: {
					'node_modules/@aws-sdk/xml-builder': {
						version: '3.972.2',
						dependencies: { 'fast-xml-parser': '5.2.5' },
					},
				},
			}, null, 2),
			'package.json': JSON.stringify({ overrides: { '@aws-sdk/xml-builder': { 'fast-xml-parser': '^5.3.4' } } }, null, 2),
		});

		const oldCwd = process.cwd();
		process.chdir(projectRoot);
		try {
			const messages = linter.verify('const x = 1;', {
				files: ['**/*.{js,jsx,mjs,mjsx,cjs,cjsx,ts,tsx,mts,mtsx,cts,ctsx}'],
				languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
				plugins: { pixelated: plugin },
				rules: { 'pixelated/no-stale-override': 'error' },
			}, { filename: 'src/index.ts' });

			expect(messages.some((message) => message.ruleId === 'pixelated/no-stale-override')).toBe(false);
		} finally {
			process.chdir(oldCwd);
			fs.rmSync(projectRoot, { recursive: true, force: true });
		}
	});
});
