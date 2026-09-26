/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { mockSitesConfig } from '../test/test-data';
import {
  loadSitesConfig,
  getSitesConfigDomains,
  getSiteConfig,
  type SiteConfig
} from '../components/admin/sites/sites.integration';

// Mock fs module
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn()
  }
}));

// Mock path module
vi.mock('path', () => ({
  default: {
    join: vi.fn(),
    dirname: vi.fn()
  }
}));

const mockFs = fs as any;
const mockPath = path as any;

describe('Sites Integration', () => {
  const mockSites: SiteConfig[] = mockSitesConfig as any;

  const mockSitesJson = JSON.stringify(mockSites, null, 2);
  const defaultConfigPath = '/mock/sites.json';

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock path.join to return our controlled path
    mockPath.join.mockReturnValue(defaultConfigPath);
    // Default fs mocks
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(mockSitesJson);
  });

  describe('loadSitesConfig', () => {
    it('should load sites config from default path', async () => {
      const result = await loadSitesConfig();

      expect(mockPath.join).toHaveBeenCalledWith(process.cwd(), 'src/app/data/sites.json');
      expect(mockFs.readFileSync).toHaveBeenCalledWith(defaultConfigPath, 'utf8');
      expect(result).toEqual(mockSites);
    });

    it('should load sites config from custom path', async () => {
      const customPath = '/custom/sites.json';
      const result = await loadSitesConfig(customPath);

      expect(mockFs.readFileSync).toHaveBeenCalledWith(customPath, 'utf8');
      expect(result).toEqual(mockSites);
    });

    it('should throw error when config file does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);

      await expect(loadSitesConfig()).rejects.toThrow('Failed to load sites configuration');
    });

    it('should throw error when JSON is invalid', async () => {
      mockFs.readFileSync.mockReturnValue('invalid json');

      await expect(loadSitesConfig()).rejects.toThrow('Failed to load sites configuration');
    });
  });

  describe('getSitesConfigDomains', () => {
    it('returns normalized hostnames and ignores invalid URLs', () => {
      const result = getSitesConfigDomains([
        { name: 'one', url: 'https://www.Example.com/contact' },
        { name: 'two', url: 'example.org' },
        { name: 'three', url: 'not a valid url' },
        { name: 'four' },
      ]);

      expect(result).toEqual(['example.com', 'example.org']);
    });
  });

  describe('getSiteConfig', () => {
    it('should return site config by name', async () => {
      const result = await getSiteConfig('test-site-1');

      expect(result).toEqual(mockSites[0]);
    });

    it('should return null for non-existent site', async () => {
      const result = await getSiteConfig('non-existent-site');

      expect(result).toBeNull();
    });
  });

});