import fs from 'fs';
import path from 'path';

export const noDuplicateExportNamesRule = {
	meta: {
		type: 'problem',
		docs: { description: 'Disallow duplicate exported identifiers from multiple source modules in a barrel file', category: 'Possible Errors', recommended: true },
		schema: [],
		messages: { duplicateExport: 'Duplicate export "{{name}}" found in multiple modules: {{modules}}' },
	},
	create(context) {
		const filename = context.sourceCode?.filename;
		return {
			Program() {
				try {
					const sourceCode = context.sourceCode || context.getSourceCode?.();
					const exportAll = sourceCode.ast.body.filter(n => n.type === 'ExportAllDeclaration');
					if (exportAll.length < 2) return;

					const nameMap = new Map();
					for (const node of exportAll) {
						if (!node.source || node.source.type !== 'Literal') continue;
						const spec = String(node.source.value);
						if (!spec.startsWith('.') && !spec.startsWith('/')) continue;
						let resolved;
						try {
							resolved = require.resolve(spec, { paths: [path.dirname(filename)] });
						} catch {
							const alt = path.resolve(path.dirname(filename), spec);
							if (fs.existsSync(alt + '.ts')) resolved = alt + '.ts';
							else if (fs.existsSync(alt + '.tsx')) resolved = alt + '.tsx';
							else if (fs.existsSync(alt + '.js')) resolved = alt + '.js';
							else continue;
						}
						let content = '';
						try { content = fs.readFileSync(resolved, 'utf8'); } catch { continue; }

						const exports = new Set();
						const patterns = [ /export\s+function\s+([A-Za-z0-9_$]+)/g, /export\s+(?:const|let|var)\s+([A-Za-z0-9_$]+)/g, /export\s+class\s+([A-Za-z0-9_$]+)/g, /export\s+(?:type|interface|enum)\s+([A-Za-z0-9_$]+)/g, /export\s*\{([^}]+)\}/g ];
						for (const re of patterns) {
							let m;
							while ((m = re.exec(content))) {
								if (m[1]) {
									m[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean).forEach(n => exports.add(n));
								}
							}
						}
						for (const name of exports) {
							if (!nameMap.has(name)) nameMap.set(name, []);
							nameMap.get(name).push(spec);
						}
					}

					for (const [name, modules] of nameMap.entries()) {
						if (modules.length > 1) {
							context.report({ node: sourceCode.ast, messageId: 'duplicateExport', data: { name, modules: modules.join(', ') } });
						}
					}
				} catch {
					// defensive: do not allow rule errors to crash ESLint
				}
			},
		};
	},
};
