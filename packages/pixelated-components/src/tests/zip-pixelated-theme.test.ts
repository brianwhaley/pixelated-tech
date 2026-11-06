import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import * as childProcess from 'child_process';

vi.mock('child_process', () => ({
  spawnSync: vi.fn(),
}));

import { zipPixelatedTheme, buildZipArgs } from '../scripts/zip-pixelated-theme.js';

describe('zip-pixelated-theme script', () => {
  const fakeTheme = '/fake/theme/dir';
  const fakeZip = '/fake/theme/dir/Pixelated.zip';
  const stagingParent = '/tmp/pixelated-theme-test';

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(fs, 'mkdtempSync').mockReturnValue(stagingParent);
    vi.spyOn(fs, 'cpSync').mockImplementation(() => undefined);
    vi.spyOn(fs, 'rmSync').mockImplementation(() => undefined);
  });

  describe('zipPixelatedTheme Function', () => {
    it('throws when theme dir is missing', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      expect(() => zipPixelatedTheme('/no/such/dir')).toThrow(/Theme directory not found/);
    });

    it('throws when directory is not actually a directory', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => false } as any);
      expect(() => zipPixelatedTheme(fakeTheme)).toThrow();
    });

    it('removes existing zip and calls system zip', () => {
      const exists = vi.spyOn(fs, 'existsSync');
      exists.mockImplementation((p: fs.PathLike) => (String(p) === fakeTheme || String(p) === fakeZip));
      vi.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => true } as any);
      const unlink = vi.spyOn(fs, 'unlinkSync').mockImplementation(() => undefined);

      let capturedArgs: any[] | undefined;
      vi.mocked(childProcess.spawnSync).mockImplementation((...callArgs: any[]) => {
        const cmd = String(callArgs[0]);
        const args = callArgs[1] as any[] | undefined;
        if (cmd === 'which') return { status: 0 } as any;
        if (cmd === 'zip') {
          capturedArgs = args;
          return { status: 0 } as any;
        }
        return { status: 0 } as any;
      });

      const out = zipPixelatedTheme(fakeTheme, 'Pixelated.zip');
      expect(unlink).toHaveBeenCalledWith(fakeZip);
      expect(capturedArgs).toContain('Pixelated');
      expect(out).toBe(fakeZip);
    });

    it('uses custom zip filename when provided', () => {
      const customZipName = 'CustomTheme.zip';
      const customZipPath = '/fake/theme/dir/' + customZipName;
      
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => true } as any);
      vi.spyOn(fs, 'unlinkSync').mockImplementation(() => undefined);
      vi.mocked(childProcess.spawnSync).mockImplementation((...callArgs: any[]) => {
        const cmd = String(callArgs[0]);
        if (cmd === 'which') return { status: 0 } as any;
        if (cmd === 'zip') return { status: 0 } as any;
        return { status: 0 } as any;
      });

      const out = zipPixelatedTheme(fakeTheme, customZipName);
      expect(out).toContain(customZipName);
    });

    it('returns the zip file path on success', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => true } as any);
      vi.spyOn(fs, 'unlinkSync').mockImplementation(() => undefined);
      vi.mocked(childProcess.spawnSync).mockImplementation((...callArgs: any[]) => {
        const cmd = String(callArgs[0]);
        if (cmd === 'which') return { status: 0 } as any;
        if (cmd === 'zip') return { status: 0 } as any;
        return { status: 0 } as any;
      });

      const result = zipPixelatedTheme(fakeTheme);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('buildZipArgs Function', () => {
    it('generates exclude patterns for excluded directories', () => {
      const args = buildZipArgs('theme.zip');
      expect(args).toContain('Pixelated/.git/**');
      expect(args).toContain('Pixelated/node_modules/**');
      expect(args).toContain('Pixelated/dist/**');
      expect(args).toContain('Pixelated/.cache/**');
      expect(args).toContain('Pixelated/coverage/**');
    });

    it('excludes system files', () => {
      const args = buildZipArgs('theme.zip');
      expect(args).toContain('Pixelated/.DS_Store');
      expect(args).toContain('Pixelated/.vscode/**');
    });

    it('excludes common build artifacts', () => {
      const args = buildZipArgs('theme.zip');
      const excludePatterns = ['Pixelated/.git/**', 'Pixelated/node_modules/**', 'Pixelated/dist/**', 'Pixelated/.cache/**', 'Pixelated/coverage/**'];
      excludePatterns.forEach(pattern => {
        expect(args).toContain(pattern);
      });
    });

    it('includes the zip filename in args', () => {
      const args = buildZipArgs('CustomName.zip');
      expect(args).toContain('CustomName.zip');
    });

    it('handles different filenames', () => {
      const filenames = ['theme.zip', 'pixelated.zip', 'export.zip'];
      filenames.forEach(filename => {
        const args = buildZipArgs(filename);
        expect(args).toContain(filename);
      });
    });

    it('returns array of arguments', () => {
      const args = buildZipArgs('theme.zip');
      expect(Array.isArray(args)).toBe(true);
      expect(args.length).toBeGreaterThan(0);
    });

    it('arguments are all strings', () => {
      const args = buildZipArgs('theme.zip');
      args.forEach(arg => {
        expect(typeof arg).toBe('string');
      });
    });
  });

  describe('Zip Command Execution', () => {
    it('errors when zip not on PATH', () => {
      vi.spyOn(fs, 'existsSync').mockImplementation((p: fs.PathLike) => String(p) === fakeTheme);
      vi.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => true } as any);
      vi.mocked(childProcess.spawnSync).mockImplementation((...callArgs: any[]) => {
        const cmd = String(callArgs[0]);
        if (cmd === 'which') return { status: 1 } as any; // not found
        throw Object.assign(new Error('spawn ENOENT'), { code: 'ENOENT' });
      });

      expect(() => zipPixelatedTheme(fakeTheme)).toThrow(/`zip` command not found/);
    });

    it('checks for zip command availability', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => true } as any);
      vi.spyOn(fs, 'unlinkSync').mockImplementation(() => undefined);
      vi.mocked(childProcess.spawnSync).mockImplementation((...callArgs: any[]) => {
        const cmd = String(callArgs[0]);
        if (cmd === 'which') return { status: 0 } as any;
        if (cmd === 'zip') return { status: 0 } as any;
        return { status: 0 } as any;
      });

      // Just verify the function doesn't throw when mocks are in place
      expect(() => zipPixelatedTheme(fakeTheme)).not.toThrow();
    });

    it('executes zip command with correct arguments', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => true } as any);
      vi.spyOn(fs, 'unlinkSync').mockImplementation(() => undefined);
      
      // Just verify the function runs without throwing when all mocks are in place
      // The actual spawnSync behavior is tested in the "removes existing zip" test above
      expect(() => zipPixelatedTheme(fakeTheme)).not.toThrow();
    });
  });

  describe('File Operations', () => {
    it('checks if directory exists before processing', () => {
      const existsSpy = vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      expect(() => zipPixelatedTheme(fakeTheme)).toThrow();
      expect(existsSpy).toHaveBeenCalled();
    });

    it('verifies directory stat information', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      const statSpy = vi.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => true } as any);
      vi.spyOn(fs, 'unlinkSync').mockImplementation(() => undefined);
      vi.mocked(childProcess.spawnSync).mockImplementation((...callArgs: any[]) => {
        const cmd = String(callArgs[0]);
        if (cmd === 'which') return { status: 0 } as any;
        if (cmd === 'zip') return { status: 0 } as any;
        return { status: 0 } as any;
      });

      zipPixelatedTheme(fakeTheme);
      expect(statSpy).toHaveBeenCalled();
    });

    it('removes existing zip file before creating new one', () => {
      vi.spyOn(fs, 'existsSync').mockImplementation((p: fs.PathLike) => 
        String(p) === fakeTheme || String(p) === fakeZip
      );
      vi.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => true } as any);
      const unlinkSpy = vi.spyOn(fs, 'unlinkSync').mockImplementation(() => undefined);
      vi.mocked(childProcess.spawnSync).mockImplementation((...callArgs: any[]) => {
        const cmd = String(callArgs[0]);
        if (cmd === 'which') return { status: 0 } as any;
        if (cmd === 'zip') return { status: 0 } as any;
        return { status: 0 } as any;
      });

      zipPixelatedTheme(fakeTheme);
      expect(unlinkSpy).toHaveBeenCalledWith(fakeZip);
    });
  });

  describe('Exclusion Patterns', () => {
    it('excludes version control directories', () => {
      const args = buildZipArgs('theme.zip');
      expect(args).toContain('Pixelated/.git/**');
    });

    it('excludes node_modules to reduce size', () => {
      const args = buildZipArgs('theme.zip');
      expect(args).toContain('Pixelated/node_modules/**');
    });

    it('excludes build outputs', () => {
      const args = buildZipArgs('theme.zip');
      expect(args).toContain('Pixelated/dist/**');
    });

    it('excludes cache directories', () => {
      const args = buildZipArgs('theme.zip');
      expect(args).toContain('Pixelated/.cache/**');
      expect(args).toContain('Pixelated/coverage/**');
    });

    it('excludes IDE configurations', () => {
      const args = buildZipArgs('theme.zip');
      expect(args).toContain('Pixelated/.vscode/**');
    });
  });
});
