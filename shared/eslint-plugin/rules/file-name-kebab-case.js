export const fileNameKebabCaseRule = (function fileNameKebabCaseRule() {
	const KEBAB_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
	const rule = {
		meta: {
			type: 'suggestion',
			docs: { description: 'enforce kebab-case file names (lowercase-with-hyphens)', category: 'Stylistic Issues', recommended: true },
			fixable: null,
			schema: [{ type: 'object', properties: { allow: { type: 'array', items: { type: 'string' } } }, additionalProperties: false }],
			messages: { notKebab: 'File name "{{name}}" is not kebab-case. Rename to "{{expected}}" (exceptions: index, tests/stories, .d.ts, docs).' },
		},
		create(context) {
			const opts = (context.options && context.options[0]) || {};
			const allow = Array.isArray(opts.allow) ? opts.allow : [];
			return {
				Program(node) {
					try {
						const filename = context.sourceCode?.filename;
						if (!filename || filename === '<input>') return;
						const fn = filename.replace(/\\\\/g, '/').split('/').pop();
						if (!fn) return;
						if (/^README(\.|$)/i.test(fn)) return;
						let core = fn.replace(/\.d\.ts$/i, '').replace(/\.[^.]+$/, '');
						core = core.replace(/\.(test|spec|stories|honeypot\.test)$/i, '');
						if (!core || core === 'index') return;
						if (/\/(?:docs|src\/tests|src\/stories)\//.test(filename)) return;
						if (allow.includes(fn)) return;
						if (!KEBAB_RE.test(core)) {
							const expected = core.replace(/([A-Z])/g, (m) => '-' + m.toLowerCase()).replace(/[_\s]+/g, '-').replace(/--+/g, '-').replace(/^[\-]+|[\-]+$/g, '');
							const suggested = expected || core.toLowerCase();
							context.report({ node, messageId: 'notKebab', data: { name: fn, expected: suggested } });
						}
					} catch {
						// defensive
					}
				},
			};
		},
	};
	return rule;
})();
