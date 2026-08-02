import fs from 'fs/promises';
import fsSync from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { spawnSync } from 'child_process';

function runCommand(command, args, options) {
	const result = spawnSync(command, args, {
		encoding: 'utf8',
		stdio: 'pipe',
		...options,
	});

	return {
		status: result.status,
		stdout: result.stdout?.trim() ?? '',
		stderr: result.stderr?.trim() ?? '',
	};
}

function normalizePathForGit(filePath) {
	return filePath.replace(/\\/g, '/');
}

function normalizeRouteSegments(segments) {
	const normalizedSegments = Array.isArray(segments)
		? segments
			.filter((segment) => typeof segment === 'string' && segment.length > 0)
			.map((segment) => segment.replace(/\\/g, '/').trim())
			.filter(Boolean)
		: [];

	const resultSegments = normalizedSegments.filter((segment) => segment !== 'index');
	if (resultSegments.length === 0) {
		return '/';
	}
	return `/${resultSegments.join('/')}`;
}

function normalizeForDiff(value) {
	if (value === null || value === undefined) return value;
	if (Array.isArray(value)) return value.map(normalizeForDiff);
	if (typeof value === 'object') {
		const keys = Object.keys(value).filter((key) => key !== 'lastModified').sort();
		const normalized = {};
		for (const key of keys) {
			normalized[key] = normalizeForDiff(value[key]);
		}
		return normalized;
	}
	return value;
}

function stableStringify(value) {
	return JSON.stringify(normalizeForDiff(value));
}

// Duplicate implementation of `flattenRoutes` from
// `src/components/foundation/sitemap.ts`.
//
// This helper is duplicated here because `update-sitemap-lastmodified.js`
// is a Node-run JS script and cannot reliably import the TS-only module
// implementation from `sitemap.ts` without a TS-aware loader.
function flattenRoutes(routes) {
	const result = [];
	if (!Array.isArray(routes)) return result;

	for (const route of routes) {
		if (!route || typeof route !== 'object') continue;
		result.push(route);
		if (Array.isArray(route.routes)) {
			result.push(...flattenRoutes(route.routes));
		}
	}
	return result;
}

function getServiceKey(service) {
	return `${service?.name ?? ''}||${service?.slug ?? ''}||${service?.path ?? service?.url ?? ''}`;
}

function getServiceAreaKey(area) {
	return `${area?.name ?? ''}||${area?.path ?? area?.url ?? ''}`;
}

function collectChangedEntities(current = [], previous = [], keyFn) {
	const changed = new Set();
	const previousMap = new Map();
	for (const item of Array.isArray(previous) ? previous : []) {
		previousMap.set(keyFn(item), stableStringify(item));
	}

	for (const item of Array.isArray(current) ? current : []) {
		const key = keyFn(item);
		const prior = previousMap.get(key);
		if (!prior || prior !== stableStringify(item)) {
			changed.add(key);
		}
	}
	return changed;
}

function findEnvLocal(startDir) {
	let current = path.resolve(startDir);
	while (true) {
		const candidate = path.join(current, '.env.local');
		if (fsSync.existsSync(candidate)) return candidate;
		const parent = path.dirname(current);
		if (parent === current) break;
		current = parent;
	}
	return null;
}

function getConfigKey(workspaceRoot) {
	let key = process.env.PIXELATED_CONFIG_KEY;
	if (key) return key;

	const envPath = findEnvLocal(workspaceRoot);
	if (envPath) {
		try {
			const contents = fsSync.readFileSync(envPath, 'utf8');
			const match = contents.match(/^PIXELATED_CONFIG_KEY=(.*)$/m);
			if (match && match[1]) {
				key = match[1].trim();
				return key;
			}
		} catch {
			// ignore
		}
	}
	return null;
}

function isEncryptedConfig(value) {
	if (typeof value !== 'string') return false;
	if (!value.startsWith('pxl:v1:')) return false;
	const data = value.slice('pxl:v1:'.length);
	const parts = data.split(':');
	return parts.length === 3 && /^[0-9a-fA-F]{24}$/.test(parts[0]) && /^[0-9a-fA-F]{32}$/.test(parts[1]) && /^[0-9a-fA-F]+$/.test(parts[2]);
}

function decryptConfigPayload(payload, keyHex) {
	if (!payload) throw new Error('No encrypted payload provided');
	if (!payload.startsWith('pxl:v1:')) throw new Error('Invalid encrypted config format');
	const data = payload.slice('pxl:v1:'.length);
	const [ivHex, authTagHex, encryptedHex] = data.split(':');
	const key = Buffer.from(keyHex, 'hex');
	if (key.length !== 32) throw new Error('Invalid decryption key');
	const iv = Buffer.from(ivHex, 'hex');
	const authTag = Buffer.from(authTagHex, 'hex');
	const encryptedBytes = Buffer.from(encryptedHex, 'hex');
	const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
	decipher.setAuthTag(authTag);
	let decrypted = decipher.update(encryptedBytes, 'hex', 'utf8');
	decrypted += decipher.final('utf8');
	return decrypted;
}

async function decryptEncryptedConfigToTemp(options) {
	const { encryptedSourcePath, encryptedContent, workspaceRoot } = options;
	const key = getConfigKey(workspaceRoot);
	if (!key) return null;

	const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pixelated-lastconfig-'));
	const tempEncPath = path.join(tempDir, 'lastconfig.json.enc');
	const tempJsonPath = path.join(tempDir, 'lastconfig.json');

	try {
		if (encryptedSourcePath) {
			fsSync.copyFileSync(encryptedSourcePath, tempEncPath);
		} else if (encryptedContent) {
			await fs.writeFile(tempEncPath, encryptedContent, 'utf8');
		} else {
			await fs.rm(tempDir, { recursive: true, force: true });
			return null;
		}

		const raw = fsSync.readFileSync(tempEncPath, 'utf8');
		if (!isEncryptedConfig(raw)) {
			await fs.rm(tempDir, { recursive: true, force: true });
			return null;
		}

		const decrypted = decryptConfigPayload(raw, key);
		await fs.writeFile(tempJsonPath, decrypted, 'utf8');
		return { tempDir, tempJsonPath };
	} catch (error) {
		await fs.rm(tempDir, { recursive: true, force: true });
		throw error;
	}
}

async function loadPreviousConfig(configPath, repoRoot, workspaceRoot) {
	const configRelPath = normalizePathForGit(path.relative(repoRoot, configPath));
	const previousResult = runCommand('git', ['show', `HEAD:${configRelPath}`], { cwd: repoRoot });
	if (previousResult.status === 0 && previousResult.stdout) {
		try {
			return JSON.parse(previousResult.stdout);
		} catch {
			// proceed to encrypted fallback
		}
	}

	const encryptedPath = `${configPath}.enc`;
	const encryptedRelPath = `${configRelPath}.enc`;
	let tempData = null;
	let previousConfig = null;

	if (fsSync.existsSync(encryptedPath)) {
		tempData = await decryptEncryptedConfigToTemp({ encryptedSourcePath: encryptedPath, workspaceRoot });
	} else {
		const encryptedResult = runCommand('git', ['show', `HEAD:${encryptedRelPath}`], { cwd: repoRoot });
		if (encryptedResult.status === 0 && encryptedResult.stdout) {
			tempData = await decryptEncryptedConfigToTemp({ encryptedContent: encryptedResult.stdout, workspaceRoot });
		}
	}

	if (tempData) {
		try {
			const content = await fs.readFile(tempData.tempJsonPath, 'utf8');
			previousConfig = JSON.parse(content);
		} finally {
			await fs.rm(tempData.tempDir, { recursive: true, force: true });
		}
	}

	return previousConfig;
}

function patchRoutes(routes, changedPaths, timestamp) {
	let count = 0;
	for (const route of Array.isArray(routes) ? routes : []) {
		if (route && typeof route.path === 'string' && changedPaths.has(route.path)) {
			route.lastModified = timestamp;
			count += 1;
		}
		if (route && Array.isArray(route.routes)) {
			count += patchRoutes(route.routes, changedPaths, timestamp);
		}
	}
	return count;
}

function patchEntities(entities, changedKeys, timestamp, keyFn) {
	let count = 0;
	for (const entity of Array.isArray(entities) ? entities : []) {
		if (!entity) continue;
		const key = keyFn(entity);
		if (changedKeys.has(key)) {
			entity.lastModified = timestamp;
			count += 1;
		}
	}
	return count;
}

export async function patchConfigLastModified(workspaceRoot) {
	const configCandidates = [
		path.join(workspaceRoot, 'src', 'app', 'config', 'pixelated.config.json'),
		path.join(workspaceRoot, 'src', 'config', 'pixelated.config.json'),
		path.join(workspaceRoot, 'pixelated.config.json'),
	];

	const configPaths = [];
	for (const configPath of configCandidates) {
		try {
			await fs.access(configPath);
			configPaths.push(configPath);
		} catch {
			// ignore missing paths
		}
	}

	if (configPaths.length === 0) {
		return { status: 'skipped', label: 'Patch Config lastModified', detail: 'No pixelated.config.json found' };
	}

	const gitRootResult = runCommand('git', ['rev-parse', '--show-toplevel'], { cwd: workspaceRoot });
	if (gitRootResult.status !== 0 || !gitRootResult.stdout) {
		throw new Error('Unable to determine git repository root');
	}
	const repoRoot = path.resolve(gitRootResult.stdout);

	const workspaceRel = normalizePathForGit(path.relative(repoRoot, workspaceRoot));
	const changedGitFiles = new Set();

	const addChangedFiles = (text) => {
		for (const line of text.split(/\r?\n/)) {
			const trimmed = line.trim();
			if (trimmed) {
				changedGitFiles.add(trimmed);
			}
		}
	};

	const diffResult = runCommand('git', ['diff', '--name-only', '--diff-filter=ACMRT', 'HEAD', '--', workspaceRel], { cwd: repoRoot });
	if (diffResult.status === 0) {
		addChangedFiles(diffResult.stdout);
	} else {
		const fallback = runCommand('git', ['diff', '--name-only', '--diff-filter=ACMRT', '--', workspaceRel], { cwd: repoRoot });
		addChangedFiles(fallback.stdout);
	}

	const untracked = runCommand('git', ['ls-files', '--others', '--exclude-standard', '--', workspaceRel], { cwd: repoRoot });
	addChangedFiles(untracked.stdout);

	const changedFiles = Array.from(changedGitFiles).map((file) => normalizePathForGit(file));

	const routePathsFromFiles = new Set();
	for (const changedFile of changedFiles) {
		const absolute = path.resolve(repoRoot, changedFile);
		if (!absolute.startsWith(path.resolve(workspaceRoot))) continue;
		const relative = path.relative(workspaceRoot, absolute).replace(/\\/g, '/');

		let inferred = null;
		const normalized = relative.replace(/\\/g, '/');
		if (normalized.startsWith('src/app/')) {
			const subPath = normalized.replace(/^src\/app\//, '');
			const segments = subPath.split('/').filter(Boolean);
			if (segments.length > 0) {
				const fileName = segments[segments.length - 1];
				const routeFiles = new Set(['page.tsx', 'page.ts', 'page.jsx', 'page.js', 'route.ts', 'route.tsx', 'route.js', 'route.jsx', 'layout.tsx', 'layout.ts', 'template.tsx', 'template.ts']);
				if (routeFiles.has(fileName)) {
					const directorySegments = segments.slice(0, -1).filter((segment) => !segment.startsWith('(') || !segment.endsWith(')'));
					inferred = normalizeRouteSegments(directorySegments);
				}
			}
		} else if (normalized.startsWith('src/pages/')) {
			const subPath = normalized.replace(/^src\/pages\//, '');
			const segments = subPath.split('/').filter(Boolean);
			if (segments.length > 0) {
				const fileName = segments[segments.length - 1];
				const ext = path.extname(fileName).toLowerCase();
				if (['.tsx', '.ts', '.jsx', '.js'].includes(ext)) {
					if (fileName === 'index' + ext) {
						const directorySegments = segments.slice(0, -1);
						inferred = normalizeRouteSegments(directorySegments);
					} else {
						const directorySegments = segments.slice(0, -1).filter((segment) => !segment.startsWith('(') || !segment.endsWith(')'));
						inferred = normalizeRouteSegments([...directorySegments, fileName.slice(0, -ext.length)]);
					}
				}
			}
		}

		if (inferred) {
			routePathsFromFiles.add(inferred);
		}
	}

	let totalRoutePatches = 0;
	let totalServicePatches = 0;
	let totalServiceAreaPatches = 0;
	let totalFilesPatched = 0;
	const timestamp = new Date().toISOString();

	for (const configPath of configPaths) {
		const currentRaw = await fs.readFile(configPath, 'utf8');
		const currentConfig = JSON.parse(currentRaw);

		let previousConfig = null;
		try {
			previousConfig = await loadPreviousConfig(configPath, repoRoot, workspaceRoot);
		} catch {
			previousConfig = null;
		}

		const changedRoutesFromConfig = new Set(routePathsFromFiles);

		const changedServicesFromConfig = previousConfig
			? collectChangedEntities(currentConfig.siteInfo?.services, previousConfig.siteInfo?.services, getServiceKey)
			: new Set((currentConfig.siteInfo?.services || []).map(getServiceKey));
		const changedServiceAreasFromConfig = previousConfig
			? collectChangedEntities(currentConfig.siteInfo?.serviceAreas, previousConfig.siteInfo?.serviceAreas, getServiceAreaKey)
			: new Set((currentConfig.siteInfo?.serviceAreas || []).map(getServiceAreaKey));

		const allChangedRoutes = changedRoutesFromConfig;

		const routePatchCount = patchRoutes(currentConfig.routes, allChangedRoutes, timestamp);
		const servicePatchCount = patchEntities(currentConfig.siteInfo?.services, changedServicesFromConfig, timestamp, getServiceKey);
		const serviceAreaPatchCount = patchEntities(currentConfig.siteInfo?.serviceAreas, changedServiceAreasFromConfig, timestamp, getServiceAreaKey);

		if (routePatchCount || servicePatchCount || serviceAreaPatchCount) {
			totalFilesPatched += 1;
			totalRoutePatches += routePatchCount;
			totalServicePatches += servicePatchCount;
			totalServiceAreaPatches += serviceAreaPatchCount;
			await fs.writeFile(configPath, `${JSON.stringify(currentConfig, null, 1)}\n`, 'utf8');
		}
	}

	const detailParts = [];
	if (totalRoutePatches) detailParts.push(`${totalRoutePatches} route(s)`);
	if (totalServicePatches) detailParts.push(`${totalServicePatches} service(s)`);
	if (totalServiceAreaPatches) detailParts.push(`${totalServiceAreaPatches} serviceArea(s)`);
	if (detailParts.length === 0) {
		return { status: 'success', label: 'Patch Config lastModified', detail: 'No pixelated config entries required updating' };
	}
	return { status: 'success', label: 'Patch Config lastModified', detail: `Updated ${detailParts.join(', ')} in ${totalFilesPatched} file(s)` };
}
