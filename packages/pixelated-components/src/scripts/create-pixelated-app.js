#!/usr/bin/env node
/**
 * create-pixelated-app.js
 *
 * Simple CLI to scaffold a new site from `pixelated-template`.
 * - copies the template to a destination folder
 * - clears out the .git history in the copy
 * - optionally initializes a fresh git repo and makes an initial commit
 *
 * TODOs (placeholders for later work):
 *  - Run `npm ci` / `npm run lint` / `npm test` and optionally build
 * 

2) High-level workflow the script should perform 🔁
Validate inputs (target path, site slug, repo name).
Copy pixelated-template → ./<new-site-name> (preserve file modes).
Replace placeholders in files (template tokens like {{SITE_NAME}}, {{PACKAGE_NAME}}, {{DOMAIN}}).
Patch template-specific files (see list below).
Remove template git metadata (rm -rf .git) and reset any CI state.
Create/patch pixelated.config.json with site-specific values (ask for secrets). Optionally run npm run config:encrypt to write .enc.
Run validation: npm ci (optional), npm run lint, npm test, npm run build.
Init git, make initial commit, optionally create remote GitHub repo (if token available) and push.
Print summary and next steps (e.g., configure hosting / DNS / deploy keys).

3) Files / fields to update in the template 🔧
package.json — name, description, repository, author, homepage, version, scripts (if you want to change default scripts).
README.md — project title and quick-start instructions.
next.config.ts / amplify.yml — site-specific env entries and build steps.
pixelated.config.json — update global/aws/contentful/google fields for this site (prefer *.enc workflow).
src/app/(pages)/… and any site metadata files (site slug, default pagesDir).
public/ assets and site-images.json — update site logos/URLs.
certificates/ if using TLS — template may include placeholder paths.
FEATURE_CHECKLIST.md — optionally update default checklist for new site.
.gitignore — ensure pixelated.config.json is ignored if plaintext during setup.

6) Helpful CLI implementation details (tools & libs) 🛠️
Provide a --dry-run and --preview mode so users can verify changes before creating repo or pushing.

7) Validation & post-creation steps ✅
npm run lint && npm test && npm run build — fail fast and show errors for the new site.
Optional: run npm run config:decrypt locally (with provided key) to confirm decryption works in your deploy workflow (BUT DO NOT store the key in the repo).

*/

import fs from 'fs/promises';
import path from 'path';
import { exec as execCb } from 'child_process';
import { promisify } from 'util';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { fileURLToPath } from 'url';
import { AmplifyClient, CreateAppCommand, CreateBranchCommand, UpdateAppCommand, UpdateBranchCommand } from '@aws-sdk/client-amplify';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let stepNumber = 1;

const exec = promisify(execCb);
// Exportable exec wrapper so tests can stub it.
export let _exec = exec;

async function exists(p) {
	try {
		await fs.access(p);
		return true;
	} catch (e) {
		return false;
	}
}

export async function findPixelatedConfigJsonFile(rootDir) {
	const candidates = [
		path.join(rootDir, 'src', 'app', 'config', 'pixelated.config.json'),
		path.join(rootDir, 'src', 'config', 'pixelated.config.json'),
		path.join(rootDir, 'src', 'pixelated.config.json'),
		path.join(rootDir, 'pixelated.config.json')
	];
	for (const candidate of candidates) {
		if (await exists(candidate)) return candidate;
	}
	return null;
}

// Template manifest utilities
export async function loadManifest(baseDir = path.resolve(__dirname)) {
	const manifestPath = path.resolve(baseDir, 'create-pixelated-app.json');
	try {
		if (await exists(manifestPath)) {
			const txt = await fs.readFile(manifestPath, 'utf8');
			return JSON.parse(txt);
		}
	} catch (e) {
		// ignore parse/read errors
	}
	return null;
}

export function findTemplateForSlug(manifest, slug) {
	if (!manifest || !Array.isArray(manifest.templates)) return null;
	slug = (slug || '').toLowerCase();
	const fuzzyCandidates = [];
	for (const t of manifest.templates) {
		// Skip templates that have action: "ignore" (metadata routes in Admin section)
		if (t.action === 'ignore') continue;
		if (!t.aliases || !Array.isArray(t.aliases)) continue;
		for (let a of t.aliases) {
			a = a.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
			if (a === slug) return t;
		}
		for (let a of t.aliases) {
			a = a.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
			if (slug === a) return t;
			if (slug.startsWith(a + '-')) {
				fuzzyCandidates.push({ template: t, score: a.length + 2 });
			} else if (slug.endsWith('-' + a)) {
				fuzzyCandidates.push({ template: t, score: a.length + 1 });
			} else if (slug.includes('-' + a + '-')) {
				fuzzyCandidates.push({ template: t, score: a.length });
			}
		}
	}
	if (fuzzyCandidates.length === 0) return null;
	fuzzyCandidates.sort((a, b) => b.score - a.score);
	return fuzzyCandidates[0].template;
}

export function printAvailableTemplates(manifest) {
	if (!manifest || !Array.isArray(manifest.templates) || manifest.templates.length === 0) return;
	console.log('\nAvailable templates:');
	for (const t of manifest.templates) {
		// Skip templates in Admin section (marked with action: "ignore")
		if (t.action === 'ignore') continue;
		const aliases = Array.isArray(t.aliases) ? t.aliases.join(', ') : '';
		console.log(` - ${t.name}${aliases ? ': ' + aliases : ''}`);
	}
}

async function countFiles(src) {
	let total = 0;
	async function walk(p) {
		const stat = await fs.lstat(p);
		if (stat.isDirectory()) {
			const items = await fs.readdir(p, { withFileTypes: true });
			for (const item of items) {
				await walk(path.join(p, item.name));
			}
		} else {
			total++;
		}
	}
	await walk(src);
	return total;
}

function startSpinner(messageFn) {
	if (!process.stdout.isTTY) return { stop: () => {} };
	const frames = ['-', '\\', '|', '/'];
	let i = 0;
	const interval = setInterval(() => {
		const msg = messageFn ? messageFn() : '';
		process.stdout.write(`\r${frames[i % frames.length]} ${msg}`);
		i++;
	}, 100);
	return {
		stop: () => {
			clearInterval(interval);
			process.stdout.write('\r');
			process.stdout.write('\n');
		}
	};
}

async function copyRecursive(src, dest, onFileCopied) {
	// Recursive copy that reports per-file progress via onFileCopied.
	await fs.mkdir(dest, { recursive: true });
	const items = await fs.readdir(src, { withFileTypes: true });
	for (const item of items) {
		const s = path.join(src, item.name);
		const d = path.join(dest, item.name);
		const stat = await fs.lstat(s);
		if (stat.isDirectory()) {
			await copyRecursive(s, d, onFileCopied);
		} else if (stat.isSymbolicLink()) {
			try {
				const link = await fs.readlink(s);
				await fs.symlink(link, d);
				if (onFileCopied) onFileCopied(d);
			} catch (e) {
				// ignore symlink failures
				if (onFileCopied) onFileCopied(d);
			}
		} else {
			// Regular file
			await fs.copyFile(s, d);
			if (onFileCopied) onFileCopied(d);
		}
	}
}

// Replace placeholders like {{SITE_NAME}}, {{SITE_URL}}, {{EMAIL_ADDRESS}} across the created site
// This supports both literal tags and simple regex patterns (for cases where the bundler
// transformed template tokens into JS expressions like {SITE_NAME}). Each replacement
// entry may have { tag, value, isRegex } where isRegex indicates `tag` is a regex string.
async function replacePlaceholders(rootDir, replacements) {
	const ignoreDirs = new Set(['.git', 'node_modules', 'dist', 'coverage']);
	let filesChanged = 0;
	async function walk(p) {
		const items = await fs.readdir(p, { withFileTypes: true });
		for (const item of items) {
			const entry = path.join(p, item.name);
			if (item.isDirectory()) {
				// Allow running against .next when explicitly targeting it, but skip when walking a template
				if (item.name === '.next' && rootDir !== '.next') continue;
				if (ignoreDirs.has(item.name)) continue;
				await walk(entry);
			} else {
				try {
					let content = await fs.readFile(entry, 'utf8');
					let newContent = content;
					for (const { tag, value, isRegex } of replacements) {
						let re;
						if (isRegex) {
							re = new RegExp(tag, 'g');
						} else {
							re = new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
						}
						newContent = newContent.replace(re, value);
					}
					if (newContent !== content) {
						await fs.writeFile(entry, newContent, 'utf8');
						filesChanged++;
					}
				} catch (e) {
					// Could be binary or unreadable - skip
				}
			}
		}
	}
	await walk(rootDir);
	return filesChanged;
}

// Token map used by the CLI: literal marker (e.g., "__SITE_NAME__") -> replacement value (populate during interactive prompts)
export const TOKEN_MAP = { 
	"__SITE_NAME__": '', 
	"__SITE_URL__": '', 
	"__EMAIL_ADDRESS__": '' 
};

// Helper: add a route entry to the siteconfig.json structure for a newly created page
export function addRouteEntry(siteConfig, pageSlug, displayName, rootDisplayName) {
	if (!siteConfig || !Array.isArray(siteConfig.routes)) return false;
	const candidatePath = `/${pageSlug}`;
	if (siteConfig.routes.some(r => r.path === candidatePath)) return false;
	const name = displayName.split(/\s+/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
	siteConfig.routes.push({
		"name": name,
		"path": candidatePath,
		"title": `${rootDisplayName} - ${displayName}`,
		"description": "",
		"keywords": ""
	});
	return true;
}

// Copy a template page into the target directory, resolving to the expected location inside the workspace template.
// Returns an object { used: 'template'|'fallback', src: <sourcePath> }
export async function copyTemplateForPage(templatePathArg, templateSrc, templatePagesHome, targetDir) {
	const folderName = path.basename(templateSrc);
	const srcTemplatePath = path.join(templatePathArg, 'src', 'app', '(pages)', folderName);
	if (await exists(srcTemplatePath)) {
		await copyRecursive(srcTemplatePath, targetDir);
		return { used: 'template', src: srcTemplatePath };
	} else {
		await copyRecursive(templatePagesHome, targetDir);
		return { used: 'fallback', src: templatePagesHome };
	}
}


// Create an AWS Amplify app and connect repository branches (best-effort via AWS CLI).
// This uses the local AWS CLI configuration (credentials/profile) and optionally a GitHub
// personal access token to allow Amplify to connect to the repo automatically.
export async function createAmplifyApp(rl, siteName, cloneUrl, sitePath) {
	// Use AWS region from components config if available; skip interactive region prompt
	const componentsCfgPath = path.resolve(__dirname, '..', 'config', 'pixelated.config.json');
	let regionToUse = 'us-east-2';
	let creds = null;
	try {
		if (await exists(componentsCfgPath)) {
			const cfgText = await fs.readFile(componentsCfgPath, 'utf8');
			const cfg = JSON.parse(cfgText);
			if (cfg?.aws?.region) {
				regionToUse = cfg.aws.region;
				console.log(`✅ Using AWS region from components config: ${regionToUse}`);
			}
			if (cfg?.aws?.access_key_id && cfg?.aws?.secret_access_key) {
				creds = { accessKeyId: cfg.aws.access_key_id, secretAccessKey: cfg.aws.secret_access_key };
				console.log('✅ Found AWS credentials in components config; they will be used for Amplify SDK operations.');
			}
		}
	} catch (e) {
		// ignore and continue without config values
	}

	// Prompt only for GitHub PAT (do not prompt for region)
	const githubToken = (await rl.question('GitHub personal access token (PAT) to connect repo [leave blank to skip]: ')) || '';

	console.log('Creating Amplify app (this may take a few seconds)...');
	// Use AWS SDK Amplify client
	const client = new AmplifyClient({ region: regionToUse, credentials: creds || undefined });
	let createResp;
	try {
		createResp = await client.send(new CreateAppCommand({ name: siteName, platform: 'WEB_DYNAMIC', repository: cloneUrl || undefined, accessToken: githubToken || undefined }));
	} catch (e) {
		throw new Error('Failed to create Amplify app via SDK: ' + (e?.message || e), { cause: e });
	}

	const appId = createResp?.app?.appId || createResp?.appId || createResp?.id;
	if (!appId) {
		console.log('Amplify create app response:', createResp);
		throw new Error('Unable to determine Amplify appId from SDK response');
	}
	console.log(`✅ Created Amplify app: ${appId}`);
	console.log(`🔗 Open in console: https://${regionToUse}.console.aws.amazon.com/amplify/home?region=${regionToUse}#/d/${appId}`);

	// Optionally: read site config (if sitePath provided) and set environment variables for the app & branches
	let envVars = {};
	if (sitePath) {
		// Primary: look for a local .env.local and prefer variables defined there
		const envLocalPath = path.join(sitePath, '.env.local');
		if (await exists(envLocalPath)) {
			try {
				const envText = await fs.readFile(envLocalPath, 'utf8');
				for (const line of envText.split(/\r?\n/)) {
					const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
					if (!m) continue;
					const k = m[1];
					let v = m[2] || '';
					// remove optional quotes
					v = v.replace(/^"|"$/g, '');
					if (k === 'PIXELATED_CONFIG_KEY' || k.startsWith('PIXELATED_CONFIG')) {
						envVars[k] = v;
					}
				}
				console.log(`✅ Loaded environment values from ${envLocalPath} and will set matching Amplify environment variables.`);
			} catch (e) {
				console.warn('⚠️ Failed to read .env.local for env var population:', e?.message || e);
			}
		}

		// Secondary: if no PIXELATED_CONFIG_* vars were found in .env.local, look for pixelated.config.json
		if (!envVars.PIXELATED_CONFIG_JSON && !envVars.PIXELATED_CONFIG_B64) {
			const candidates = [
				path.join(sitePath, 'src', 'app', 'config', 'pixelated.config.json'),
				path.join(sitePath, 'src', 'config', 'pixelated.config.json'),
				path.join(sitePath, 'src', 'pixelated.config.json'),
				path.join(sitePath, 'pixelated.config.json')
			];
			for (const c of candidates) {
				if (await exists(c)) {
					try {
						const raw = await fs.readFile(c, 'utf8');
						envVars.PIXELATED_CONFIG_JSON = raw;
						envVars.PIXELATED_CONFIG_B64 = Buffer.from(raw, 'utf8').toString('base64');
						console.log(`✅ Loaded site pixelated.config.json from ${c} and will set PIXELATED_CONFIG_* environment variables in Amplify.`);
						break;
					} catch (e) {
						console.warn('⚠️ Failed to read site config for env var population:', e?.message || e);
					}
				}
			}
		}
	}

	// Attempt to resolve the ARN for the 'amplify-role' role (best-effort)
	let iamRoleArn = null;
	try {
		const { IAMClient, GetRoleCommand } = await import('@aws-sdk/client-iam');
		const iam = new IAMClient({ region: regionToUse, credentials: creds || undefined });
		try {
			const roleResp = await iam.send(new GetRoleCommand({ RoleName: 'amplify-role' }));
			iamRoleArn = roleResp?.Role?.Arn;
			if (iamRoleArn) console.log(`✅ Found amplify-role ARN: ${iamRoleArn}`);
		} catch (e) {
			// ignore; role may not exist or insufficient perms
			console.warn('⚠️ Could not resolve amplify-role ARN; skipping automatic service-role assignment.');
		}
	} catch (e) {
		// ignore if IAM client not available
	}

	// If we have envVars or iamRoleArn, update the app and branches accordingly
	if (Object.keys(envVars).length || iamRoleArn) {
		try {
			const updateParams = {};
			if (Object.keys(envVars).length) updateParams.environmentVariables = envVars;
			if (iamRoleArn) updateParams.iamServiceRoleArn = iamRoleArn;
			await client.send(new UpdateAppCommand({ appId, ...updateParams }));
			console.log('✅ Amplify app updated with environment variables and IAM service role (if available).');

			for (const branch of ['dev','main']) {
				try {
					await client.send(new UpdateBranchCommand({ appId, branchName: branch, environmentVariables: envVars }));
					console.log(`✅ Updated branch '${branch}' with environment variables.`);
				} catch (e) {
					console.warn(`⚠️ Failed to update branch ${branch} env vars:`, e?.message || e);
				}
			}
		} catch (e) {
			console.warn('⚠️ Failed to update Amplify app/branches with env vars or service role:', e?.message || e);
		}
	}

	console.log('ℹ️  Amplify app creation attempt finished. Verify the app in the AWS Console to ensure webhooks and branch connections are correct.');
}

async function main() {
	const rl = readline.createInterface({ input, output });
	try {
		console.log('\n📦 Pixelated site creator — scaffold a new site from pixelated-template\n');
		console.log('================================================================================\n');


		// Prompt for basic site info
		console.log(`\nStep ${stepNumber++}: Site Information`);
		console.log('================================================================================\n');
		const defaultName = 'my-site';
		const siteName = (await rl.question(`Root directory name (kebab-case) [${defaultName}]: `)) || defaultName;
		// Display name used in route titles: convert kebab to Title Case
		const rootDisplayName = siteName.split(/[-_]+/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');


		// Additional site metadata for placeholder substitution
		console.log(`\nStep ${stepNumber++}: Site Metadata`);
		console.log('================================================================================\n');
		const siteUrl = (await rl.question('Site URL (e.g. https://example.com) [leave blank to skip]: ')).trim();
		const emailAddress = (await rl.question('Contact email address [leave blank to skip]: ')).trim();


		// Create a copy of pixelated-template inside the current workspace
		console.log(`\nStep ${stepNumber++}: Template Copy`);
		console.log('================================================================================\n');
		const workspaceRoot = path.resolve(__dirname, '..', '..', '..', '..');
		const templatePath = path.resolve(workspaceRoot, 'apps', 'pixelated-template');
		if (!(await exists(templatePath))) {
			console.error(`\n❌ Template not found at ${templatePath}. Please ensure this tool is run inside the monorepo that contains apps/pixelated-template.`);
			process.exit(1);
		}

		// Load manifest (if present)
		const manifest = await loadManifest(__dirname);
		// Note: available templates will be printed later just before prompting for pages
		
		// Destination is implicitly the apps folder + site name
		const destPath = path.resolve(workspaceRoot, 'apps', siteName);
		console.log(`\nThe new site will be created at: ${destPath}`);
		const proceed = (await rl.question('Proceed? (Y/n): ')) || 'y';
		if (proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
			console.log('Aborting.');
			process.exit(0);
		} 

		if (await exists(destPath)) {
			const shouldOverwrite = (await rl.question(`Destination ${destPath} already exists. Overwrite? (y/N): `)).toLowerCase();
			if (shouldOverwrite !== 'y' && shouldOverwrite !== 'yes') {
				console.log('Aborting. Choose another destination.');
				process.exit(0);
			}
			console.log(`Removing existing directory ${destPath}...`);
			await fs.rm(destPath, { recursive: true, force: true });
		}

		console.log(`\nCopying template from ${templatePath} -> ${destPath} ...`);
		const totalFiles = await countFiles(templatePath);
		let filesCopied = 0;
		let lastFile = '';
		const spinner = startSpinner(() => `Copying... ${filesCopied}/${totalFiles} ${lastFile ? '- ' + path.basename(lastFile) : ''}`);
		await copyRecursive(templatePath, destPath, (f) => { if (f) { filesCopied++; lastFile = f; } });
		// If fs.cp was used, per-file callbacks won't have been called; ensure we report the full total
		if (filesCopied < totalFiles) filesCopied = totalFiles;
		spinner.stop();
		console.log(`✅ Template files copied (${filesCopied} files).`);

		// Remove git history
		const gitDir = path.join(destPath, '.git');
		if (await exists(gitDir)) {
			console.log('Removing .git directory from new site...');
			await fs.rm(gitDir, { recursive: true, force: true });
		}


		// Pages selection: ask which pages user wants (from template or custom new pages)
		console.log(`\nStep ${stepNumber++}: Page Selection`);
		console.log('================================================================================\n');
		if (manifest && Array.isArray(manifest.templates) && manifest.templates.length) {
			printAvailableTemplates(manifest);
		}
		const pagesInput = (await rl.question('Pages you want (comma-separated, e.g. about,contact,custom-legal) [leave blank to skip]: ')).trim();
		let wantedPages = [];
		if (pagesInput) {
			const raw = pagesInput.split(',').map(s => s.trim()).filter(Boolean);
			const seen = new Set();
			
			// Normalize each input
			for (const userInput of raw) {
				const slug = userInput.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
				if (!slug || seen.has(slug)) continue;
				seen.add(slug);
				
				// Check if it's a template page
				const matchedTemplate = findTemplateForSlug(manifest, slug);
				const isTemplate = !!matchedTemplate;
				
				wantedPages.push({
					slug,
					displayName: userInput.trim(),
					isTemplate,
					matchedTemplate
				});
			}

			if (wantedPages.length) {
				console.log('\nSummary of pages:');
				const templatePages = wantedPages.filter(p => p.isTemplate);
				const customPages = wantedPages.filter(p => !p.isTemplate);
				
				if (templatePages.length) {
					console.log(' - Template pages:');
					for (const p of templatePages) {
						console.log(`   - ${p.slug} (from template: ${p.matchedTemplate.name})`);
					}
				}
				if (customPages.length) {
					console.log(' - Custom pages (new):');
					for (const p of customPages) {
						console.log(`   - ${p.slug}`);
					}
				}
			}

			const proceedPages = (await rl.question('Proceed with these pages? (Y/n): ')) || 'y';
			if (proceedPages.toLowerCase() === 'y' || proceedPages.toLowerCase() === 'yes') {
					const pixelatedConfigFile = await findPixelatedConfigJsonFile(destPath);
					if (!pixelatedConfigFile) {
						console.error('❌ Failed to locate pixelated.config.json in the new site. Expected one of src/app/config/, src/config/, src/, or root.');
						process.exit(1);
					}
					let pixelatedConfig = null;
					
					try {
						pixelatedConfig = JSON.parse(await fs.readFile(pixelatedConfigFile, 'utf8'));
						pixelatedConfig.siteInfo = pixelatedConfig.siteInfo || {};
						pixelatedConfig.siteInfo.name = rootDisplayName;
						pixelatedConfig.siteInfo.termsOfService = pixelatedConfig.siteInfo.termsOfService || '/terms';
						if (!Array.isArray(pixelatedConfig.routes)) {
							throw new Error('pixelated.config.json must include a routes array');
						}
					} catch (e) {
						console.error('❌ Failed to read pixelated.config.json:', e?.message || e);
					process.exit(1);
				}
				const pagesDir = path.join(destPath, 'src', 'app', '(pages)');
				const wantedSlugs = new Set(wantedPages.map(p => p.slug));

				// Process wanted pages: rename templates or create custom pages
				for (const p of wantedPages) {
					if (p.isTemplate) {
						// Get the actual template folder name (e.g., "about")
						const templateFolderName = path.basename(p.matchedTemplate.src);
						const oldPath = path.join(pagesDir, templateFolderName);
						const newPath = path.join(pagesDir, p.slug);
						
						// Rename if user requested a different name
						if (templateFolderName !== p.slug) {
							try {
								await fs.rename(oldPath, newPath);
								console.log(`Renamed ${templateFolderName} → ${p.slug}`);
								
								// Update component name in page.tsx
								const pageFile = path.join(newPath, 'page.tsx');
								let content = await fs.readFile(pageFile, 'utf8');
								const compName = p.displayName.replace(/[^a-zA-Z0-9]+/g, ' ').split(/\s+/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('') + 'Page';
								content = content.replace(/export default function\s+\w+\s*\(/, `export default function ${compName}(`);
								await fs.writeFile(pageFile, content, 'utf8');
								console.log(` - Updated component name to ${compName}`);
								
								// Update route path in pixelated.config.json
								const route = pixelatedConfig.routes.find(r => r.path === `/${templateFolderName}`);
								if (route) {
									route.path = `/${p.slug}`;
									route.name = p.displayName.split(/\s+/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
									console.log(` - Updated route path to /${p.slug}`);
								}
							} catch (e) {
								console.error(`❌ Failed to rename ${templateFolderName} to ${p.slug}:`, e?.message || e);
								process.exit(1);
							}
						}
					} else {
						// Create custom page from default template
						try {
							const targetDir = path.join(pagesDir, p.slug);
							await copyRecursive(templatePagesHome, targetDir);
							console.log(`Created custom page ${p.slug}`);
							
							// Update component name in page.tsx
							const pageFile = path.join(targetDir, 'page.tsx');
							let content = await fs.readFile(pageFile, 'utf8');
							const compName = p.displayName.replace(/[^a-zA-Z0-9]+/g, ' ').split(/\s+/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('') + 'Page';
							content = content.replace(/export default function\s+\w+\s*\(/, `export default function ${compName}(`);
							await fs.writeFile(pageFile, content, 'utf8');
							console.log(` - Updated component name to ${compName}`);
							
							// Add route entry
							const newRoute = {
								"name": p.displayName.split(/\s+/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
								"path": `/${p.slug}`,
								"title": `${rootDisplayName} - ${p.displayName}`,
								"description": "",
								"keywords": ""
							};
							pixelatedConfig.routes.push(newRoute);
							console.log(` - Added route /${p.slug}`);
						} catch (e) {
							console.error(`❌ Failed to create custom page ${p.slug}:`, e?.message || e);
							process.exit(1);
						}
					}
				}

				// Delete unwanted template pages
				// The Admin section (an object with nested routes for metadata pages) is in siteConfig.routes
				// but doesn't have folders in the (pages) directory, so it's never encountered by fs.readdir().
				// We can safely delete page folders without worrying about removing the Admin section.
				try {
					const existingFolders = await fs.readdir(pagesDir);
					const foldersToDelete = [];
					
					for (const folderName of existingFolders) {
						if (!wantedSlugs.has(folderName)) {
							const folderTemplate = findTemplateForSlug(manifest, folderName);
							if (folderTemplate) {
								foldersToDelete.push(folderName);
							}
						}
					}
					
					// Delete unwanted folders and their routes
					for (const folderName of foldersToDelete) {
						try {
							const folderPath = path.join(pagesDir, folderName);
							await fs.rm(folderPath, { recursive: true });
							console.log(`Deleted template page ${folderName}`);
							
							// Remove the corresponding route from pixelated.config.json
							pixelatedConfig.routes = pixelatedConfig.routes.filter(r => r.path !== `/${folderName}`);
						} catch (e) {
							console.warn(`⚠️  Failed to delete ${folderName}:`, e?.message || e);
						}
					}
				} catch (e) {
					// readdir might fail if pages dir doesn't exist, but that's OK
					console.warn(`⚠️  Could not read pages directory for cleanup:`, e?.message || e);
				}

				// Write final pixelated.config.json
				try {
					await fs.writeFile(pixelatedConfigFile, JSON.stringify(pixelatedConfig, null, '\t'), 'utf8');
					console.log('✅ pixelated.config.json updated.');
				} catch (e) {
					console.error('❌ Failed to write pixelated.config.json:', e?.message || e);
					process.exit(1);
				}
			} else {
				console.log('Skipping page selection.');
			}
		}


		// Automatically replace double-underscore template placeholders (e.g., __SITE_NAME__) with provided values
		console.log(`\nStep ${stepNumber++}: Placeholder Tokens Replacement`);
		console.log('================================================================================\n');
		const replacements = {};
		if (rootDisplayName) replacements.SITE_NAME = rootDisplayName;
		if (siteUrl) replacements.SITE_URL = siteUrl;
		if (emailAddress) replacements.EMAIL_ADDRESS = emailAddress;
		if (Object.keys(replacements).length) {
			const replArray = [];
			for (const [t, valRaw] of Object.entries(replacements)) {
				const val = String(valRaw);
				// populate TOKEN_MAP so other code can inspect token->value mapping (keyed by literal marker)
				const marker = `__${t}__`;
				TOKEN_MAP[marker] = val;
				// First, replace expression occurrences like {__TOKEN__} with a quoted string expression to avoid bare identifiers
				replArray.push({ tag: `\\{${marker}\\}`, value: `{${JSON.stringify(val)}}`, isRegex: true });
				// Then, replace literal marker occurrences (e.g., __TOKEN__) with the plain value
				replArray.push({ tag: marker, value: val });
			}
			try {
				const changed = await replacePlaceholders(destPath, replArray);
				console.log(`✅ Replaced template placeholders in ${changed} files under ${destPath}`);
			} catch (e) {
				console.warn('⚠️ Failed to replace placeholders in site copy:', e?.message || e);
			}
		}



		// Repository creation has been removed from this CLI. 



		let remoteInfo = null;
		// Optionally create an AWS Amplify app and connect branches (main, dev)
		console.log(`\nStep ${stepNumber++}: AWS Amplify App Creation`);
		console.log('================================================================================\n');	// Inform user what region will be used (config-backed)
		try {
			const cfgPath = path.resolve(__dirname, '..', 'config', 'pixelated.config.json');
			if (await exists(cfgPath)) {
				const cfgText = await fs.readFile(cfgPath, 'utf8');
				const cfg = JSON.parse(cfgText);
				if (cfg?.aws?.region) {
					console.log(`ℹ️  Note: Amplify will use AWS region from config: ${cfg.aws.region}`);
				}
			}
		} catch (e) {
		// ignore errors reading config; nothing to do
		}		const createAmplifyAnswer = (await rl.question(`Create an AWS Amplify app for this repository and connect 'main' and 'dev' branches? (y/N): `)) || 'n';
		if (createAmplifyAnswer.toLowerCase() === 'y' || createAmplifyAnswer.toLowerCase() === 'yes') {
			try {
				await createAmplifyApp(rl, siteName, remoteInfo?.cloneUrl);
			} catch (e) {
				console.warn('⚠️  Amplify app creation failed or was incomplete. You can create an app manually via the AWS Console or AWS CLI.');
				console.warn(e?.stderr || e?.message || e);
			}
		}

		console.log('================================================================================\n');
		console.log('🎉 Done.');
		console.log('================================================================================\n');
		console.log('Summary:');
		console.log(` - Site copied to: ${destPath}`);
		console.log('\nNote: A git remote was not set by this script. You can add one later with `git remote add <repo-name> <url>` (use the repository name as the remote) if desired.');
		console.log('\nNext recommended steps (manual or to be automated in future):');
		console.log(' - Update pixelated.config.json for this site and encrypt it with your config tool');
		console.log(' - Run `npm run lint`, `npm test`, and `npm run build` inside the new site and fix any issues');
		console.log(' - Create GitHub repo (if not already created), push main branch, and set up CI/deploy secrets');
	} catch (err) {
		console.error('Unexpected error:', err);
		process.exit(1);
	} finally {
		rl.close();
	}
}

if (typeof process !== 'undefined' && new URL(import.meta.url).pathname === process.argv[1]) {
	// CLI entry point: run the interactive main flow
	main();
}

