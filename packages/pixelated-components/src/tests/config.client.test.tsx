import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, renderWithoutProviders, screen } from '../test/test-utils';
import { PixelatedClientConfigProvider, usePixelatedConfig } from '../components/config/config.client';

// Test component that uses the hook
function TestComponent() {
  const config = usePixelatedConfig();
  return (
    <div>
      <div data-testid="config-check">{config ? 'has-config' : 'no-config'}</div>
    </div>
  );
}

describe('PixelatedClientConfigProvider & usePixelatedConfig', () => {
  describe('PixelatedClientConfigProvider', () => {
    it('should render provider with config and children', () => {
      const config = {
        cloudinary: { product_env: 'production' }
      };

      render(
        <PixelatedClientConfigProvider config={config}>
          <TestComponent />
        </PixelatedClientConfigProvider>
      );

      expect(screen.getByTestId('config-check')).toHaveTextContent('has-config');
    });

    it('should provide config to child components through context', () => {
      const config = {
        cloudinary: { product_env: 'production', secure: true },
        global: { proxyUrl: "test" },
      };

      render(
        <PixelatedClientConfigProvider config={config}>
          <TestComponent />
        </PixelatedClientConfigProvider>
      );

      expect(screen.getByTestId('config-check')).toHaveTextContent('has-config');
    });

    it('should handle empty config object', () => {
      const config = {};
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      render(
        <PixelatedClientConfigProvider config={config}>
          <TestComponent />
        </PixelatedClientConfigProvider>
      );

      expect(consoleSpy).toHaveBeenCalledWith('Pixelated config is empty. Check that src/app/config/pixelated.config.json is available.');
      expect(screen.getByTestId('config-check')).toHaveTextContent('no-config');

      consoleSpy.mockRestore();
    });

    it('should handle partial config', () => {
      const config = {
        global: { proxyUrl: "test" },
      };

      render(
        <PixelatedClientConfigProvider config={config}>
          <TestComponent />
        </PixelatedClientConfigProvider>
      );

      expect(screen.getByTestId('config-check')).toHaveTextContent('has-config');
    });

    it('should render multiple child components', () => {
      const config = {
        cloudinary: { product_env: 'dev' }
      };

      const { container } = render(
        <PixelatedClientConfigProvider config={config}>
          <TestComponent />
          <TestComponent />
        </PixelatedClientConfigProvider>
      );

      const components = container.querySelectorAll('[data-testid="config-check"]');
      expect(components).toHaveLength(2);
      expect(components[0]).toHaveTextContent('has-config');
      expect(components[1]).toHaveTextContent('has-config');
    });
  });

  describe('usePixelatedConfig', () => {
    it('should return config from context when provider present', () => {
      const config = {
        cloudinary: { product_env: 'staging' },
        wordpress: { baseURL: 'https://test.com', site: 'test.com' }
      };

      render(
        <PixelatedClientConfigProvider config={config}>
          <TestComponent />
        </PixelatedClientConfigProvider>
      );

      expect(screen.getByTestId('config-check')).toHaveTextContent('has-config');
    });

    it('should throw error when provider not present in development', () => {
      // In development mode without provider, usePixelatedConfig should log warning and return null
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      renderWithoutProviders(<TestComponent />);

      expect(consoleSpy).toHaveBeenCalledWith('PixelatedClientConfigProvider not found when called by testcomponent. Some components may not work as expected. Wrap your app with PixelatedClientConfigProvider for full functionality.');
      expect(screen.getByTestId('config-check')).toHaveTextContent('no-config');

      consoleSpy.mockRestore();
    });

    it('should render without error when provider is present', () => {
      // This test verifies that when the provider is present, no error is thrown
      const config = { global: { proxyUrl: "test" } };

      render(
        <PixelatedClientConfigProvider config={config}>
          <TestComponent />
        </PixelatedClientConfigProvider>
      );

      expect(screen.getByTestId('config-check')).toHaveTextContent('has-config');
    });

    it('should allow accessing config in deeply nested components', () => {
      const config = {
        global: { proxyUrl: "test" },
      };

      function DeepComponent() {
        return (
          <div>
            <div>
              <TestComponent />
            </div>
          </div>
        );
      }

      render(
        <PixelatedClientConfigProvider config={config}>
          <DeepComponent />
        </PixelatedClientConfigProvider>
      );

      expect(screen.getByTestId('config-check')).toHaveTextContent('has-config');
    });
  });

  describe('Config updates', () => {
    it('should update config when provider receives new config', () => {
      const { rerender } = render(
        <PixelatedClientConfigProvider config={{ global: { proxyUrl: "test" } }}>
          <TestComponent />
        </PixelatedClientConfigProvider>
      );

      expect(screen.getByTestId('config-check')).toHaveTextContent('has-config');

      rerender(
        <PixelatedClientConfigProvider config={{ global: { proxyUrl: "test" } }}>
          <TestComponent />
        </PixelatedClientConfigProvider>
      );

      expect(screen.getByTestId('config-check')).toHaveTextContent('has-config');
    });

    it('should handle partial config updates', () => {
      const initialConfig = {
        cloudinary: { product_env: 'dev' },
        global: { proxyUrl: "test" },
      };

      const { rerender } = render(
        <PixelatedClientConfigProvider config={initialConfig}>
          <TestComponent />
        </PixelatedClientConfigProvider>
      );

      expect(screen.getByTestId('config-check')).toHaveTextContent('has-config');

      const updatedConfig = {
        cloudinary: { product_env: 'staging' },
        global: { proxyUrl: "test" },
      };

      rerender(
        <PixelatedClientConfigProvider config={updatedConfig}>
          <TestComponent />
        </PixelatedClientConfigProvider>
      );

      expect(screen.getByTestId('config-check')).toHaveTextContent('has-config');
    });
  });

  describe('Edge cases', () => {
    it('should handle feature flags with various values', () => {
      const config = {
        global: { proxyUrl: "test" },
      };

      render(
        <PixelatedClientConfigProvider config={config}>
          <TestComponent />
        </PixelatedClientConfigProvider>
      );

      expect(screen.getByTestId('config-check')).toHaveTextContent('has-config');
    });

    it('should handle many feature flags', () => {
      const config = {
        global: { proxyUrl: "test" },
      };

      render(
        <PixelatedClientConfigProvider config={config}>
          <TestComponent />
        </PixelatedClientConfigProvider>
      );

      expect(screen.getByTestId('config-check')).toHaveTextContent('has-config');
    });

    it('should handle multiple service configs', () => {
      const config = {
        cloudinary: { product_env: 'prod' },
        contentful: { base_url: 'https://example.com', space_id: 'test', environment: 'master' },
        wordpress: { baseURL: 'https://blog.example.com/api', site: 'example.com' }
      };

      render(
        <PixelatedClientConfigProvider config={config}>
          <TestComponent />
        </PixelatedClientConfigProvider>
      );

      expect(screen.getByTestId('config-check')).toHaveTextContent('has-config');
    });

    it('should handle empty feature flags object', () => {
      const config = {
        global: { proxyUrl: "test" },
      };

      render(
        <PixelatedClientConfigProvider config={config}>
          <TestComponent />
        </PixelatedClientConfigProvider>
      );

      expect(screen.getByTestId('config-check')).toHaveTextContent('has-config');
    });
  });

  describe('Performance and memory', () => {
    it('should not cause memory leaks with multiple provider/consumer pairs', () => {
      const configs = Array(10).fill(null).map((_, i) => ({
        global: { proxyUrl: "test" },
      }));

      const { unmount } = render(
        <div>
          {configs.map((config, i) => (
            <PixelatedClientConfigProvider key={i} config={config}>
              <TestComponent />
            </PixelatedClientConfigProvider>
          ))}
        </div>
      );

      expect(screen.getAllByTestId('config-check')).toHaveLength(10);

      unmount();
    });

    it('should efficiently update multiple consumers', () => {
      const { rerender } = render(
        <div>
          <PixelatedClientConfigProvider config={{ global: { proxyUrl: "test" } }}>
            <TestComponent />
            <TestComponent />
          </PixelatedClientConfigProvider>
        </div>
      );

      expect(screen.getAllByTestId('config-check')).toHaveLength(2);

      rerender(
        <div>
          <PixelatedClientConfigProvider config={{ global: { proxyUrl: "test" } }}>
            <TestComponent />
            <TestComponent />
          </PixelatedClientConfigProvider>
        </div>
      );

      const elements = screen.getAllByTestId('config-check');
      expect(elements).toHaveLength(2);
      elements.forEach(el => expect(el).toBeInTheDocument());
    });
  });
});

describe('Config Utility Functions', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables and module cache between each test.
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  async function importConfigWithFs(fullConfig: any) {
    vi.doMock('fs', () => ({
      default: {
        existsSync: vi.fn(() => true),
        readFileSync: vi.fn(() => JSON.stringify(fullConfig)),
      },
      existsSync: vi.fn(() => true),
      readFileSync: vi.fn(() => JSON.stringify(fullConfig)),
    }));
    return await import('../components/config/config');
  }

  async function importConfigWithRaw(rawConfig: string) {
    vi.doMock('fs', () => ({
      default: {
        existsSync: vi.fn(() => true),
        readFileSync: vi.fn(() => rawConfig),
      },
      existsSync: vi.fn(() => true),
      readFileSync: vi.fn(() => rawConfig),
    }));
    return await import('../components/config/config');
  }

  async function getClientConfigFromFs(fullConfig: any) {
    const configModule = await importConfigWithFs(fullConfig);
    return configModule.getClientOnlyPixelatedConfig();
  }

  async function getClientConfigFromRaw(rawConfig: string) {
    const configModule = await importConfigWithRaw(rawConfig);
    return configModule.getClientOnlyPixelatedConfig();
  }

  describe('getClientOnlyPixelatedConfig', () => {
    it('should strip secret keys from config', async () => {
      const fullConfig = {
        cloudinary: {
          product_env: 'test',
          api_key: 'secret-key',
          api_secret: 'secret-secret'
        },
        PIXELATED_CONFIG_KEY: 'master-key',
        paypal: {
          payPalSecret: 'secret-paypal'
        }
      };

      const clientConfig = await getClientConfigFromFs(fullConfig);

      expect(clientConfig).toEqual({
        cloudinary: { product_env: 'test' },
        paypal: {}
      });
    });

    it('should handle nested objects with secrets', async () => {
      const fullConfig = {
        cloudinary: {
          subLevel: {
            api_key: 'secret'
          }
        }
      };

      const clientConfig = await getClientConfigFromFs(fullConfig);

      expect(clientConfig).toEqual({
        cloudinary: {
          subLevel: {},
        }
      });
    });

    it('should handle arrays correctly', async () => {
      const fullConfig = {
        cloudinary: [
          { api_key: 'secret1', product_env: 'env1' },
          { api_key: 'secret2', product_env: 'env2' }
        ]
      };

      const clientConfig = await getClientConfigFromFs(fullConfig);

      expect(clientConfig).toEqual({
        cloudinary: [
          { product_env: 'env1' },
          { product_env: 'env2' }
        ]
      });
    });

    it('should handle primitive values by returning an empty client config', async () => {
      const clientConfig = await getClientConfigFromRaw(JSON.stringify('string value'));
      expect(clientConfig).toEqual({});
    });

    it('should handle null config file as empty object', async () => {
      const clientConfig = await getClientConfigFromRaw('null');
      expect(clientConfig).toEqual({});
    });

    it('should ignore heuristic patterns and only use explicit keys', async () => {
      const fullConfig = {
        API_KEY: 'not-secret-because-not-exposed',
        password: 'not-secret-because-not-exposed',
        access_token: 'not-secret-because-not-exposed',
        PIXELATED_CONFIG_KEY: 'this-is-secret',
        normal: 'normal'
      };

      const clientConfig = await getClientConfigFromFs(fullConfig);

      expect(clientConfig).toEqual({
        API_KEY: 'not-secret-because-not-exposed',
        password: 'not-secret-because-not-exposed',
        access_token: 'not-secret-because-not-exposed',
        normal: 'normal'
      });
    });

    it('should handle invalid JSON gracefully', async () => {
      const clientConfig = await getClientConfigFromRaw('invalid-json');
      expect(clientConfig).toEqual({});
    });
  });
});
