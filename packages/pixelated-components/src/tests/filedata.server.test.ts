import { beforeEach, describe, expect, it, vi } from 'vitest';

const readdir = vi.hoisted(() => vi.fn());
vi.mock('fs', () => ({ promises: { readdir } }));

import { getAdminDataDirectory, getAdminDataFiles } from '../components/admin/filedata/filedata.server';

describe('admin file data server helpers', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns eligible JSON files sorted newest-first by name', async () => {
		readdir.mockResolvedValue([
			{ name: 'assessment-2026-01.json', isFile: () => true },
			{ name: 'assessment-2026-03.json', isFile: () => true },
			{ name: 'manifest.json', isFile: () => true },
			{ name: 'assessment-2026-02.bak.json', isFile: () => true },
			{ name: '.hidden.json', isFile: () => true },
			{ name: 'notes.txt', isFile: () => true },
			{ name: 'assessment-2026-04.json', isFile: () => false },
		]);

		await expect(getAdminDataFiles('/tmp/admin-data')).resolves.toEqual([
			'assessment-2026-03.json',
			'assessment-2026-01.json',
		]);
		expect(readdir).toHaveBeenCalledWith('/tmp/admin-data', { withFileTypes: true });
	});

	it('builds the public admin data directory path', () => {
		expect(getAdminDataDirectory('/workspace/app', 'assessment')).toContain('/workspace/app/public/data/assessment');
	});
});
