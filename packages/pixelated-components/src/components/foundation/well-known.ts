import PropTypes, { InferProps } from 'prop-types';
import { readFile } from 'fs/promises';
import crypto from 'crypto';
import path from 'path';
import { createRequire } from 'module';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { flattenRoutes } from './sitemap';
import { sanitizeString } from './utilities';
import { pixelatedComponentsVersion as selfExportedPixelatedComponentsVersion } from '../../version';

/**
 * Read JSON from disk safely — returns null on error. Exported for testing.
 */
export async function safeJSON(path: string) {
	try {
		const raw = await readFile(path, 'utf8');
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

/**
 * Build a plain-text response payload including ETag and standard headers.
 * Exported for testing and reuse across .well-known generators.
 */
export function createTextResponsePayload(body: string) {
	const etag = crypto.createHash('sha1').update(body).digest('hex');
	const headers = {
		'Content-Type': 'text/plain; charset=utf-8',
		'Cache-Control': 'public, max-age=60, stale-while-revalidate=3600',
		ETag: etag,
	} as Record<string, string>;
	return { body, etag, headers };
}

/* ========== HUMANS.TXT ========== */

generateHumansTxt.propTypes = {
	/** base directory to read package.json / siteconfig.json from (defaults to process.cwd()) */
	cwd: PropTypes.string,
	/** optional package.json object (if provided, fs is not used) */
	pkg: PropTypes.object,
	/** optional siteconfig.json object (if provided, fs is not used) */
	siteConfig: PropTypes.object,
	/** limit how many routes to include (default 50) */
	maxRoutes: PropTypes.number,
};
export type GenerateHumansTxtType = InferProps<typeof generateHumansTxt.propTypes>;
function usesPixelatedComponents(pkg: any) {
	return !!(
		pkg.dependencies?.['@pixelated-tech/components'] ||
		pkg.devDependencies?.['@pixelated-tech/components'] ||
		pkg.peerDependencies?.['@pixelated-tech/components'] ||
		pkg.optionalDependencies?.['@pixelated-tech/components']
	);
}

const requireFromThisFile = createRequire(import.meta.url);

function createRequireFromCwd(cwd: string) {
	try {
		return createRequire(path.join(cwd, 'package.json'));
	} catch {
		return null;
	}
}

function getPackageJsonDependencyVersion(pkg: any) {
	return (
		pkg.dependencies?.['@pixelated-tech/components'] ||
		pkg.devDependencies?.['@pixelated-tech/components'] ||
		pkg.peerDependencies?.['@pixelated-tech/components'] ||
		pkg.optionalDependencies?.['@pixelated-tech/components'] ||
		null
	);
}

async function getVersionFromLockfileCandidates(cwd: string, filename: string) {
	const candidates = [
		path.join(cwd, filename),
		path.join(cwd, '..', filename),
		path.join(cwd, '..', '..', filename),
	];
	for (const candidate of candidates) {
		const lock = await safeJSON(candidate);
		if (!lock) continue;
		const dependency = lock.dependencies?.['@pixelated-tech/components'];
		if (dependency?.version) return dependency.version;
		const packageEntry = lock.packages?.['node_modules/@pixelated-tech/components'];
		if (packageEntry?.version) return packageEntry.version;
	}
	return null;
}

/* 
async function getVersionFromPackageLock(cwd: string) {
	return getVersionFromLockfileCandidates(cwd, 'package-lock.json');
}

async function getVersionFromNpmShrinkwrap(cwd: string) {
	return getVersionFromLockfileCandidates(cwd, 'npm-shrinkwrap.json');
}

async function getVersionFromRootPackageJsonDependency(cwd: string) {
	const candidates = [
		path.join(cwd, '..', 'package.json'),
		path.join(cwd, '..', '..', 'package.json'),
	];
	for (const candidate of candidates) {
		const pkg = await safeJSON(candidate);
		if (!pkg) continue;
		const dependencyVersion = getPackageJsonDependencyVersion(pkg);
		if (dependencyVersion) return dependencyVersion;
	}
	return null;
}

async function getVersionFromYarnLock(lockPath: string) {
	try {
		const content = await readFile(lockPath, 'utf8');
		const match = content.match(/^['"]?@pixelated-tech\/components[^:\n]*['"]?:[\s\S]*?^\s*version\s+"([^"]+)"/m);
		return match?.[1] ?? null;
	} catch {
		return null;
	}
}

async function getVersionFromPnpmLock(lockPath: string) {
	try {
		const content = await readFile(lockPath, 'utf8');
		const match = content.match(/^["']?@pixelated-tech\/components(?:@[^:]+)?["']?:\s*\n\s*version:\s*['"]?([0-9]+\.[0-9]+\.[0-9]+)['"]?/m);
		return match?.[1] ?? null;
	} catch {
		return null;
	}
}

async function getVersionFromNodeModulesPackageJson(cwd: string) {
	const candidates = [
		path.join(cwd, 'node_modules', '@pixelated-tech', 'components', 'package.json'),
		path.join(cwd, '..', 'node_modules', '@pixelated-tech', 'components', 'package.json'),
		path.join(cwd, '..', '..', 'node_modules', '@pixelated-tech', 'components', 'package.json'),
	];
	for (const candidate of candidates) {
		const pkg = await safeJSON(candidate);
		if (pkg && typeof pkg.version === 'string' && pkg.version.trim()) {
			return pkg.version.trim();
		}
	}
	return null;
}

async function getPixelatedComponentsPackageVersionFromResolver(cwd: string) {
	const req = createRequireFromCwd(cwd);
	if (!req) return null;
	try {
		const pkgPath = req.resolve('@pixelated-tech/components/package.json');
		const pkg = await safeJSON(pkgPath);
		if (pkg && typeof pkg.version === 'string' && pkg.version.trim()) {
			return pkg.version.trim();
		}
	} catch {
		return null;
	}
	return null;
}

export type PixelatedComponentsPackageVersionInfo = {
	selfExportedVersion: string | null;
	resolverVersion: string | null;
	nodeModulesPackageJsonVersion: string | null;
	packageLockVersion: string | null;
	npmShrinkwrapVersion: string | null;
	pnpmLockVersion: string | null;
	yarnLockVersion: string | null;
	packageJsonDependencyVersion: string | null;
	rootPackageJsonDependencyVersion: string | null;
	resolvedVersion: string | null;
};
*/

export async function getPixelatedComponentsPackageVersionInfo(cwd: string) {
	const selfExportedVersion = selfExportedPixelatedComponentsVersion || null;
	return {
		selfExportedVersion,
		/* resolverVersion: null,
		nodeModulesPackageJsonVersion: null,
		packageLockVersion: null,
		npmShrinkwrapVersion: null,
		pnpmLockVersion: null,
		yarnLockVersion: null,
		packageJsonDependencyVersion: null,
		rootPackageJsonDependencyVersion: null, */
		resolvedVersion: selfExportedVersion,
	};
}

export async function getPixelatedComponentsPackageVersion(cwd: string) {
	const info = await getPixelatedComponentsPackageVersionInfo(cwd);
	return info.resolvedVersion;
}

export async function generateHumansTxt(opts: GenerateHumansTxtType = {}) {
	const cwd = opts.cwd ?? process.cwd();
	const pkg = opts.pkg ?? (await safeJSON(cwd + '/package.json')) ?? {};
	// THIS DOES NOT WORK IN PROD, USE PASSED SITECONFIG INSTEAD
	const data = opts.siteConfig ?? (await safeJSON(cwd + '/src/app/data/siteconfig.json')) ?? {};
	const site = data.siteInfo ?? {};
	const routes = Array.isArray(data.routes) ? data.routes : [];
	const pixelatedComponentsPackageVersion = selfExportedPixelatedComponentsVersion || 'N/A';

	const lines: string[] = [
		'/* HUMAN-READABLE SITE INFORMATION - generated at runtime */',
		'',
		'/* AUTHOR */',
		`   Author Name: ${sanitizeString(site.author ?? '')}`,
		`   Author Address: ${sanitizeString(
			site.address
				? [
					site.address.streetAddress,
					site.address.addressLocality,
					site.address.addressRegion,
					site.address.postalCode,
					site.address.addressCountry,
				]
					.filter(Boolean)
					.join(' ')
				: ''
		)}`,
		`   Author Email: ${sanitizeString(site.email ?? '')}`,
		`   Author Telephone: ${sanitizeString(site.telephone ?? '')}`,

		'',
		'/* DEVELOPER */',
		`   Developer Name: Brian Whaley`,
		`   Developer Company: Pixelated Technologies LLC`,
		`   Developer Address: 10 Jade Circle, Denville NJ 07834 USA`,
		`   Developer Email: brian@pixelated.tech`,
		`   Developer Website: https://www.pixelated.tech`,
		`   Developer Telephone: (973) 710-8008`,
		'',
		'/* SITE */',
		`   Site Name: ${sanitizeString(site.name ?? '')}`,
		`   Site Package Name: ${sanitizeString(pkg.name ?? '')}`,
		`   Site Package Version: ${sanitizeString(pkg.version ?? '')}`,
		`   Site Pixelated Components Package Version: ${sanitizeString(pixelatedComponentsPackageVersion)}`,
		`   Site URL: ${sanitizeString(site.url ?? '')}`,
		`   Site Languages: React, Node, NextJS, JavaScript, HTML5, CSS3, SASS `,
		`   Site Tools: VSCode, GitHub, AWS, Contently, Cloudinary, Wordpress, Google Analytics, Google Search Console`,
		`   Site Pages: (${routes.length})`,
	];

	const limit = typeof opts.maxRoutes === 'number' ? opts.maxRoutes : 50;
	for (const r of flattenRoutes(routes).slice(0, limit)) {
		lines.push(`      - ${sanitizeString(r.path ?? r.pathname ?? r.url ?? '')} - ${sanitizeString(r.title ?? '')}`);
	}

	const body = lines.join('\n');
	return createTextResponsePayload(body);
}



/* ========== SECURITY.TXT ========== */

generateSecurityTxt.propTypes = {
	siteConfig: PropTypes.object,
};
export type GenerateSecurityTxtType = InferProps<typeof generateSecurityTxt.propTypes>;
export async function generateSecurityTxt(props: GenerateSecurityTxtType = {}) {
	const data = props.siteConfig ?? (await safeJSON(process.cwd() + '/src/app/data/siteconfig.json')) ?? {};
	const siteInfo = data.siteInfo ?? {};

	const lines: string[] = [
		'# Contact methods for security researchers',
		`Contact: mailto:${sanitizeString(siteInfo.email ?? '')}`,
		'',
		"# Link to your vulnerability disclosure policy",
		'Policy: ',
		'',
		"# Link to your PGP public key for encrypted communication",
		'Encryption: ',
		'',
		"# Languages supported",
		'Preferred-Languages: en',
		'',
		"# Date and time the file should be considered stale",
		`Expires: ${new Date(new Date().getFullYear(), 11, 31).toISOString()}`,
	];
	const body = lines.join('\n');
	return createTextResponsePayload(body);
}



/* ========== Convenience helper ========== */
/**
 * Create a response for a well-known resource.
 * @param {'humans'|'security'} type - Which resource to generate ('humans' | 'security').
 */
export async function createWellKnownResponse(type: 'humans' | 'security', req?: NextRequest, opts: any = {}) {
	const payload = (type === 'humans') ? await generateHumansTxt(opts) : await generateSecurityTxt(opts);
	const { body, etag, headers } = payload;
	if (req?.headers?.get && req.headers.get('if-none-match') === etag) {
		return new NextResponse(null, { status: 304, headers });
	}
	return new NextResponse(body, { status: 200, headers });
}
