import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../components/foundation/smartfetch', () => ({
	smartFetch: vi.fn()
}));

import { smartFetch } from '../components/foundation/smartfetch';
import {
	listEntries,
	getEntryById,
	createEntry,
	updateEntry,
	deleteEntry,
	searchEntriesByField
} from '../components/integrations/contentful.management';

const mockConfig = {
	space_id: 'test-space-id',
	management_access_token: 'test-token',
	environment: 'master'
};

describe('Contentful Management integration tests', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('listEntries should fetch entries and return success', async () => {
		vi.mocked(smartFetch).mockResolvedValueOnce({ items: [{ sys: { id: 'entry-1' } }] });

		const result = await listEntries('Product', mockConfig);

		expect(result.success).toBe(true);
		expect(result.entries).toHaveLength(1);
		expect((smartFetch as any).mock.calls[0][0]).toContain('/spaces/test-space-id/environments/master/entries');
		expect((smartFetch as any).mock.calls[0][1].requestInit.headers.Authorization).toContain('Bearer test-token');
	});

	it('getEntryById should return entry data when found', async () => {
		const entryData = { sys: { id: 'entry-123', version: 1 }, fields: { title: { 'en-US': 'Test' } } };
		vi.mocked(smartFetch).mockResolvedValueOnce(entryData);

		const result = await getEntryById('entry-123', mockConfig);

		expect(result.success).toBe(true);
		expect(result.entry).toEqual(entryData);
	});

	it('getEntryById should return not found when API returns 404', async () => {
		const error = new Error('Not found');
		(error as any).status = 404;
		vi.mocked(smartFetch).mockRejectedValueOnce(error);

		const result = await getEntryById('entry-404', mockConfig);

		expect(result.success).toBe(false);
		expect(result.message).toBe('Entry not found.');
	});

	it('createEntry should create and publish an entry when autoPublish is true', async () => {
		vi.mocked(smartFetch).mockResolvedValueOnce({ sys: { id: 'new-entry', version: 1 } });
		vi.mocked(smartFetch).mockResolvedValueOnce({});

		const result = await createEntry('Product', { title: 'Test Product' }, mockConfig);

		expect(result.success).toBe(true);
		expect(result.entryId).toBe('new-entry');
		expect((smartFetch as any).mock.calls.length).toBe(2);
	});

	it('updateEntry should update and publish an existing entry', async () => {
		vi.mocked(smartFetch).mockResolvedValueOnce({ sys: { version: 2 } });
		vi.mocked(smartFetch).mockResolvedValueOnce({ sys: { version: 3 } });
		vi.mocked(smartFetch).mockResolvedValueOnce({});

		const result = await updateEntry('entry-123', { title: 'Updated Title' }, mockConfig);

		expect(result.success).toBe(true);
		expect(result.entryId).toBe('entry-123');
	});

	it('deleteEntry should unpublish and delete an entry successfully', async () => {
		vi.mocked(smartFetch).mockResolvedValueOnce({ sys: { id: 'entry-123', version: 5 } });
		vi.mocked(smartFetch).mockResolvedValueOnce({});
		vi.mocked(smartFetch).mockResolvedValueOnce({});

		const result = await deleteEntry('entry-123', mockConfig);

		expect(result.success).toBe(true);
		expect(result.message).toContain('Entry deleted successfully.');
	});

	it('searchEntriesByField should return matched items', async () => {
		vi.mocked(smartFetch).mockResolvedValueOnce({ items: [{ sys: { id: 'entry-1' } }] });

		const result = await searchEntriesByField('Product', 'title', 'Test', mockConfig);

		expect(result.success).toBe(true);
		expect(result.entries).toHaveLength(1);
	});

	it('listEntries should return failure when fetch throws', async () => {
		vi.mocked(smartFetch).mockRejectedValueOnce(new Error('Network error'));

		const result = await listEntries('Product', mockConfig);

		expect(result.success).toBe(false);
		expect(result.entries).toHaveLength(0);
		expect(result.message).toContain('Failed to list entries:');
	});
});
