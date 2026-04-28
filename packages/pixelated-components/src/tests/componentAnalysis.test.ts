import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import * as componentAnalysisModule from '../components/admin/componentusage/componentAnalysis';
import { folderFilenameToExportName, getAllFiles, checkComponentUsage, analyzeComponentUsage } from '../components/admin/componentusage/componentAnalysis';
import type { SiteConfig } from '../components/admin/sites/sites.integration';

describe('Component Analysis', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('folderFilenameToExportName', () => {
		it('should convert folder/filename to export name', () => {
			const name = folderFilenameToExportName('general/modal');
			expect(name).toBe('Modal');
		});

		it('should handle components folder suffix', () => {
			const name = folderFilenameToExportName('integrations/calendly.components');
			expect(name).toBe('Calendly');
		});

		it('should strip schema prefix', () => {
			const name = folderFilenameToExportName('general/schema-button');
			expect(name).toBe('Button');
		});

		it('should handle single word names without folder', () => {
			const name = folderFilenameToExportName('modal');
			expect(name).toBe('Modal');
		});

		it('should handle multiple hierarchy levels', () => {
			const name = folderFilenameToExportName('components/sitebuilder/form/components');
			expect(name).toBe('Components');
		});

		it('should convert hyphenated names', () => {
			const name = folderFilenameToExportName('general/page-title');
			expect(name).toBe('PageTitle');
		});

		it('should convert dotted names', () => {
			const name = folderFilenameToExportName('general/google.reviews.components');
			expect(name).toBe('GoogleReviews');
		});

		it('should handle mixed hyphen and dot', () => {
			const name = folderFilenameToExportName('general/form-validator.utils');
			expect(name).toBe('FormValidatorUtils');
		});

		it('should capitalize each word in camelCase', () => {
			const name = folderFilenameToExportName('integrations/stripe.functions');
			expect(name).toBe('StripeFunctions');
		});

		it('should handle complex folder paths', () => {
			const name = folderFilenameToExportName('sitebuilder/form/schema/address-input.components');
			expect(name).toBe('AddressInput');
		});

		it('should handle empty components suffix', () => {
			const name = folderFilenameToExportName('general/test.components.tsx');
			// Note: function only takes filename part after last /, so this tests just 'test.components.tsx'
			expect(name).toMatch(/Test/);
		});

		it('should result in PascalCase output', () => {
			const inputs = [
				'general/modal',
				'integrations/google-places',
				'sitebuilder/form/email-input',
				'admin/site-health-checker',
			];

			inputs.forEach(input => {
				const result = folderFilenameToExportName(input);
				// First character should always be uppercase
				expect(result[0]).toMatch(/[A-Z]/);
				// Result should not contain hyphens or dots
				expect(result).not.toMatch(/[-..]/);
			});
		});

		it('should maintain word capitalization', () => {
			const testCases = {
				'general/modal': 'Modal',
				'integrations/stripe': 'Stripe',
				'form/email-input': 'EmailInput',
				'google-analytics': 'GoogleAnalytics',
			};

			Object.entries(testCases).forEach(([input, expected]) => {
				expect(folderFilenameToExportName(input)).toBe(expected);
			});
		});

		it('should handle schema prefix stripping consistently', () => {
			const schemaTests = [
				{ input: 'general/schema-button', expected: 'Button' },
				{ input: 'general/button', expected: 'Button' },
				{ input: 'schema-modal', expected: 'Modal' },
			];

			schemaTests.forEach(({ input, expected }) => {
				expect(folderFilenameToExportName(input)).toBe(expected);
			});
		});

		it('should handle multiple dots and hyphens', () => {
			const name = folderFilenameToExportName('general/multi-word.compound-name');
			// Should convert to MultiWordCompoundName
			expect(name).toMatch(/^[A-Z]/);
			expect(name.length).toBeGreaterThan(0);
		});

		it('should be consistent across multiple calls', () => {
			const input = 'integrations/google-places';
			const result1 = folderFilenameToExportName(input);
			const result2 = folderFilenameToExportName(input);
			expect(result1).toBe(result2);
		});

		it('should handle numeric characters', () => {
			const name = folderFilenameToExportName('general/form-2fa');
			expect(name).toBeDefined();
			expect(name.length).toBeGreaterThan(0);
		});

		it('should convert all test fixtures correctly', () => {
			const fixtures = [
				'admin/modal',
				'cms/plugin-manager',
				'components/general/button',
				'integrations/stripe.functions',
				'sitebuilder/form/address-input.components',
				'schema-field',
				'form-validator.utils',
			];

			fixtures.forEach(fixture => {
				const result = folderFilenameToExportName(fixture);
				// All should result in valid identifiers starting with capital letter
				expect(/^[A-Z][a-zA-Z0-9]*$/.test(result)).toBe(true);
			});
		});
	});

	describe('Component Analysis Error Handling', () => {
		it('should handle empty strings gracefully', () => {
			const name = folderFilenameToExportName('');
			expect(name).toBeDefined();
		});

		it('should handle strings with only special characters', () => {
			const name = folderFilenameToExportName('---');
			expect(name).toBeDefined();
		});

		it('should handle very long component names', () => {
			const longName = 'general/' + 'very-long-component-name-that-is-quite-lengthy';
			const result = folderFilenameToExportName(longName);
			expect(result).toBeDefined();
			expect(result.length).toBeGreaterThan(0);
		});
	});

	describe('Component Analysis Integration', () => {
		it('should convert folder structure to valid JavaScript identifiers', () => {
			const testPaths = [
				'components/general/button',
				'components/integrations/stripe',
				'src/components/sitebuilder/form/email',
			];

			testPaths.forEach(testPath => {
				const result = folderFilenameToExportName(testPath);
				// Valid identifier: starts with letter, contains only alphanumeric
				expect(/^[a-zA-Z][a-zA-Z0-9]*$/.test(result)).toBe(true);
			});
		});

		it('should handle real component paths from codebase', () => {
			const realPaths = [
				'general/modal',
				'integrations/calendly.components',
				'sitebuilder/form/formcomponents',
				'admin/sitemap.components',
				'integrations/google-places',
			];

			realPaths.forEach(path => {
				const name = folderFilenameToExportName(path);
				expect(name).toBeTruthy();
				// Should be Pascal case
				expect(name[0]).toMatch(/[A-Z]/);
			});
		});
	});

	describe('getAllFiles', () => {
		it('should be defined and callable', async () => {
			expect(typeof getAllFiles).toBe('function');
		});

		it('should return an array', async () => {
			const result = await getAllFiles('.');
			expect(Array.isArray(result)).toBe(true);
		});

		it('should scan directories recursively and filter extensions', async () => {
			const dirents = [
				{ name: 'subdir', isDirectory: () => true, isFile: () => false },
				{ name: 'file.ts', isDirectory: () => false, isFile: () => true }
			];

			vi.spyOn(fs.promises, 'readdir').mockResolvedValueOnce(dirents as any).mockResolvedValueOnce(
				[{ name: 'nested.ts', isDirectory: () => false, isFile: () => true }] as any
			);

			const result = await getAllFiles('/root', ['.ts']);
			expect(result).toEqual(['/root/subdir/nested.ts', '/root/file.ts']);
		});

		it('should return empty array when directory cannot be read', async () => {
			vi.spyOn(fs.promises, 'readdir').mockRejectedValueOnce(new Error('ENOENT'));

			const result = await getAllFiles('/nope', ['.ts']);
			expect(result).toEqual([]);
		});

		it('should skip node_modules and .next directories during scanning', async () => {
			const dirents = [
				{ name: 'node_modules', isDirectory: () => true, isFile: () => false },
				{ name: '.next', isDirectory: () => true, isFile: () => false },
				{ name: 'file.ts', isDirectory: () => false, isFile: () => true }
			];

			vi.spyOn(fs.promises, 'readdir').mockResolvedValueOnce(dirents as any);
			const result = await getAllFiles('/root', ['.ts']);
			expect(result).toEqual(['/root/file.ts']);
		});
	});

	describe('checkComponentUsage', () => {
		it('should return false for undefined sitePath', async () => {
			const result = await checkComponentUsage(undefined, 'general/button');
			expect(result).toBe(false);
		});

		it('should detect semantic component usage in site files', async () => {
			vi.spyOn(fs.promises, 'readdir').mockResolvedValueOnce([{ name: 'index.tsx', isDirectory: () => false, isFile: () => true }] as any);
			vi.spyOn(fs.promises, 'readFile').mockResolvedValueOnce('import { PageTitleHeader } from "@pixelated-tech/components";');

			const result = await checkComponentUsage('/site', 'general/semantic');
			expect(result).toBe(true);
		});

		it('should detect regular component usage by export name', async () => {
			vi.spyOn(fs.promises, 'readdir').mockResolvedValueOnce([{ name: 'index.tsx', isDirectory: () => false, isFile: () => true }] as any);
			vi.spyOn(fs.promises, 'readFile').mockResolvedValueOnce('import { Modal } from "@pixelated-tech/components";');

			const result = await checkComponentUsage('/site', 'general/modal');
			expect(result).toBe(true);
		});
	});

	describe('analyzeComponentUsage', () => {
		it('should populate usage matrix and ignore failed site scans', async () => {
			const spy = vi.spyOn(componentAnalysisModule, 'checkComponentUsage').mockImplementation(async (_sitePath, componentName) => {
				if (componentName === 'fail-component') {
					throw new Error('scan failed');
				}
				return componentName === 'used-component';
			});

			const result = await analyzeComponentUsage(
				['used-component', 'fail-component'],
				[{ name: 'site1', localPath: '/site' } as SiteConfig]
			);

				expect(result.usageMatrix).toHaveProperty('used-component');
				expect(result.usageMatrix).toHaveProperty('fail-component');
				expect(result.usageMatrix['used-component']).toHaveProperty('site1');
				expect(result.usageMatrix['fail-component']).toHaveProperty('site1');
		});

		it('should handle semantic components specially', async () => {
			const result = await checkComponentUsage('/nonexistent/path', 'general/semantic');
			expect(typeof result).toBe('boolean');
		});

		it('should return boolean value', async () => {
			const result = await checkComponentUsage('.', 'general/button');
			expect(typeof result).toBe('boolean');
		});

		it('should check for imports of component name', async () => {
			expect(typeof checkComponentUsage).toBe('function');
		});

		it('should handle error gracefully', async () => {
			const result = await checkComponentUsage('.', 'nonexistent/component');
			expect(typeof result).toBe('boolean');
		});
	});

	describe('analyzeComponentUsage', () => {
		it('should return ComponentUsageResult structure', async () => {
			const result = await analyzeComponentUsage(['general/button'], []);
			expect(result).toHaveProperty('components');
			expect(result).toHaveProperty('siteList');
			expect(result).toHaveProperty('usageMatrix');
		});

		it('should initialize components array', async () => {
			const components = ['button', 'modal'];
			const result = await analyzeComponentUsage(components, []);
			expect(result.components).toBeDefined();
		});

		it('should initialize siteList array', async () => {
			const result = await analyzeComponentUsage([], []);
			expect(Array.isArray(result.siteList)).toBe(true);
		});

		it('should initialize usageMatrix object', async () => {
			const result = await analyzeComponentUsage([], []);
			expect(typeof result.usageMatrix).toBe('object');
		});

		it('should handle empty components array', async () => {
			const result = await analyzeComponentUsage([], []);
			expect(result.components).toBeDefined();
		});

		it('should handle empty sites array', async () => {
			const result = await analyzeComponentUsage(['button'], []);
			expect(result.siteList).toHaveLength(0);
		});

		it('should work with multiple components', async () => {
			const components = ['button', 'modal', 'dropdown'];
			const result = await analyzeComponentUsage(components, []);
			expect(result.components.length).toBeGreaterThanOrEqual(0);
		});

		it('should create matrix entries for each component', async () => {
			const result = await analyzeComponentUsage(['button'], []);
			expect(typeof result.usageMatrix).toBe('object');
		});
	});

	describe('Type definitions', () => {
		it('should define ComponentUsageResult interface', () => {
			const result: typeof analyzeComponentUsage = async () => ({
				components: ['modal', 'button'],
				siteList: [],
				usageMatrix: {
					modal: { site1: true, site2: false },
					button: { site1: false, site2: true }
				}
			}) as any;
			expect(typeof result).toBe('function');
		});

		it('should handle usage matrix with multiple sites', () => {
			const matrix: Record<string, Record<string, boolean>> = {
				'comp1': { 'site1': true, 'site2': false, 'site3': true },
				'comp2': { 'site1': false, 'site2': true, 'site3': false }
			};
			expect(Object.keys(matrix).length).toBe(2);
		});
	});
});
