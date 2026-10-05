export function sortAdminDataFiles(files: string[]): string[] {
	return [...files].sort((a, b) => b.localeCompare(a, undefined, { sensitivity: 'base' }));
}

export function isAdminDataFile(filename: string): boolean {
	return filename.endsWith('.json') &&
		filename !== 'manifest.json' &&
		!filename.endsWith('.bak.json') &&
		!filename.startsWith('.');
}
