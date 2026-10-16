import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const scriptDir = path.join(repoRoot, 'packages/pixelated-components/src/scripts');
const templateRoot = path.join(repoRoot, 'apps/pixelated-template');

async function runScaffolder(script, pagesInput) {
	const answers = [
		['Root directory name', 'example-site'],
		['Site URL (', 'https://example.com'],
		['Contact email address', 'contact@example.com'],
		['Proceed? (Y/n)', 'y'],
		['Pages you want', pagesInput],
		['Proceed with these pages?', 'y'],
		['Create an AWS Amplify app', 'n'],
	];
	const proc = spawn(process.execPath, [script], { stdio: 'pipe' });
	let output = '';
	let errors = '';
	let answered = 0;
	proc.stdout.on('data', (chunk) => {
		output += chunk.toString();
		while (answered < answers.length && output.includes(answers[answered][0])) {
			proc.stdin.write(`${answers[answered][1]}\n`);
			answered++;
		}
	});
	proc.stderr.on('data', (chunk) => { errors += chunk.toString(); });
	try {
		return await new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				proc.kill();
				reject(new Error('Scaffolder did not complete its prompts.'));
			}, 15000);
			proc.on('error', (error) => {
				clearTimeout(timeout);
				reject(error);
			});
			proc.on('exit', (code) => {
				clearTimeout(timeout);
				resolve({ code, answered, output, errors });
			});
		});
	} finally {
		console.info(output);
		if (errors) console.error(errors);
	}
}

describe('Projects and Gallery scaffold selection', () => {
	it.each([
		{ selection: 'projects', slugs: ['projects'] },
		{ selection: 'gallery', slugs: ['gallery'] },
		{ selection: 'projects,gallery', slugs: ['projects', 'gallery'] },
		{ selection: 'portfolio,photo-gallery', slugs: ['portfolio', 'photo-gallery'] },
		{ selection: 'portfolio,projects,photo-gallery,gallery', slugs: ['portfolio', 'projects', 'photo-gallery', 'gallery'] },
	])('scaffolds $selection with the correct pages, routes, and fallback files', async ({ selection, slugs }) => {
		const workspace = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'pixelated-pages-')));
		try {
			const scripts = path.join(workspace, 'packages/pixelated-components/src/scripts');
			const template = path.join(workspace, 'apps/pixelated-template');
			const pages = path.join(template, 'src/app/(pages)');
			const configDir = path.join(template, 'src/app/config');
			await fs.mkdir(scripts, { recursive: true });
			await fs.mkdir(configDir, { recursive: true });
			await fs.mkdir(path.join(pages, '(home)'), { recursive: true });
			await fs.writeFile(path.join(workspace, 'package.json'), '{"type":"module"}');
			await fs.symlink(path.join(repoRoot, 'node_modules'), path.join(workspace, 'node_modules'), 'dir');
			for (const file of ['create-pixelated-app.js', 'create-pixelated-app.json']) {
				await fs.copyFile(path.join(scriptDir, file), path.join(scripts, file));
			}
			for (const offering of ['projects', 'gallery']) {
				await fs.cp(path.join(templateRoot, 'src/app/(pages)', offering), path.join(pages, offering), { recursive: true });
			}
			await fs.writeFile(path.join(pages, '(home)/page.tsx'), 'export default function HomePage() { return null; }');
			const originalConfig = JSON.parse(await fs.readFile(path.join(templateRoot, 'src/app/config/pixelated.config.json'), 'utf8'));
			await fs.writeFile(path.join(configDir, 'pixelated.config.json'), JSON.stringify({
				siteInfo: originalConfig.siteInfo,
				integrations: originalConfig.integrations,
				routes: originalConfig.routes.filter((route) => ['/', '/projects', '/gallery'].includes(route.path)),
			}));

			const result = await runScaffolder(path.join(scripts, 'create-pixelated-app.js'), selection);
			expect(result.code).toBe(0);
			expect(result.answered).toBe(7);
			expect(result.errors).toBe('');
			expect(result.output).toContain('Done.');
			const destination = path.join(workspace, 'apps/example-site');
			const createdPages = path.join(destination, 'src/app/(pages)');
			expect((await fs.readdir(createdPages)).sort()).toEqual(['(home)', ...slugs].sort());
			const createdConfig = JSON.parse(await fs.readFile(path.join(destination, 'src/app/config/pixelated.config.json'), 'utf8'));
			expect(createdConfig.routes.map((route) => route.path).sort()).toEqual(['/', ...slugs.map((slug) => `/${slug}`)].sort());
			expect(createdConfig.siteInfo.name).toBe('Example Site');
			expect(createdConfig.integrations.contentful.projectsContentType).toBe('');
			expect(createdConfig.integrations.flickr.urlProps.photoset_id).toBe('');

			for (const slug of slugs) {
				const offering = ['projects', 'portfolio'].includes(slug) ? 'projects' : 'gallery';
				const page = await fs.readFile(path.join(createdPages, slug, 'page.tsx'), 'utf8');
				const samples = JSON.parse(await fs.readFile(path.join(createdPages, slug, `${offering}.json`), 'utf8'));
				expect(samples.length).toBeGreaterThan(0);
				expect(page).toContain(`from './${offering}.json'`);
				expect(page).toContain(offering === 'projects' ? 'getContentfulEntriesByType' : 'FlickrWrapper');
				if (offering === 'projects') expect(page).toMatch(/export default async function/);
				const route = createdConfig.routes.find((item) => item.path === `/${slug}`);
				expect(route.title).toContain('Example Site');
			}
		} finally {
			await fs.rm(workspace, { recursive: true, force: true });
		}
	}, 20000);
});
