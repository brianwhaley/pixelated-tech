import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.resolve(__dirname, '../../packages/pixelated-components/src/scripts/create-pixelated-app.json');

interface CreatePixelatedAppTemplate {
	name: string;
	aliases?: string[];
	src?: string;
	action?: string;
	associated_files?: string[];
}

interface CreatePixelatedAppManifest {
	templates: CreatePixelatedAppTemplate[];
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as CreatePixelatedAppManifest;

const pageTypes = manifest.templates
	.filter((template) => template.src && template.action !== 'ignore')
	.map((template) => ({
		name: template.name,
		routeSegment: template.src!.split('/').pop() ?? template.name.toLowerCase().replace(/\s+/g, '-'),
		aliases: template.aliases ?? [],
		associatedFiles: template.associated_files ?? [],
	}))
	.filter((template) => !!template.routeSegment);

const pageFileCandidates = ['page.tsx', 'page.ts', 'page.jsx', 'page.js', 'index.tsx', 'index.ts', 'index.jsx', 'index.js'];

function findPageFile(appRoot: string, routeSegment: string): string | null {
	const pageDir = path.join(appRoot, 'src', 'app', '(pages)', routeSegment);
	for (const candidate of pageFileCandidates) {
		const filePath = path.join(pageDir, candidate);
		if (fs.existsSync(filePath)) {
			return filePath;
		}
	}
	return null;
}

function resolveAssociatedFile(appRoot: string, associatedFile: string) {
	return path.join(appRoot, associatedFile);
}

function getIgnoredPageTypes(overrides: string[] = []) {
	return [...new Set(overrides.map((item) => item.toLowerCase()))];
}

export interface RunSharedPageTypeCoverageOptions {
	appRoot?: string;
	ignoredPageTypes?: string[];
	verifyDefaultImport?: boolean;
	verifyAssociatedFiles?: boolean;
}

export function runSharedPageTypeCoverage({
	appRoot = process.cwd(),
	ignoredPageTypes = [],
	verifyDefaultImport = true,
	verifyAssociatedFiles = true,
}: RunSharedPageTypeCoverageOptions = {}) {
	describe('Shared template page type coverage', () => {
		const ignored = getIgnoredPageTypes(ignoredPageTypes);

		for (const pageType of pageTypes) {
			if (ignored.includes(pageType.routeSegment.toLowerCase()) || ignored.includes(pageType.name.toLowerCase())) {
				it.skip(`skips ${pageType.name} when the app does not implement that page type`, () => {
					expect(true).toBe(true);
				});
				continue;
			}

			it(`includes a ${pageType.name} page route`, () => {
				const filePath = findPageFile(appRoot, pageType.routeSegment);
				expect(filePath).not.toBeNull();
			});

			if (verifyDefaultImport) {
				it(`imports the ${pageType.name} page component`, async () => {
					const filePath = findPageFile(appRoot, pageType.routeSegment);
					expect(filePath).not.toBeNull();
					const component = await import(pathToFileURL(filePath!).href);
					expect(component).toHaveProperty('default');
				});
			}

			if (verifyAssociatedFiles && pageType.associatedFiles.length > 0) {
				for (const associatedFile of pageType.associatedFiles) {
					it(`includes associated file ${associatedFile} for ${pageType.name}`, () => {
						const filePath = resolveAssociatedFile(appRoot, associatedFile);
						expect(fs.existsSync(filePath)).toBe(true);
					});
				}
			}
		}
	});
}
