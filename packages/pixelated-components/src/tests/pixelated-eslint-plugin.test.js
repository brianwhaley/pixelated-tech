import { describe, it, expect, test as vitestTest } from 'vitest';
import { Linter } from 'eslint';
import { pixelatedEslintPlugin as plugin } from '../test/test-utils';

describe('pixelated-eslint-plugin', () => {
	let pathModule;
	let layoutPath;
	let fixturesDir;
	beforeAll(async () => {
		pathModule = await import('path');
		const fs = await import('fs');
		fixturesDir = pathModule.join(process.cwd(), 'src', '__test_fixtures__');
		try { if (!fs.existsSync(fixturesDir)) fs.mkdirSync(fixturesDir, { recursive: true }); } catch (e) {}
		layoutPath = pathModule.join(fixturesDir, 'layout.tsx');
		// ensure a default layout file exists for rules that read layout.tsx
		try { fs.writeFileSync(layoutPath, 'export default function Layout(){ return (<></>); }'); } catch (e) {}
	});
	afterAll(async () => {
		const fs = await import('fs');
		try { if (fs.existsSync(layoutPath)) fs.unlinkSync(layoutPath); } catch (e) {}
		try { if (fs.existsSync(fixturesDir)) fs.rmdirSync(fixturesDir, { recursive: true }); } catch (e) {}
	});

	// Helpers for creating temporary project fixtures used by lockfile/override tests
	async function makeTempProject(files = {}) {
		const os = await import('os');
		const fs = await import('fs');
		const path = await import('path');
		const tmpdir = path.join(process.cwd(), 'src', '__tmp_projects__', `proj_${Date.now()}_${Math.random().toString(36).slice(2,8)}`);
		fs.mkdirSync(tmpdir, { recursive: true });
		for (const [name, content] of Object.entries(files)) {
			const full = path.join(tmpdir, name);
			fs.mkdirSync(path.dirname(full), { recursive: true });
			fs.writeFileSync(full, content);
		}
		return { tmpdir, cleanup: () => { try { fs.rmSync(tmpdir, { recursive: true, force: true }); } catch (e) {} } };
	}

	function verifyWithFilename(linter, code, config, filename) {
		const defaultFiles = ['**/*.{js,jsx,mjs,mjsx,cjs,cjsx,ts,tsx,mts,mtsx,cts,ctsx}'];
		return linter.verify(code, { files: config.files ?? defaultFiles, ...config }, { filename });
	}

	it('exports rules and configs', () => {
		expect(plugin).toBeDefined();
		expect(plugin.rules).toBeDefined();
		expect(plugin.configs).toBeDefined();
	});

	it('warns when a top-level <section> has no id', async () => {
		const linter = new Linter({ configType: 'flat' });
		const code = `export default function Page(){ return (<><section>Hi</section></>); }`;
		// use deterministic layoutPath from fixtures
		layoutPath = layoutPath || (await import('path')).join(process.cwd(), 'src', '__test_fixtures__', 'layout.tsx');
		const messages = linter.verify(code, {
			languageOptions: { parserOptions: { ecmaVersion: 2020, sourceType: 'module', ecmaFeatures: { jsx: true } } },
			plugins: { pixelated: plugin },
			rules: { 'pixelated/require-section-ids': 'warn' }
		});
		expect(messages.some(m => m.ruleId === 'pixelated/require-section-ids')).toBe(true);
	});

	it('does not warn when top-level <section> has an id', async () => {
		const linter = new Linter({ configType: 'flat' });
		const code = `export default function Page(){ return (<><section id=\"foo\">Hi</section></>); }`;
		layoutPath = layoutPath || (await import('path')).join(process.cwd(), 'src', '__test_fixtures__', 'layout.tsx');
		const messages = linter.verify(code, {
			languageOptions: { parserOptions: { ecmaVersion: 2020, sourceType: 'module', ecmaFeatures: { jsx: true } } },
			plugins: { pixelated: plugin },
			rules: { 'pixelated/require-section-ids': 'warn' }
		});
		expect(messages.some(m => m.ruleId === 'pixelated/require-section-ids')).toBe(false);
	});

	it('warns when required schemas are missing from layout.tsx', async () => {
		const linter = new Linter({ configType: 'flat' });
		const code = `export default function Layout(){ return (<head></head>); }`;
		const fs = await import('fs');
		try { fs.writeFileSync(layoutPath, code); } catch (e) {}
		const messages = verifyWithFilename(linter, code, {
			languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } } },
			plugins: { pixelated: plugin },
			rules: { 'pixelated/required-schemas': 'warn' },
		}, layoutPath);
		try { fs.writeFileSync(layoutPath, 'export default function Layout(){ return (<></>); }'); } catch (e) {}
		expect(messages.some(m => m.ruleId === 'pixelated/required-schemas')).toBe(true);
	});

	it('does not warn when required schemas are present in layout.tsx', async () => {
		const linter = new Linter({ configType: 'flat' });
		const code = `export default function Layout(){ return (<head><SchemaWebPage /><BreadcrumbListSchema /><WebsiteSchema /><LocalBusinessSchema /></head>); }`;
		layoutPath = layoutPath || (await import('path')).join(process.cwd(), 'src', '__test_fixtures__', 'layout.tsx');
		const messages = verifyWithFilename(linter, code, {
			languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } } },
			plugins: { pixelated: plugin },
			rules: { 'pixelated/required-schemas': 'warn' },
		}, layoutPath);
		expect(messages.some(m => m.ruleId === 'pixelated/required-schemas')).toBe(false);
	});

		it('warns when a <PageSection> has no id', async () => {
				const linter = new Linter({ configType: 'flat' });
						const code = `export default function Page(){ return (<PageSection>Content</PageSection>); }`;
			const messages = linter.verify(code, {
				languageOptions: { parserOptions: { ecmaVersion: 2020, sourceType: 'module', ecmaFeatures: { jsx: true } } },
				plugins: { pixelated: plugin },
				rules: { 'pixelated/require-section-ids': 'warn' }
			});
			expect(messages.some(m => m.ruleId === 'pixelated/require-section-ids')).toBe(true);
		});

		it('does not warn when <PageSection> has an id', async () => {
				const linter = new Linter({ configType: 'flat' });
						const code = `export default function Page(){ return (<PageSection id="ps">Content</PageSection>); }`;
			const messages = linter.verify(code, {
				languageOptions: { parserOptions: { ecmaVersion: 2020, sourceType: 'module', ecmaFeatures: { jsx: true } } },
				plugins: { pixelated: plugin },
				rules: { 'pixelated/require-section-ids': 'warn' }
			});
			expect(messages.some(m => m.ruleId === 'pixelated/require-section-ids')).toBe(false);
		});

		it('warns for member-expression UI.PageSection without id', async () => {
				const linter = new Linter({ configType: 'flat' });
						const code = `export default function Page(){ return (<UI.PageSection>Content</UI.PageSection>); }`;
			const messages = linter.verify(code, {
				languageOptions: { parserOptions: { ecmaVersion: 2020, sourceType: 'module', ecmaFeatures: { jsx: true } } },
				plugins: { pixelated: plugin },
				rules: { 'pixelated/require-section-ids': 'warn' }
			});
			expect(messages.some(m => m.ruleId === 'pixelated/require-section-ids')).toBe(true);
	});

	it('warns when a contentful image URL is missing ?fm=webp', async () => {
		const linter = new (await import('eslint')).Linter({ configType: 'flat' });
		const code = `export default function Page(){ return (<img src="https://images.ctfassets.net/abc123/image.jpg" />); }`;
		const messages = linter.verify(code, {
			languageOptions: { parserOptions: { ecmaVersion: 2020, sourceType: 'module', ecmaFeatures: { jsx: true } } },
			plugins: { pixelated: plugin },
			rules: { 'pixelated/require-contentful-image-webp': 'warn' }
		});
		expect(messages.some(m => m.ruleId === 'pixelated/require-contentful-image-webp')).toBe(true);
	});

	it('warns when editorial strings contain ambiguous pronouns in JSX text', async () => {
		const linter = new (await import('eslint')).Linter({ configType: 'flat' });
		const code = `export default function Page(){ return (<div>We are proud of our exceptional service.</div>); }`;
		const messages = linter.verify(code, {
			languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } } },
			plugins: { pixelated: plugin },
			rules: { 'pixelated/strict-pronoun-resolution': 'warn' }
		});
		expect(messages.some(m => m.ruleId === 'pixelated/strict-pronoun-resolution')).toBe(true);
	});

	it('does not warn when brand name appears in adjacent sentence', async () => {
		const linter = new (await import('eslint')).Linter({ configType: 'flat' });
		const code = `export default function Page(){ return (<div>Pixelated Technologies is growing fast. We are proud of our exceptional service.</div>); }`;
		const messages = linter.verify(code, {
			languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } } },
			plugins: { pixelated: plugin },
			rules: { 'pixelated/strict-pronoun-resolution': 'warn' }
		});
		expect(messages.some(m => m.ruleId === 'pixelated/strict-pronoun-resolution')).toBe(false);
	});

	it('does not warn when editorial strings are explicit and pronoun-free', async () => {
		const linter = new (await import('eslint')).Linter({ configType: 'flat' });
		const code = `export default function Page(){ return (<div>Pixelated provides exceptional service.</div>); }`;
		const messages = linter.verify(code, {
			languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } } },
			plugins: { pixelated: plugin },
			rules: { 'pixelated/strict-pronoun-resolution': 'warn' }
		});
		expect(messages.some(m => m.ruleId === 'pixelated/strict-pronoun-resolution')).toBe(false);
	});

	it('warns when <a> uses generic CTA link text', async () => {
		const linter = new (await import('eslint')).Linter({ configType: 'flat' });
		const code = `export default function Page(){ return (<a href="/test">Click Here</a>); }`;
		const messages = linter.verify(code, {
			languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } } },
			plugins: { pixelated: plugin },
			rules: { 'pixelated/no-generic-cta-text': 'warn' }
		});
		expect(messages.some(m => m.ruleId === 'pixelated/no-generic-cta-text')).toBe(true);
	});

	it('warns when buttonText prop uses generic CTA text', async () => {
		const linter = new (await import('eslint')).Linter({ configType: 'flat' });
		const code = `export default function Page(){ return (<Callout url="/test" buttonText="Click Here" />); }`;
		const messages = linter.verify(code, {
			languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } } },
			plugins: { pixelated: plugin },
			rules: { 'pixelated/no-generic-cta-text': 'warn' }
		});
		expect(messages.some(m => m.ruleId === 'pixelated/no-generic-cta-text')).toBe(true);
	});

	it('warns when ctaLabel prop uses generic CTA text', async () => {
		const linter = new (await import('eslint')).Linter({ configType: 'flat' });
		const code = `export default function Page(){ return (<PageHeader ctaHref="/test" ctaLabel="Learn More" />); }`;
		const messages = linter.verify(code, {
			languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } } },
			plugins: { pixelated: plugin },
			rules: { 'pixelated/no-generic-cta-text': 'warn' }
		});
		expect(messages.some(m => m.ruleId === 'pixelated/no-generic-cta-text')).toBe(true);
	});

	it('does not warn for descriptive CTA text', async () => {
		const linter = new (await import('eslint')).Linter({ configType: 'flat' });
		const code = `export default function Page(){ return (<a href="/test">Get started</a>); }`;
		const messages = linter.verify(code, {
			languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } } },
			plugins: { pixelated: plugin },
			rules: { 'pixelated/no-generic-cta-text': 'warn' }
		});
		expect(messages.some(m => m.ruleId === 'pixelated/no-generic-cta-text')).toBe(false);
	});

	it('warns when JSX attribute strings contain ambiguous pronouns', async () => {
		const linter = new (await import('eslint')).Linter({ configType: 'flat' });
		const code = `export default function Page(){ return (<div title="We are proud of our service">Hello</div>); }`;
		const messages = linter.verify(code, {
			languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } } },
			plugins: { pixelated: plugin },
			rules: { 'pixelated/strict-pronoun-resolution': 'warn' }
		});
		expect(messages.some(m => m.ruleId === 'pixelated/strict-pronoun-resolution')).toBe(true);
	});

	it('warns when JSON string values contain ambiguous pronouns', async () => {
				const jsonPlugin = await import('@eslint/json');
		const { Linter } = await import('eslint');
		const linter = new Linter({ configType: 'flat' });
		const code = '{"title":"We are proud of our service","description":"Pixelated provides exceptional service."}';
		const messages = linter.verify(code, {
			language: 'json/jsonc',
			plugins: { json: jsonPlugin.default, pixelated: plugin },
			rules: { 'pixelated/strict-pronoun-resolution': 'warn' }
		});
		expect(messages.some(m => m.ruleId === 'pixelated/strict-pronoun-resolution')).toBe(true);
	});

	it('does not warn when JSON string values are explicit', async () => {
				const jsonPlugin = await import('@eslint/json');
		const { Linter } = await import('eslint');
		const linter = new Linter({ configType: 'flat' });
		const code = '{"title":"Pixelated provides exceptional service","description":"Pixelated remains the best."}';
		const messages = linter.verify(code, {
			language: 'json/jsonc',
			plugins: { json: jsonPlugin.default, pixelated: plugin },
			rules: { 'pixelated/strict-pronoun-resolution': 'warn' }
		});
		expect(messages.some(m => m.ruleId === 'pixelated/strict-pronoun-resolution')).toBe(false);
	});

	it('does not warn when a contentful image URL includes ?fm=webp', async () => {
		const linter = new (await import('eslint')).Linter({ configType: 'flat' });
		const code = `export default function Page(){ return (<img src="https://images.ctfassets.net/abc123/image.jpg?fm=webp" />); }`;
		const messages = linter.verify(code, {
			languageOptions: { parserOptions: { ecmaVersion: 2020, sourceType: 'module', ecmaFeatures: { jsx: true } } },
			plugins: { pixelated: plugin },
			rules: { 'pixelated/require-contentful-image-webp': 'warn' }
		});
		expect(messages.some(m => m.ruleId === 'pixelated/require-contentful-image-webp')).toBe(false);
	});

	it.skip('enforces canonical test file locations (valid/invalid)', async () => {
		const linter = new (await import('eslint')).Linter({ configType: 'flat' });

        
		// valid: src/tests
		const ok1 = verifyWithFilename(linter, 'test("x", ()=>{});', {
			languageOptions: { parserOptions: { ecmaVersion: 2020, sourceType: 'module' } },
			plugins: { pixelated: plugin },
			rules: { 'pixelated/validate-test-locations': 'error' },
		}, pathModule.join(process.cwd(), 'src', 'tests', 'foo.test.ts'));
		expect(ok1.some(m => m.ruleId === 'pixelated/validate-test-locations')).toBe(false);

		// valid: stories
		const ok2 = verifyWithFilename(linter, 'export const s = {}', {
			languageOptions: { parserOptions: { ecmaVersion: 2020, sourceType: 'module', ecmaFeatures: { jsx: true } } },
			plugins: { pixelated: plugin },
			rules: { 'pixelated/validate-test-locations': 'error' },
		}, pathModule.join(process.cwd(), 'src', 'stories', 'foo.stories.tsx'));
		expect(ok2.some(m => m.ruleId === 'pixelated/validate-test-locations')).toBe(false);

		// invalid: test file placed under components/
		const badPath = pathModule.resolve(process.cwd(), 'src', 'components', 'foo', 'foo.test.tsx');
		const fs = await import('fs');
		fs.mkdirSync(pathModule.dirname(badPath), { recursive: true });
		fs.writeFileSync(badPath, 'test("x", ()=>{});');
		const bad = verifyWithFilename(linter, fs.readFileSync(badPath, 'utf8'), {
			languageOptions: { parserOptions: { ecmaVersion: 2020, sourceType: 'module' } },
			plugins: { pixelated: plugin },
			rules: { 'pixelated/validate-test-locations': 'error' },
		}, badPath);
		try { fs.unlinkSync(badPath); } catch (e) {}
		expect(bad.some(m => m.ruleId === 'pixelated/validate-test-locations')).toBe(true);
	});

	it('disallows process.env / import.meta.env except PIXELATED_CONFIG_KEY', async () => {
		const linter = new (await import('eslint')).Linter({ configType: 'flat' });

		const cfg = {
			languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: 'module' } },
			plugins: { pixelated: plugin },
			rules: { 'pixelated/no-process-env': ['error', { allowed: ['PIXELATED_CONFIG_KEY'] }] },
		};

		// disallowed usages
		expect(linter.verify('const x = process.env.FOO;', cfg).some(m => m.ruleId === 'pixelated/no-process-env')).toBe(true);
		expect(linter.verify("const x = process['env']['BAR'];", cfg).some(m => m.ruleId === 'pixelated/no-process-env')).toBe(true);
		expect(linter.verify('const { BAR } = process.env;', cfg).some(m => m.ruleId === 'pixelated/no-process-env')).toBe(true);
		expect(linter.verify('const z = import.meta.env.BAR;', cfg).some(m => m.ruleId === 'pixelated/no-process-env')).toBe(true);

		// allowed exception
		expect(linter.verify('const k = process.env.PIXELATED_CONFIG_KEY;', cfg).some(m => m.ruleId === 'pixelated/no-process-env')).toBe(false);
		expect(linter.verify('const k = import.meta.env.PIXELATED_CONFIG_KEY;', cfg).some(m => m.ruleId === 'pixelated/no-process-env')).toBe(false);
	});

	it.skip('warns when file sets debug = true (and allows debug in tests/stories)', async () => {
		const linter = new (await import('eslint')).Linter({ configType: 'flat' });
		const cfg = { languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: 'module' } }, plugins: { pixelated: plugin }, rules: { 'pixelated/no-debug-true': 'warn' } };

        
		// top-level variable
		const dpath1 = pathModule.resolve(process.cwd(), 'src', 'components', 'foo.tsx');
		const fs = await import('fs');
		fs.mkdirSync(pathModule.dirname(dpath1), { recursive: true });
		fs.writeFileSync(dpath1, 'const debug = true;');
		expect(verifyWithFilename(linter, fs.readFileSync(dpath1, 'utf8'), cfg, dpath1).some(m => m.ruleId === 'pixelated/no-debug-true')).toBe(true);
		// object literal
		expect(verifyWithFilename(linter, 'const cfg = { debug: true };', cfg, dpath1).some(m => m.ruleId === 'pixelated/no-debug-true')).toBe(true);
		fs.unlinkSync(dpath1);
		// assignment
		expect(verifyWithFilename(linter, 'module.exports.debug = true;', cfg, pathModule.join(process.cwd(), 'src', 'lib', 'index.js')).some(m => m.ruleId === 'pixelated/no-debug-true')).toBe(true);
		// uppercase DEBUG is allowed to be caught too
		expect(verifyWithFilename(linter, 'const DEBUG = true;', cfg, pathModule.join(process.cwd(), 'src', 'components', 'foo.tsx')).some(m => m.ruleId === 'pixelated/no-debug-true')).toBe(true);

		// allowed in test files / stories
		expect(verifyWithFilename(linter, 'const debug = true;', cfg, pathModule.join(process.cwd(), 'src', 'tests', 'foo.test.ts')).some(m => m.ruleId === 'pixelated/no-debug-true')).toBe(false);
		expect(verifyWithFilename(linter, 'const debug = true;', cfg, pathModule.join(process.cwd(), 'src', 'stories', 'foo.stories.tsx')).some(m => m.ruleId === 'pixelated/no-debug-true')).toBe(false);
	});

	it.skip('enforces kebab-case for filenames (allow list & exemptions)', async () => {
		const linter = new (await import('eslint')).Linter({ configType: 'flat' });
		const cfg = { languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: 'module' } }, plugins: { pixelated: plugin }, rules: { 'pixelated/file-name-kebab-case': 'warn' } };

		if (!pathModule) pathModule = await import('path');
		// valid kebab-case
		const kpath = pathModule.resolve(process.cwd(), 'src', 'components', 'my-component.tsx');
		const fs = await import('fs');
		fs.mkdirSync(pathModule.dirname(kpath), { recursive: true });
		fs.writeFileSync(kpath, 'const x = 1;');
		expect(verifyWithFilename(linter, fs.readFileSync(kpath, 'utf8'), cfg, kpath).length).toBe(0);
		fs.unlinkSync(kpath);
		// allowed index and README
		expect(verifyWithFilename(linter, 'export {}', cfg, pathModule.join(process.cwd(), 'src', 'components', 'index.tsx')).length).toBe(0);
		expect(verifyWithFilename(linter, 'export {}', cfg, pathModule.join(process.cwd(), 'README.md')).length).toBe(0);
		// test/story files are exempt
		expect(verifyWithFilename(linter, 'test("x",()=>{})', cfg, pathModule.join(process.cwd(), 'src', 'components', 'my-component.test.tsx')).length).toBe(0);
		expect(verifyWithFilename(linter, 'export const s = {}', cfg, pathModule.join(process.cwd(), 'src', 'stories', 'MyComponent.stories.tsx')).length).toBe(0);
		// violations
		expect(verifyWithFilename(linter, 'const x = 1;', cfg, pathModule.join(process.cwd(), 'src', 'components', 'myComponent.tsx')).some(m => m.ruleId === 'pixelated/file-name-kebab-case')).toBe(true);
		expect(verifyWithFilename(linter, 'const x = 1;', cfg, pathModule.join(process.cwd(), 'src', 'components', 'MyComponent.tsx')).some(m => m.ruleId === 'pixelated/file-name-kebab-case')).toBe(true);
		expect(verifyWithFilename(linter, 'const x = 1;', cfg, pathModule.join(process.cwd(), 'src', 'components', 'my_component.tsx')).some(m => m.ruleId === 'pixelated/file-name-kebab-case')).toBe(true);
	});

	it('enforces kebab-case for JSX className values', async () => {
		const linter = new (await import('eslint')).Linter({ configType: 'flat' });
		const cfg = { languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } } }, plugins: { pixelated: plugin }, rules: { 'pixelated/class-name-kebab-case': 'warn' } };

		// valid
		expect(linter.verify('export default function X(){ return (<div className="callout-title-text other-class">Hi</div>); }', cfg).length).toBe(0);

		// invalid: camelCase and snake_case
		const msgs = linter.verify('export default function X(){ return (<div className="calloutTitleText callout_title_text">Hi</div>); }', cfg);
		expect(msgs.some(m => m.ruleId === 'pixelated/class-name-kebab-case')).toBe(true);
	});

	it.skip('detects duplicate exported identifiers when a barrel re-exports two modules that export the same name', async () => {
		const linter = new (await import('eslint')).Linter({ configType: 'flat' });

		// Create a temporary module directory under src for deterministic resolution
		const fs = await import('fs');
		const tmpDir = pathModule.join(process.cwd(), 'src', '__tmp_barrel__');
		if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
		// a.js and b.js both export the same identifier 'dupeName'
		fs.writeFileSync(pathModule.join(tmpDir, 'a.js'), 'export function dupeName() {}');
		fs.writeFileSync(pathModule.join(tmpDir, 'b.js'), 'export const dupeName = 1;');

		const barrelPath = pathModule.resolve(process.cwd(), 'src', 'barrel.mock.js');
		const barrelCode = "export * from './__tmp_barrel__/a';\nexport * from './__tmp_barrel__/b';";
		fs.writeFileSync(barrelPath, barrelCode);
		const messages = verifyWithFilename(linter, fs.readFileSync(barrelPath, 'utf8'), {
			languageOptions: { parserOptions: { ecmaVersion: 2020, sourceType: 'module' } },
			plugins: { pixelated: plugin },
			rules: { 'pixelated/no-duplicate-export-names': 'error' },
		}, barrelPath);

		// Clean up
		fs.unlinkSync(pathModule.join(tmpDir, 'a.js'));
		fs.unlinkSync(pathModule.join(tmpDir, 'b.js'));
		try { fs.rmdirSync(tmpDir, { recursive: true }); } catch (e) {}
		expect(messages.some(m => m.ruleId === 'pixelated/no-duplicate-export-names' && /dupeName/.test(m.message))).toBe(true);

		// index barrels are intentionally ignored by the rule (legacy/resolution permissive)
		const messagesIndex = linter.verify(barrelCode, {
			languageOptions: { parserOptions: { ecmaVersion: 2020, sourceType: 'module' } },
			plugins: { pixelated: plugin },
			rules: { 'pixelated/no-duplicate-export-names': 'error' },
		}, 'src/index.mock.js');
		expect(messagesIndex.some(m => m.ruleId === 'pixelated/no-duplicate-export-names')).toBe(false);
	});

	it('warns when propTypes lack JSDoc or inline comments for client components', async () => {
		const linter = new (await import('eslint')).Linter({ configType: 'flat' });
		const code = `'use client';
	export function C() { useEffect(()=>{}); }
	C.propTypes = { a: PropTypes.string }`;
		const messages = linter.verify(code, {
			languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } } },
			plugins: { pixelated: plugin },
			rules: { 'pixelated/required-proptypes-jsdoc': 'error' },
		});
		expect(messages.some(m => m.ruleId === 'pixelated/required-proptypes-jsdoc')).toBe(true);
	});

	it('does not warn when JSDoc above propTypes exists', async () => {
		const linter = new (await import('eslint')).Linter({ configType: 'flat' });
		const code = `'use client';
	export function C() { useEffect(()=>{}); }
	/**\n * Component C\n * @param {string} [props] - description\n */
	C.propTypes = { a: PropTypes.string }`;
		const messages = linter.verify(code, {
			languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } } },
			plugins: { pixelated: plugin },
			rules: { 'pixelated/required-proptypes-jsdoc': 'error' },
		});
		expect(messages.some(m => m.ruleId === 'pixelated/required-proptypes-jsdoc')).toBe(false);
	});

	it('does not warn when per-prop inline comments exist', async () => {
		const linter = new (await import('eslint')).Linter({ configType: 'flat' });
		const code = `'use client';
	export function C() { useEffect(()=>{}); }
	C.propTypes = { /* x */ a: PropTypes.string }`;
		const messages = linter.verify(code, {
			languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } } },
			plugins: { pixelated: plugin },
			rules: { 'pixelated/required-proptypes-jsdoc': 'error' },
		});
		expect(messages.some(m => m.ruleId === 'pixelated/required-proptypes-jsdoc')).toBe(false);
	});

	it('regression: exported rules are present in recommended config', async () => {
		const expected = ['validate-test-locations', 'no-process-env', 'no-debug-true', 'file-name-kebab-case', 'required-proptypes-jsdoc', 'class-name-kebab-case'];
		expected.forEach(r => {
			expect(plugin.rules[r]).toBeDefined();
			expect(plugin.configs).toBeDefined();
			expect(plugin.configs.recommended).toBeDefined();
			expect(plugin.configs.recommended.rules[`pixelated/${r}`]).toBeDefined();
		});
		expect(plugin.configs.recommended.rules['pixelated/required-proptypes-jsdoc']).toBe('error');
		expect(plugin.configs.recommended.rules['pixelated/no-temp-dependency']).toBe('error');
	});

	it('errors when package-lock contains vulnerable temp dep', async () => {
		const linter = new (await import('eslint')).Linter({ configType: 'flat' });

		const fs = await import('fs');
		const os = await import('os');
		const tmpdir = fs.mkdtempSync(pathModule.join(os.tmpdir(), 'pkg-'));
		const lockFullPath = pathModule.join(tmpdir, 'package-lock.json');
		fs.writeFileSync(lockFullPath, JSON.stringify({ dependencies: { 'fast-xml-parser': { version: '5.2.5' } } }));
		const oldCwd = process.cwd();
		process.chdir(tmpdir);

		const code = 'const x = 1;';
		const messages = linter.verify(code, {
			languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: 'module' } },
			plugins: { pixelated: plugin },
			rules: { 'pixelated/no-temp-dependency': 'error' },
		}, 'src/index.js');

		fs.unlinkSync(lockFullPath);
		process.chdir(oldCwd);
		fs.rmdirSync(tmpdir, { recursive: true });
		expect(messages.some(m => m.ruleId === 'pixelated/no-temp-dependency')).toBe(true);
	});

	it('does not error when package-lock contains patched dep', async () => {
		const linter = new (await import('eslint')).Linter({ configType: 'flat' });

		const fs = await import('fs');
		const os = await import('os');
		const tmpdir = fs.mkdtempSync(pathModule.join(os.tmpdir(), 'pkg-'));
		const lockFullPath = pathModule.join(tmpdir, 'package-lock.test.json');
		fs.writeFileSync(lockFullPath, JSON.stringify({ dependencies: { 'fast-xml-parser': { version: '5.3.4' } } }));

		const code = 'const x = 1;';
		const messages = linter.verify(code, {
			languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: 'module' } },
			plugins: { pixelated: plugin },
			rules: { 'pixelated/no-temp-dependency': 'error' },
				}, 'src/index.js');

		fs.unlinkSync(lockFullPath);
		fs.rmdirSync(tmpdir, { recursive: true });
		expect(messages.some(m => m.ruleId === 'pixelated/no-temp-dependency')).toBe(false);
	});

	it.skip('errors when lockfile is clean but package.json has an override for the temp dep', async () => {
		const linter = new (await import('eslint')).Linter({ configType: 'flat' });

			const fs = await import('fs');
			const os = await import('os');
			const tmpdir = fs.mkdtempSync(pathModule.join(os.tmpdir(), 'pkg-'));
			try {
				// patched lockfile - use package-lock v3 'packages' layout so rules can find library entries
				const lock = { packages: { 'node_modules/@aws-sdk/xml-builder': { version: '3.972.2', dependencies: { 'fast-xml-parser': '5.3.4' } } } };
				fs.writeFileSync(pathModule.join(tmpdir, 'package-lock.json'), JSON.stringify(lock));
				// package.json with override that maps xml-builder -> fast-xml-parser
				fs.writeFileSync(pathModule.join(tmpdir, 'package.json'), JSON.stringify({ overrides: { '@aws-sdk/xml-builder': { 'fast-xml-parser': '^5.3.4' } } }));

			const oldCwd = process.cwd();
			process.chdir(tmpdir);

			const code = 'const x = 1;';
			const messages = linter.verify(code, {
				languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: 'module' } },
				plugins: { pixelated: plugin },
					rules: { 'pixelated/no-temp-dependency': 'error', 'pixelated/no-stale-override': 'error' },
				}, 'src/index.js');

			process.chdir(oldCwd);
			expect(messages.some(m => m.ruleId === 'pixelated/no-temp-dependency')).toBe(false);
			expect(messages.some(m => m.ruleId === 'pixelated/no-stale-override')).toBe(false);
		} finally {
			fs.rmSync(tmpdir, { recursive: true, force: true });
		}
	});

		// new test: safe xml-builder version should not trigger the rule
		it.skip('ignores xml-builder 3.972.5 since parser is fixed', async () => {
				const linter = new (await import('eslint')).Linter({ configType: 'flat' });
			
			const fs = await import('fs');
			const os = await import('os');
			const tmpdir = fs.mkdtempSync(pathModule.join(os.tmpdir(), 'pkg-'));
			try {
				const lock = { packages: { 'node_modules/@aws-sdk/xml-builder': { version: '3.972.5', dependencies: { 'fast-xml-parser': '5.3.6' } } } };
				fs.writeFileSync(pathModule.join(tmpdir, 'package-lock.json'), JSON.stringify(lock));
				fs.writeFileSync(pathModule.join(tmpdir, 'package.json'), JSON.stringify({}));

				const oldCwd = process.cwd();
				process.chdir(tmpdir);

				const code = 'const x = 1;';
				const messages = linter.verify(code, {
					languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: 'module' } },
					plugins: { pixelated: plugin },
					rules: { 'pixelated/no-temp-dependency': 'error', 'pixelated/no-stale-override': 'error' },
				}, 'src/index.js');

				process.chdir(oldCwd);
				expect(messages.some(m => m.ruleId === 'pixelated/no-temp-dependency')).toBe(false);
				expect(messages.some(m => m.ruleId === 'pixelated/no-stale-override')).toBe(true);
			} finally {
				fs.rmSync(tmpdir, { recursive: true, force: true });
			}
		});

		it.skip('reports nested vulnerable copy and does not flag stale override', async () => {
				const linter = new (await import('eslint')).Linter({ configType: 'flat' });
			
			const fs = await import('fs');
			const os = await import('os');
			const tmpdir = fs.mkdtempSync(pathModule.join(os.tmpdir(), 'pkg-'));
			try {
				const lock = { packages: { 'node_modules/@aws-sdk/xml-builder': { version: '3.972.5', dependencies: { 'fast-xml-parser': '5.3.6' } } } };
				fs.writeFileSync(pathModule.join(tmpdir, 'package-lock.json'), JSON.stringify(lock));
				fs.writeFileSync(pathModule.join(tmpdir, 'package.json'), JSON.stringify({}));

				const oldCwd = process.cwd();
				process.chdir(tmpdir);

				const code = 'const x = 1;';
				const messages = linter.verify(code, {
					languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: 'module' } },
					plugins: { pixelated: plugin },
					rules: { 'pixelated/no-temp-dependency': 'error', 'pixelated/no-stale-override': 'error' },
				}, 'src/index.js');

				process.chdir(oldCwd);
				expect(messages.some(m => m.ruleId === 'pixelated/no-temp-dependency')).toBe(true);
				expect(messages.some(m => m.ruleId === 'pixelated/no-stale-override')).toBe(false);
			} finally {
				fs.rmSync(tmpdir, { recursive: true, force: true });
			}
		});

		it('errors when override is stale because library declares equal-or-higher dependency', async () => {
				const linter = new (await import('eslint')).Linter({ configType: 'flat' });
			
			const fs = await import('fs');
			const os = await import('os');
			const tmpdir = fs.mkdtempSync(pathModule.join(os.tmpdir(), 'pkg-'));
			try {
				// library declares equal dependency
				const lock = { packages: { 'node_modules/@aws-sdk/xml-builder': { version: '3.972.2', dependencies: { 'fast-xml-parser': '5.3.4' } } } };
				fs.writeFileSync(pathModule.join(tmpdir, 'package-lock.json'), JSON.stringify(lock));
				fs.writeFileSync(pathModule.join(tmpdir, 'package.json'), JSON.stringify({ overrides: { '@aws-sdk/xml-builder': { 'fast-xml-parser': '^5.3.4' } } }));

				const oldCwd = process.cwd();
				process.chdir(tmpdir);

				const code = 'const x = 1;';
				const messages = linter.verify(code, {
					languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: 'module' } },
					plugins: { pixelated: plugin },
					rules: { 'pixelated/no-stale-override': 'error' },
				}, 'src/index.js');

				process.chdir(oldCwd);
				expect(messages.some(m => m.ruleId === 'pixelated/no-stale-override')).toBe(true);
			} finally {
				fs.rmSync(tmpdir, { recursive: true, force: true });
			}
		});

		it('does not error when override is necessary (library requires older version)', async () => {
				const linter = new (await import('eslint')).Linter({ configType: 'flat' });
			
			const fs = await import('fs');
			const os = await import('os');
			const tmpdir = fs.mkdtempSync(pathModule.join(os.tmpdir(), 'pkg-'));
			try {
				const lock = { packages: { 'node_modules/@aws-sdk/xml-builder': { version: '3.972.2', dependencies: { 'fast-xml-parser': '5.2.5' } } } };
				fs.writeFileSync(pathModule.join(tmpdir, 'package-lock.json'), JSON.stringify(lock));
				fs.writeFileSync(pathModule.join(tmpdir, 'package.json'), JSON.stringify({ overrides: { '@aws-sdk/xml-builder': { 'fast-xml-parser': '^5.3.4' } } }));

				const oldCwd = process.cwd();
				process.chdir(tmpdir);

				const code = 'const x = 1;';
				const messages = linter.verify(code, {
					languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: 'module' } },
					plugins: { pixelated: plugin },
					rules: { 'pixelated/no-stale-override': 'error' },
				}, 'src/index.js');

				process.chdir(oldCwd);
				expect(messages.some(m => m.ruleId === 'pixelated/no-stale-override')).toBe(false);
			} finally {
				fs.rmSync(tmpdir, { recursive: true, force: true });
			}
		});

		it('errors when a root override target is missing from the lockfile', async () => {
				const linter = new (await import('eslint')).Linter({ configType: 'flat' });
			
			const fs = await import('fs');
			const os = await import('os');
			const tmpdir = fs.mkdtempSync(pathModule.join(os.tmpdir(), 'pkg-'));
			try {
				const lock = { packages: { '': { dependencies: { react: '^19.0.0' } } } };
				fs.writeFileSync(pathModule.join(tmpdir, 'package-lock.json'), JSON.stringify(lock));
				fs.writeFileSync(pathModule.join(tmpdir, 'package.json'), JSON.stringify({ overrides: { 'left-pad': '^1.3.0' } }));

				const oldCwd = process.cwd();
				process.chdir(tmpdir);

				const code = 'const x = 1;';
				const messages = linter.verify(code, {
					languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: 'module' } },
					plugins: { pixelated: plugin },
					rules: { 'pixelated/no-stale-override': 'error' },
				}, 'src/index.js');

				process.chdir(oldCwd);
				expect(messages.some(m => m.ruleId === 'pixelated/no-stale-override')).toBe(true);
			} finally {
				fs.rmSync(tmpdir, { recursive: true, force: true });
			}
		});
	});