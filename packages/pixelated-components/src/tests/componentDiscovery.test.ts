import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { discoverComponentsFromLibrary } from '../components/admin/componentusage/componentDiscovery';

vi.mock('fs', () => {
	const mockFs = {
		existsSync: vi.fn(),
		readFileSync: vi.fn(),
	};
	return {
		default: mockFs,
		...mockFs
	};
});

describe('Component Discovery', () => {
	let cwdSpy: ReturnType<typeof vi.spyOn>;
	let existsSpy: ReturnType<typeof vi.fn>;
	let readSpy: ReturnType<typeof vi.fn>;
	let requireResolveSpy: ReturnType<typeof vi.spyOn> | null = null;

	beforeEach(() => {
		vi.clearAllMocks();
		cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue('/project');
		existsSpy = fs.existsSync as ReturnType<typeof vi.fn>;
		readSpy = fs.readFileSync as ReturnType<typeof vi.fn>;
		if ((require as any).resolve) {
			requireResolveSpy = vi.spyOn(require as any, 'resolve');
		}
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should export discoverComponentsFromLibrary function', () => {
		expect(typeof discoverComponentsFromLibrary).toBe('function');
	});

	it('should resolve components from available dist index files', async () => {
		existsSpy.mockImplementation((filePath: string) => {
			if (filePath.endsWith('/node_modules/@pixelated-tech/components')) {
				return true;
			}
			return filePath.endsWith('/dist/index.js') || filePath.endsWith('/dist/index.adminclient.js') || filePath.endsWith('/dist/index.adminserver.js');
		});

		readSpy.mockImplementation((filePath: string) => {
			if (filePath.endsWith('index.js')) {
				return "export * from './components/general/modal';\nexport * from './components/sitebuilder/form';";
			}
			if (filePath.endsWith('index.adminclient.js')) {
				return "export * from './components/admin/dashboard';";
			}
			if (filePath.endsWith('index.adminserver.js')) {
				return "export * from './components/admin/server';";
			}
			return '';
		});

		const components = await discoverComponentsFromLibrary();

		expect(components).toEqual(['admin/dashboard', 'admin/server', 'general/modal', 'sitebuilder/form']);
	});

	it('should resolve only index.js when admin client/server files are missing', async () => {
		existsSpy.mockImplementation((filePath: string) => {
			if (filePath.endsWith('/node_modules/@pixelated-tech/components')) {
				return true;
			}
			return filePath.endsWith('/dist/index.js');
		});

		readSpy.mockImplementation((filePath: string) => {
			if (filePath.endsWith('index.js')) {
				return "export * from './components/general/modal';";
			}
			return '';
		});

		const components = await discoverComponentsFromLibrary();

		expect(components).toEqual(['general/modal']);
	});

	it('should ignore invalid export lines and comments', async () => {
		existsSpy.mockReturnValue(true);
		readSpy.mockImplementation((filePath: string) => {
			return "// export * from './components/ignored';\nexport * from './components/general/modal';\nconst foo = 'bar';\nexport * from './components/admin/dashboard';";
		});

		const components = await discoverComponentsFromLibrary();

		expect(components).toEqual(['admin/dashboard', 'general/modal']);
	});

	it('should deduplicate duplicate export entries across index files', async () => {
		existsSpy.mockReturnValue(true);
		readSpy.mockImplementation((filePath: string) => {
			return "export * from './components/general/modal';";
		});

		const components = await discoverComponentsFromLibrary();

		expect(components).toEqual(['general/modal']);
	});

	it('should fallback to require.resolve when package path does not exist', async () => {
		existsSpy.mockImplementation((filePath: string) => {
			if (filePath.endsWith('/node_modules/@pixelated-tech/components')) {
				return false;
			}
			return true;
		});

		if (requireResolveSpy) {
			requireResolveSpy.mockReturnValue('/ROOT/node_modules/@pixelated-tech/components/package.json');
		}

		readSpy.mockImplementation((filePath: string) => {
			return "export * from './components/cms/form';";
		});

		const components = await discoverComponentsFromLibrary();

		expect(components).toEqual(['cms/form']);
	});

	it('should use require.resolve path when returned path does not start with /ROOT/', async () => {
		existsSpy.mockImplementation((filePath: string) => {
			if (filePath.endsWith('/node_modules/@pixelated-tech/components')) {
				return false;
			}
			return true;
		});

		if (requireResolveSpy) {
			requireResolveSpy.mockReturnValue('/tmp/node_modules/@pixelated-tech/components/package.json');
		}

		readSpy.mockImplementation((filePath: string) => {
			return "export * from './components/general/banner';";
		});

		const components = await discoverComponentsFromLibrary();

		expect(components).toEqual(['general/banner']);
	});

	it('should return empty array when discovery fails', async () => {
		existsSpy.mockImplementation(() => {
			throw new Error('Filesystem failure');
		});

		const components = await discoverComponentsFromLibrary();

		expect(Array.isArray(components)).toBe(true);
		expect(components).toHaveLength(0);
	});

	it('should fallback to relative path when cwd resolution throws', async () => {
		cwdSpy.mockImplementation(() => {
			throw new Error('cwd failure');
		});
		existsSpy.mockReturnValue(false);
		if (requireResolveSpy) {
			requireResolveSpy.mockImplementation(() => {
				throw new Error('resolve failure');
			});
		}

		const components = await discoverComponentsFromLibrary();

		expect(Array.isArray(components)).toBe(true);
		expect(components).toHaveLength(0);
	});

	it('should return an empty array when no exports are present', async () => {
		existsSpy.mockImplementation((filePath: string) => {
			if (filePath.endsWith('/node_modules/@pixelated-tech/components')) {
				return true;
			}
			return filePath.endsWith('/dist/index.js') || filePath.endsWith('/dist/index.adminclient.js') || filePath.endsWith('/dist/index.adminserver.js');
		});

		readSpy.mockReturnValue('// no exports here');

		const components = await discoverComponentsFromLibrary();

		expect(Array.isArray(components)).toBe(true);
		expect(components).toHaveLength(0);
	});
});
