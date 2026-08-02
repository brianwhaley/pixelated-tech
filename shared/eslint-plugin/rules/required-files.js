import fs from 'fs';
import path from 'path';

export const requiredFilesRule = {
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Ensure critical project files are present',
			category: 'Project Structure',
			recommended: true,
		},
		messages: {
			missingFile: 'Missing recommended project file: "{{fileName}}".',
		},
	},
	create(context) {
		const filename = context.sourceCode?.filename || context.getFilename?.() || '';
		if (!filename.endsWith('layout.tsx')) return {};

		const projectRoot = context.cwd;
		const requiredFiles = [
			{ name: 'sitemap', pattern: /sitemap\.(ts|js|xml|tsx)$/ },
			{ name: 'sitemap.json', pattern: /sitemap\.json$/ },
			{ name: 'rss.xml', pattern: /rss\.xml$/ },
			{ name: 'ai.txt', pattern: /ai\.txt$/ },
			{ name: 'humans.txt', pattern: /humans\.txt$/ },
			{ name: 'security.txt', pattern: /security\.txt$/ },
			{ name: 'global-error', pattern: /global-error\.tsx$/ },
			{ name: 'loading', pattern: /loading\.tsx$/ },
			{ name: 'manifest', pattern: /manifest\.(json|ts|tsx)$/ },
			{ name: 'robots', pattern: /robots\.(ts|tsx)$/ },
			{ name: 'not-found', pattern: /not-found\.tsx$/ },
			{ name: 'proxy.ts', pattern: /^proxy\.ts$/ },
		];

		return {
			'Program:exit'() {
				try {
					const files = fs.readdirSync(projectRoot);
					let appFiles = [];
					let srcFiles = [];
					const appPath = path.join(projectRoot, 'src/app');
					const srcPath = path.join(projectRoot, 'src');

					if (fs.existsSync(appPath)) {
						appFiles = fs.readdirSync(appPath);
					}
					if (fs.existsSync(srcPath)) {
						srcFiles = fs.readdirSync(srcPath);
					}

					const allFiles = [...files, ...appFiles, ...srcFiles];

					requiredFiles.forEach(req => {
						const found = allFiles.some(f => req.pattern.test(f));
						if (!found) {
							context.report({ loc: { line: 1, column: 0 }, messageId: 'missingFile', data: { fileName: req.name } });
						}
					});
				} catch {
					// Ignore errors
				}
			},
		};
	},
};
