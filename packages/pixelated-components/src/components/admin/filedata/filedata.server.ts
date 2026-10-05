import { promises as fs } from 'fs';
import path from 'path';
import { isAdminDataFile, sortAdminDataFiles } from './filedata.functions';

export async function getAdminDataFiles(directoryPath: string): Promise<string[]> {
	const entries = await fs.readdir(directoryPath, { withFileTypes: true });
	const files = entries
		.filter((entry) => entry.isFile() && isAdminDataFile(entry.name))
		.map((entry) => entry.name);

	return sortAdminDataFiles(files);
}

export function getAdminDataDirectory(rootPath: string, directory: string): string {
	return path.join(rootPath, 'public', 'data', directory);
}
