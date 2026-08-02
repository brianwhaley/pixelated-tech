import fs from 'fs';
import path from 'path';

export const noStaleOverrideRule = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Detect overrides that are now unnecessary because the target library already requires an equal-or-higher version.',
			category: 'Security',
			recommended: true,
		},
		fixable: false,
		messages: {
			staleOverride: 'Override for "{{library}}" -> "{{dep}}" is stale: library declares "{{libConstraint}}" which satisfies or exceeds override "{{override}}". Remove the override.',
			missingTarget: 'Override for "{{target}}" is stale: target package is not present anywhere in the lockfile. Remove the override.',
		},
		schema: [],
	},
	create(context) {
		let ran = false;

		function cmpParts(a, b) {
			const A = (a || '').split('.').map(n => parseInt(n, 10) || 0);
			const B = (b || '').split('.').map(n => parseInt(n, 10) || 0);
			for (let i = 0; i < 3; i++) {
				if ((A[i] || 0) < (B[i] || 0)) return -1;
				if ((A[i] || 0) > (B[i] || 0)) return 1;
			}
			return 0;
		}

		function normalizeVersion(v) {
			if (!v || typeof v !== 'string') return '';
			return v.trim().replace(/^[^0-9]*/, '').replace(/\s+.*$/, '');
		}

		function parseBaseVersion(range) {
			if (!range || typeof range !== 'string') return '';
			const s = range.trim();
			if (/^[\^~<>=>=]/.test(s)) {
				return normalizeVersion(s.replace(/^[^0-9]*/, ''));
			}
			return normalizeVersion(s);
		}

		function collectVersions(lock, pkgName) {
			const versions = [];
			try {
				if (lock && lock.packages && typeof lock.packages === 'object') {
					for (const [pkgPath, pkgObj] of Object.entries(lock.packages)) {
						if (!pkgObj || !pkgObj.version) continue;
						if (!pkgPath || pkgPath === '') continue;
						if (!pkgPath.startsWith('node_modules/')) continue;
						const segments = pkgPath.split('node_modules/').slice(1);
						for (const seg of segments) {
							let candidate;
							if (seg.startsWith('@')) {
								const p = seg.split('/');
								candidate = p.slice(0, 2).join('/');
							} else {
								candidate = seg.split('/')[0];
							}
							if (candidate === pkgName) {
								versions.push(pkgObj.version);
								break;
							}
						}
					}
				}

				function walk(deps) {
					if (!deps) return;
					for (const [k, v] of Object.entries(deps)) {
						if (k === pkgName) {
							if (v && typeof v === 'string') versions.push(v);
							else if (v && v.version) versions.push(v.version);
						}
						if (v && v.dependencies) walk(v.dependencies);
					}
				}
				if (lock && lock.dependencies) walk(lock.dependencies);
			} catch {
				// defensive
			}
			return versions;
		}

		function findLibraryEntry(lock, library) {
			try {
				if (!lock || !lock.packages) return null;
				for (const [pkgPath, pkgObj] of Object.entries(lock.packages)) {
					if (!pkgPath || !pkgPath.startsWith('node_modules/')) continue;
					const after = pkgPath.split('node_modules/').pop();
					let candidate;
					if (after.startsWith('@')) {
						const p = after.split('/');
						candidate = p.slice(0, 2).join('/');
					} else {
						candidate = after.split('/')[0];
					}
					if (candidate === library) return pkgObj;
				}
			} catch {
				// defensive
			}
			return null;
		}

		return {
			Program(node) {
				if (ran) return; ran = true;
				const projectRoot = process.cwd();
				const lockPath = path.join(projectRoot, 'package-lock.json');
				const pkgPath = path.join(projectRoot, 'package.json');
				if (!fs.existsSync(lockPath) || !fs.existsSync(pkgPath)) return;
				let lock, pkg;
				try {
					lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
					pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
				} catch {
					return;
				}

				const overrides = pkg.overrides || pkg.resolutions || (pkg['pnpm'] && pkg['pnpm'].overrides) || {};
				for (const [k, v] of Object.entries(overrides)) {
					if (v && typeof v === 'object' && !Array.isArray(v)) {
						const library = k;
						const libEntry = findLibraryEntry(lock, library);
						if (!libEntry) {
							context.report({ node, messageId: 'missingTarget', data: { target: library } });
							continue;
						}
						for (const [dep, overrideSpec] of Object.entries(v)) {
							const libDep = (libEntry.dependencies && libEntry.dependencies[dep]) || (libEntry.requires && libEntry.requires[dep]);
							if (!libDep) {
								const depVersions = collectVersions(lock, dep);
								if (depVersions.length === 0) {
									context.report({ node, messageId: 'missingTarget', data: { target: dep } });
								}
								continue;
							}
							const libBase = normalizeVersion(libDep);
							const overrideBase = parseBaseVersion(overrideSpec);
							if (libBase && overrideBase && cmpParts(libBase, overrideBase) >= 0) {
								context.report({ node, messageId: 'staleOverride', data: { library, dep, libConstraint: libDep, override: overrideSpec } });
							}
						}
					} else {
						const target = k;
						const targetVersions = collectVersions(lock, target);
						if (targetVersions.length === 0) {
							context.report({ node, messageId: 'missingTarget', data: { target } });
						}
					}
				}
			},
		};
	},
};
