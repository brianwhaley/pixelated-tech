import { act, renderHook, waitFor } from '../test/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const smartFetch = vi.hoisted(() => vi.fn());
vi.mock('../components/foundation/smartfetch', () => ({ smartFetch }));

import { useAdminFileData } from '../components/admin/filedata/filedata.components';

describe('useAdminFileData', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('sorts files, selects the first file, and loads JSON data', async () => {
		smartFetch.mockResolvedValue({ name: 'latest' });
		const { result } = renderHook(() => useAdminFileData<{ name: string }>({
			files: ['older.json', 'latest.json'],
			publicPath: '/data/assessment',
		}));

		await waitFor(() => expect(result.current.data).toEqual({ name: 'latest' }));

		expect(result.current.files).toEqual(['older.json', 'latest.json']);
		expect(result.current.selectedFile).toBe('older.json');
		expect(result.current.loading).toBe(false);
		expect(result.current.error).toBeNull();
		expect(smartFetch).toHaveBeenCalledWith('/data/assessment/older.json', { responseType: 'json' });
	});

	it('loads a manually selected file', async () => {
		smartFetch.mockResolvedValueOnce({ name: 'first' }).mockResolvedValueOnce({ name: 'second' });
		const files = ['first.json', 'second.json'];
		const { result } = renderHook(() => useAdminFileData<{ name: string }>({
			files,
			publicPath: '/data/proposal',
		}));

		await waitFor(() => expect(result.current.data).toEqual({ name: 'first' }));
		act(() => result.current.setSelectedFile('first.json'));
		await waitFor(() => expect(result.current.data).toEqual({ name: 'second' }));

		expect(result.current.selectedFile).toBe('first.json');
		expect(smartFetch).toHaveBeenLastCalledWith('/data/proposal/first.json', { responseType: 'json' });
	});

	it('clears an invalid selection when the available files change', async () => {
		smartFetch.mockResolvedValue({ name: 'only-file' });
		const { result, rerender: rerenderHook } = renderHook(
			({ files }: { files: string[] }) => useAdminFileData<{ name: string }>({ files, publicPath: '/data/assessment' }),
			{ initialProps: { files: ['first.json', 'second.json'] } },
		);

		await waitFor(() => expect(result.current.selectedFile).toBe('second.json'));
		act(() => result.current.setSelectedFile('first.json'));
		rerenderHook({ files: ['replacement.json'] });
		await waitFor(() => expect(result.current.selectedFile).toBe('replacement.json'));
	});

	it('returns an empty state without fetching when no files are available', async () => {
		const { result } = renderHook(() => useAdminFileData({ files: [], publicPath: '/data/empty' }));

		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(result.current.files).toEqual([]);
		expect(result.current.selectedFile).toBeNull();
		expect(result.current.data).toBeNull();
		expect(result.current.error).toBeNull();
		expect(smartFetch).not.toHaveBeenCalled();
	});

	it('returns the fetch error and clears stale data', async () => {
		smartFetch.mockRejectedValue(new Error('File unavailable'));
		const files = ['missing.json'];
		const { result } = renderHook(() => useAdminFileData({ files, publicPath: '/data/errors' }));

		await waitFor(() => expect(result.current.error).toBe('File unavailable'));

		expect(result.current.data).toBeNull();
		expect(result.current.loading).toBe(false);
	});

	it('ignores a result after the hook is unmounted', async () => {
		let resolveRequest: (value: unknown) => void = () => undefined;
		const pendingRequest = new Promise((resolve) => { resolveRequest = resolve; });
		smartFetch.mockReturnValue(pendingRequest);
		const { result, unmount } = renderHook(() => useAdminFileData({ files: ['pending.json'], publicPath: '/data/pending' }));

		await waitFor(() => expect(smartFetch).toHaveBeenCalledOnce());
		unmount();
		resolveRequest({ ignored: true });
		await pendingRequest;

		expect(result.current.data).toBeNull();
	});
});
