import { describe, it, expect } from 'vitest';
import { pixelatedEslintPlugin as plugin } from '../test/test-utils';

describe('ESLint Plugin Exports', () => {
  describe('Plugin Core Export', () => {
    it('exports default plugin object', () => {
      expect(plugin).toBeDefined();
      expect(typeof plugin).toBe('object');
    });

    it('exports new rules and exposes them in the recommended config (regression)', () => {
      const expected = ['validate-test-locations', 'no-process-env', 'no-debug-true', 'file-name-kebab-case', 'class-name-kebab-case', 'required-schemas'];
      for (const r of expected) {
        expect(plugin.rules && (plugin.rules as any)[r], `rule ${r} is exported`).toBeDefined();
        expect(plugin.configs, 'configs present').toBeDefined();
        expect(plugin.configs.recommended, 'recommended config present').toBeDefined();
        expect(plugin.configs.recommended.rules && ((plugin.configs.recommended.rules as any)[`pixelated/${r}`]), `recommended config includes pixelated/${r}`).toBeDefined();
      }
    });
  });

  describe('Plugin Rules', () => {
    it('has rules property', () => {
      expect(plugin.rules).toBeDefined();
      expect(typeof plugin.rules).toBe('object');
    });

    it('exports all core rules', () => {
      expect((plugin.rules as any)['validate-test-locations']).toBeDefined();
      expect((plugin.rules as any)['no-process-env']).toBeDefined();
      expect((plugin.rules as any)['no-debug-true']).toBeDefined();
      expect((plugin.rules as any)['file-name-kebab-case']).toBeDefined();
      expect((plugin.rules as any)['class-name-kebab-case']).toBeDefined();
    });

    it('all rules are objects', () => {
      const ruleNames = ['validate-test-locations', 'no-process-env', 'no-debug-true', 'file-name-kebab-case', 'class-name-kebab-case'];
      for (const ruleName of ruleNames) {
        const rule = (plugin.rules as any)[ruleName];
        expect(typeof rule).toBe('object');
      }
    });
  });

  describe('Recommended Config', () => {
    it('has recommended config', () => {
      expect(plugin.configs?.recommended).toBeDefined();
    });

    it('recommended config has rules', () => {
      expect(plugin.configs.recommended.rules).toBeDefined();
    });

    it('recommended config includes all pixelated rules', () => {
      const rules = plugin.configs.recommended.rules || {};
      expect(Object.keys(rules)).toContain('pixelated/validate-test-locations');
      expect(Object.keys(rules)).toContain('pixelated/no-process-env');
      expect(Object.keys(rules)).toContain('pixelated/no-debug-true');
      expect(Object.keys(rules)).toContain('pixelated/file-name-kebab-case');
      expect(Object.keys(rules)).toContain('pixelated/class-name-kebab-case');
    });
  });

  describe('no-process-env Rule Configuration', () => {
    it('no-process-env rule is configured in recommended', () => {
      const procCfg = ((plugin.configs && plugin.configs.recommended && (plugin.configs.recommended.rules as any)['pixelated/no-process-env']) as any);
      expect(procCfg).toBeDefined();
    });

    it('no-process-env has allowed configuration', () => {
      const procCfg = ((plugin.configs && plugin.configs.recommended && (plugin.configs.recommended.rules as any)['pixelated/no-process-env']) as any);
      const procCfgAny = procCfg as any;
      expect(Array.isArray(procCfgAny[1].allowed)).toBe(true);
    });

    it('no-process-env allowed list includes PIXELATED_CONFIG_KEY', () => {
      const procCfg = ((plugin.configs && plugin.configs.recommended && (plugin.configs.recommended.rules as any)['pixelated/no-process-env']) as any);
      const procCfgAny = procCfg as any;
      expect(procCfgAny[1].allowed).toEqual(expect.arrayContaining(['PIXELATED_CONFIG_KEY']));
    });

    it('no-process-env allowed list includes PUPPETEER_EXECUTABLE_PATH', () => {
      const procCfg = ((plugin.configs && plugin.configs.recommended && (plugin.configs.recommended.rules as any)['pixelated/no-process-env']) as any);
      const procCfgAny = procCfg as any;
      expect(procCfgAny[1].allowed).toEqual(expect.arrayContaining(['PUPPETEER_EXECUTABLE_PATH']));
    });

    it('no-process-env has canonical allowlist (regression)', () => {
      const procCfg = ((plugin.configs && plugin.configs.recommended && (plugin.configs.recommended.rules as any)['pixelated/no-process-env']) as any);
      expect(procCfg).toBeDefined();
      const procCfgAny = procCfg as any;
      expect(Array.isArray(procCfgAny[1].allowed)).toBe(true);
      expect(procCfgAny[1].allowed).toEqual(expect.arrayContaining(['PIXELATED_CONFIG_KEY', 'PUPPETEER_EXECUTABLE_PATH']));
    });
  });
});
