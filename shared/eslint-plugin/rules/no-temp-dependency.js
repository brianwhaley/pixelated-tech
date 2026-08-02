import fs from 'fs';
import path from 'path';

export const noTempDependencyRule = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Disallow temporary security dependencies listed in the rule options (lockfile-only check).',
			category: 'Security',
			recommended: true,
		},
		fixable: false,
		messages: {
			tempDepPresent: 'Temporary dependency "{{name}}" detected at version {{version}} (vulnerable: {{range}}). Remove once upstream packages are fixed.',
		},
		schema: [{ type: 'array', items: { type: 'object' } }],
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

		function satisfiesRange(version, rangeSpec) {
			if (!rangeSpec || typeof rangeSpec !== 'string') return false;
			rangeSpec = rangeSpec.trim();
			const ver = normalizeVersion(version);
			if (rangeSpec.startsWith('<=') ) {
				const v = rangeSpec.slice(2).trim();
				return cmpParts(ver, v) <= 0;
			}
			if (rangeSpec.startsWith('<')) {
				const v = rangeSpec.slice(1).trim();
				return cmpParts(ver, v) < 0;
			}
			if (rangeSpec.startsWith('>=')) {
				const v = rangeSpec.slice(2).trim();
				return cmpParts(ver, v) >= 0;
			}
			if (rangeSpec.startsWith('>')) {
				const v = rangeSpec.slice(1).trim();
				return cmpParts(ver, v) > 0;
			}
			if (rangeSpec.startsWith('^')) {
				const v = rangeSpec.slice(1).trim();
				const [maj, min] = v.split('.').map(n => parseInt(n, 10) || 0);
				if (maj > 0) {
					return cmpParts(ver, v) >= 0 && cmpParts(ver, `${maj + 1}.0.0`) < 0;
				}
				if (maj === 0 && min > 0) {
					return cmpParts(ver, v) >= 0 && cmpParts(ver, `0.${min + 1}.0`) < 0;
				}
				return cmpParts(ver, v) >= 0 && cmpParts(ver, `0.0.${(parseInt(v.split('.')[2] || '0', 10) || 0) + 1}`) < 0;
			}
			if (rangeSpec.startsWith('~')) {
				const v = rangeSpec.slice(1).trim();
				const [maj, min] = v.split('.').map(n => parseInt(n, 10) || 0);
				return cmpParts(ver, v) >= 0 && cmpParts(ver, `${maj}.${min + 1}.0`) < 0;
			}
			return cmpParts(ver, normalizeVersion(rangeSpec)) === 0 || rangeSpec === '=' + ver;
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

		return {
			Program(node) {
				if (ran) return; ran = true;
				const projectRoot = process.cwd();
				const lockPath = path.join(projectRoot, 'package-lock.json');
				if (!fs.existsSync(lockPath)) return;
				let lock;
				try {
					lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
				} catch {
					return;
				}

				const rules = context.options[0] || [{ name: 'fast-xml-parser', vulnerableRange: '<=5.3.3', note: 'temporary security pin' }];
				for (const r of rules) {
					const versions = collectVersions(lock, r.name);
					const vulnerable = versions.some(v => satisfiesRange(v, r.vulnerableRange));
					if (vulnerable) {
						context.report({ node, messageId: 'tempDepPresent', data: { name: r.name, version: versions[0], range: r.vulnerableRange } });
					}
				}
			},
		};
	},
};
