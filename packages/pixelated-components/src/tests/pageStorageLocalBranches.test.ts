import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../components/config/config', () => ({
	getFullPixelatedConfig: () => ({
		global: {
			pagesDir: 'test-pages'
		}
	})
}));

vi.mock('fs', () => ({
	default: {
		existsSync: vi.fn(),
		mkdirSync: vi.fn(),
		readdirSync: vi.fn(),
		readFileSync: vi.fn(),
		writeFileSync: vi.fn(),
		unlinkSync: vi.fn()
	}
}));

import { validatePageName, listPages, loadPage, savePage, deletePage } from '../components/sitebuilder/page/lib/pageStorageLocal';
import fs from 'fs';

describe('pageStorageLocal branches', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should validate page names correctly', () => {
		expect(validatePageName('valid-name_123')).toBe(true);
		expect(validatePageName('invalid name')).toBe(false);
		expect(validatePageName('')).toBe(false);
	});

	it('should list pages only for json files', async () => {
		(fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true);
		(fs.readdirSync as ReturnType<typeof vi.fn>).mockReturnValue(['page-one.json', 'readme.md', 'page-two.json']);

		const result = await listPages();
		expect(result.success).toBe(true);
		expect(result.pages).toEqual(['page-one', 'page-two']);
	});

	it('should return failure when listPages throws', async () => {
		(fs.existsSync as ReturnType<typeof vi.fn>).mockImplementation(() => { throw new Error('boom'); });

		const result = await listPages();
		expect(result.success).toBe(false);
		expect(result.pages).toEqual([]);
	});

	it('should fail to load invalid page names', async () => {
		const result = await loadPage('invalid name');
		expect(result.success).toBe(false);
		expect(result.message).toContain('Invalid page name');
	});

	it('should return not found when loading a missing page', async () => {
		(fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

		const result = await loadPage('page-one');
		expect(result.success).toBe(false);
		expect(result.message).toContain('not found');
	});

	it('should load a page successfully', async () => {
		(fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true);
		(fs.readFileSync as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify({ name: 'page-one' }));

		const result = await loadPage('page-one');
		expect(result.success).toBe(true);
		expect(result.data).toEqual({ name: 'page-one' });
	});

	it('should fail to save invalid page names', async () => {
		const result = await savePage('bad page', { name: 'invalid' } as any);
		expect(result.success).toBe(false);
		expect(result.message).toContain('Invalid page name');
	});

	it('should save a page successfully', async () => {
		(fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);
		const result = await savePage('page-two', { name: 'page-two' } as any);
		expect(result.success).toBe(true);
		expect(result.filename).toBe('page-two.json');
	});

	it('should fail to delete invalid page names', async () => {
		const result = await deletePage('bad page');
		expect(result.success).toBe(false);
	});

	it('should return not found when deleting a missing page', async () => {
		(fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

		const result = await deletePage('page-two');
		expect(result.success).toBe(false);
	});

	it('should delete a page successfully', async () => {
		(fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true);

		const result = await deletePage('page-two');
		expect(result.success).toBe(true);
	});
});
