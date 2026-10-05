import { describe, expect, it } from 'vitest';
import { isAdminDataFile, sortAdminDataFiles } from '../components/admin/filedata/filedata.functions';

describe('admin file-data helpers', () => {
	it('excludes manifests, backups, and hidden files', () => {
		expect(isAdminDataFile('20261003-assessment.json')).toBe(true);
		expect(isAdminDataFile('manifest.json')).toBe(false);
		expect(isAdminDataFile('20261002-assessment.bak.json')).toBe(false);
		expect(isAdminDataFile('.DS_Store')).toBe(false);
		expect(isAdminDataFile('notes.txt')).toBe(false);
	});

	it('sorts discovered files newest-first', () => {
		expect(sortAdminDataFiles([
			'20260901-assessment.json',
			'20261003-assessment.json',
			'20261002-assessment.json',
		])).toEqual([
			'20261003-assessment.json',
			'20261002-assessment.json',
			'20260901-assessment.json',
		]);
	});
});
