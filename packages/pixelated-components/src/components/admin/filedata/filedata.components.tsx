'use client';

import { useEffect, useState } from 'react';
import { smartFetch } from '../../foundation/smartfetch';
import { sortAdminDataFiles } from './filedata.functions';

export interface UseAdminFileDataOptions {
	files: string[];
	publicPath: string;
}

export function useAdminFileData<T = unknown>({ files: availableFiles, publicPath }: UseAdminFileDataOptions) {
	const files = sortAdminDataFiles(availableFiles);
	const [selectedFile, setSelectedFile] = useState<string | null>(null);
	const [data, setData] = useState<T | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setError(null);
		setSelectedFile((currentFile) => currentFile && files.includes(currentFile) ? currentFile : files[0] ?? null);
	}, [availableFiles]);

	useEffect(() => {
		if (!selectedFile) {
			setData(null);
			setLoading(false);
			return;
		}

		let active = true;
		const loadData = async () => {
			try {
				setLoading(true);
				setError(null);
				const result = await smartFetch(`${publicPath}/${encodeURIComponent(selectedFile)}`, { responseType: 'json' });
				if (active) setData(result as T);
			} catch (err) {
				if (!active) return;
				setData(null);
				setError(err instanceof Error ? err.message : 'Failed to load file');
			} finally {
				if (active) setLoading(false);
			}
		};

		loadData();
		return () => { active = false; };
	}, [publicPath, selectedFile]);

	return { files, selectedFile, setSelectedFile, data, loading, error };
}
