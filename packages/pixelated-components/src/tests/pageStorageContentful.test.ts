import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listContentfulPages,
  loadContentfulPage,
  saveContentfulPage,
  deleteContentfulPage,
} from '../components/sitebuilder/page/lib/pageStorageContentful';
import { getContentfulEntriesByType } from '../components/integrations/contentful.delivery';
import { searchEntriesByField, createEntry, updateEntry, deleteEntry } from '../components/integrations/contentful.management';

vi.mock('../components/integrations/contentful.delivery', () => ({
  getContentfulEntriesByType: vi.fn(),
}));

vi.mock('../components/integrations/contentful.management', () => ({
  searchEntriesByField: vi.fn(),
  createEntry: vi.fn(),
  updateEntry: vi.fn(),
  deleteEntry: vi.fn(),
}));

describe('pageStorageContentful', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const config: any = {
    base_url: 'https://cdn.contentful.com',
    space_id: 'space-id',
    environment: 'master',
    delivery_access_token: 'delivery-token',
    management_access_token: 'management-token',
  };

  it('lists pages and sorts results alphabetically', async () => {
    vi.mocked(getContentfulEntriesByType).mockResolvedValueOnce({
      items: [
        { fields: { pageName: { 'en-US': 'z-page' } } },
        { fields: { pageName: { 'en-US': 'a-page' } } },
      ],
    });

    const result = await listContentfulPages(config);
    expect(result.success).toBe(true);
    expect(result.pages).toEqual(['a-page', 'z-page']);
  });

  it('returns empty page list when delivery returns invalid items', async () => {
    vi.mocked(getContentfulEntriesByType).mockResolvedValueOnce({ items: null });
    const result = await listContentfulPages(config);
    expect(result.success).toBe(true);
    expect(result.pages).toEqual([]);
  });

  it('loads a page by exact name', async () => {
    vi.mocked(getContentfulEntriesByType).mockResolvedValueOnce({
      items: [
        { fields: { pageName: { 'en-US': 'my-page' }, pageData: { 'en-US': { components: [] } } } },
      ],
    });

    const result = await loadContentfulPage('my-page', config);
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ components: [] });
  });

  it('returns not found for missing page entries', async () => {
    vi.mocked(getContentfulEntriesByType).mockResolvedValueOnce({
      items: [
        { fields: { pageName: { 'en-US': 'other-page' }, pageData: { 'en-US': {} } } },
      ],
    });

    const result = await loadContentfulPage('missing-page', config);
    expect(result.success).toBe(false);
    expect(result.message).toContain('not found');
  });

  it('rejects invalid page names', async () => {
    const result = await loadContentfulPage('invalid page!', config);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Invalid page name');
  });

  it('creates a new page when none exists', async () => {
    vi.mocked(searchEntriesByField).mockResolvedValueOnce({ success: true, entries: [] });
    vi.mocked(createEntry).mockResolvedValueOnce({ success: true, message: 'Entry created successfully.' });

    const result = await saveContentfulPage('new-page', { components: [] }, config);
    expect(result.success).toBe(true);
    expect(result.filename).toBe('new-page');
    expect(createEntry).toHaveBeenCalledWith('page', expect.any(Object), config, true);
  });

  it('updates an existing page when found', async () => {
    vi.mocked(searchEntriesByField).mockResolvedValueOnce({
      success: true,
      entries: [{ sys: { id: 'entry123' } }],
    });
    vi.mocked(updateEntry).mockResolvedValueOnce({ success: true, message: 'Entry updated successfully.' });

    const result = await saveContentfulPage('existing-page', { components: [] }, config);
    expect(result.success).toBe(true);
    expect(result.filename).toBe('existing-page');
    expect(updateEntry).toHaveBeenCalledWith('entry123', expect.any(Object), config, true);
  });

  it('returns a failure when searchEntriesByField fails during save', async () => {
    vi.mocked(searchEntriesByField).mockResolvedValueOnce({ success: false, message: 'Search failed', entries: [] });

    const result = await saveContentfulPage('page-fail', { components: [] }, config);
    expect(result.success).toBe(false);
    expect(result.message).toBe('Search failed');
  });

  it('returns validation failure when deleting an invalid page name', async () => {
    const result = await deleteContentfulPage('bad page!', config);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Invalid page name');
  });

  it('deletes an existing page by id', async () => {
    vi.mocked(searchEntriesByField).mockResolvedValueOnce({
      success: true,
      entries: [{ sys: { id: 'delete-id' } }],
    });
    vi.mocked(deleteEntry).mockResolvedValueOnce({ success: true, message: 'Entry deleted successfully.' });

    const result = await deleteContentfulPage('delete-page', config);
    expect(result.success).toBe(true);
    expect(deleteEntry).toHaveBeenCalledWith('delete-id', config);
  });

  it('returns not found when delete search returns no entries', async () => {
    vi.mocked(searchEntriesByField).mockResolvedValueOnce({ success: true, entries: [] });

    const result = await deleteContentfulPage('missing-page', config);
    expect(result.success).toBe(false);
    expect(result.message).toContain('not found');
  });
});
