import fs from 'fs';
import path from 'path';

export const requiredFaqRule = {
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Ensure FAQ page and FAQSchema are present',
			category: 'SEO',
			recommended: true,
		},
		messages: {
			missingFaqPage: 'FAQ page is missing. FAQ pages are strongly recommended (examples: src/app/faqs/page.tsx, src/app/(pages)/faqs/page.tsx, src/pages/faqs/index.tsx).',
			missingFaqSchema: 'FAQSchema (SchemaFAQ / JSON-LD @type:FAQPage) is missing from the FAQ page.',
		},
	},
	create(context) {
		const filename = context.sourceCode?.filename || context.getFilename?.() || '';
		if (!filename.endsWith('layout.tsx')) return {};

		const projectRoot = context.cwd;

		function findFaqPath(root) {
			const srcRoot = path.join(root, 'src');
			if (!fs.existsSync(srcRoot)) return null;

			const stack = [srcRoot];
			const filePattern = /(^|\/)faqs?\.(t|j)sx?$/i;
			while (stack.length) {
				const cur = stack.pop();
				try {
					const entries = fs.readdirSync(cur, { withFileTypes: true });
					for (const e of entries) {
						const full = path.join(cur, e.name);
						const rel = path.relative(root, full).replace(/\\/g, '/');

						if (e.isDirectory()) {
							if (/^faqs?$/i.test(e.name)) {
								const candidates = [
									path.join(full, 'page.tsx'),
									path.join(full, 'page.ts'),
									path.join(full, 'index.tsx'),
									path.join(full, 'index.ts'),
								];
								for (const c of candidates) if (fs.existsSync(c)) return c;
							}
							stack.push(full);
							continue;
						}

						if (filePattern.test(rel)) return full;
					}
				} catch {
					// ignore unreadable dirs
				}
			}

			return null;
		}

		const faqPath = findFaqPath(projectRoot);

		return {
			'Program:exit'() {
				if (!faqPath || !fs.existsSync(faqPath)) {
					context.report({ loc: { line: 1, column: 0 }, messageId: 'missingFaqPage' });
					return;
				}

				try {
					const content = fs.readFileSync(faqPath, 'utf8');
					const hasSchema = /FAQSchema|SchemaFAQ|"@type"\s*:\s*"FAQPage"/i.test(content);
					if (!hasSchema) {
						context.report({ loc: { line: 1, column: 0 }, messageId: 'missingFaqSchema' });
					}
				} catch {
					// Ignore read errors
				}
			},
		};
	},
};
