export const validateTestLocationsRule = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Enforce canonical test file locations (only `src/tests` or `src/stories`)',
			category: 'Project Structure',
			recommended: true,
		},
		messages: {
			badLocation: 'Test spec files must live under `src/tests/` or `src/stories/` — move or add a migration note.',
		},
		schema: [],
	},
	create(context) {
		const filename = context.sourceCode?.filename;
		if (!filename || filename === '<input>' || filename === '<text>') return {};

		const isTestish = /\.(test|spec)\.(t|j)sx?$|\.honeypot\.test\.|\.stories?\./i.test(filename);
		if (!isTestish) return {};

		const normalized = filename.replaceAll('\\', '/');
		const allowedRoots = ['/src/tests/', '/src/stories/'];
		const ok = allowedRoots.some(r => normalized.includes(r));
		if (ok) return {};

		return {
			Program(node) {
				context.report({ node, messageId: 'badLocation' });
			},
		};
	},
};
