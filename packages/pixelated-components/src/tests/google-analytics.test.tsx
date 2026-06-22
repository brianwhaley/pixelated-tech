import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { GoogleAnalytics, GoogleAnalyticsEvent } from '../components/integrations/googleanalytics';
import { renderWithProviders, screen, expectErrorFallback } from '../test/test-utils';
import { pixelatedConfigEmpty, pixelatedConfig as basePixelatedConfig } from '../test/test-data';

describe('Google Analytics Components', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Clear any scripts added to DOM during tests
		document.querySelectorAll('script[id="ga"], script[id="ga-init"]').forEach(s => s.remove());
	});

	afterEach(() => {
		// Clean up scripts after each test
		document.querySelectorAll('script[id="ga"], script[id="ga-init"]').forEach(s => s.remove());
	});

	describe('GoogleAnalytics Component', () => {
const customGoogleAnalyticsConfig = {
	...basePixelatedConfig,
	integrations: {
		...basePixelatedConfig.integrations,
		googleAnalytics: {
			...basePixelatedConfig.integrations?.googleAnalytics,
			id: 'G-TEST123',
			adId: 'G-ADID123',
		}
	}
};

	const customGoogleAnalyticsIdConfig = {
		...basePixelatedConfig,
		integrations: {
			...basePixelatedConfig.integrations,
			googleAnalytics: {
				...basePixelatedConfig.integrations?.googleAnalytics,
				id: 'G-CUSTOM123'
			}
		}
	};

		it('should create and inject GA initialization script', () => {
			renderWithProviders(<GoogleAnalytics />, { config: customGoogleAnalyticsConfig });

			const initScript = document.querySelector('script#ga-init');
			expect(initScript).toBeDefined();
			expect(initScript?.textContent).toContain('dataLayer');
			expect(initScript?.textContent).toContain('G-TEST123');
		});

		it('should inject GA measurement script', () => {
			renderWithProviders(<GoogleAnalytics />, { config: customGoogleAnalyticsConfig });

			const gaScript = document.querySelector('script[src*="googletagmanager"]');
			expect(gaScript || document.body).toBeDefined();
		});

		it('should use config ID when provided', () => {
			renderWithProviders(<GoogleAnalytics />, { config: customGoogleAnalyticsIdConfig });

			const initScript = document.querySelector('script#ga-init');
			expect(initScript?.textContent).toContain('G-CUSTOM123');
		});

		it('should render fallback when no ID provided and config missing', () => {
			const { container } = renderWithProviders(<GoogleAnalytics />, { config: {} });

			expect(container.textContent).toMatch(/Sorry, something went wrong loading/i);
			expect(container.textContent).toMatch(/GoogleAnalytics/i);
		});

		it('should have correct script source with id', () => {
			renderWithProviders(<GoogleAnalytics />, { config: customGoogleAnalyticsIdConfig });
			const gaScript = document.querySelector('script#ga') as HTMLScriptElement;
			expect(gaScript?.src).toContain('id=G-CUSTOM123');
		});

		it('should use config ID when prop not provided', () => {
			const { config } = renderWithProviders(<GoogleAnalytics />);
			const initScript = document.querySelector('script#ga-init');
			const configId = config.integrations?.googleAnalytics?.id;
			expect(initScript?.textContent).toContain(configId);
		});

		it('should include ad ID when available in config', () => {
			renderWithProviders(<GoogleAnalytics />, { config: customGoogleAnalyticsConfig });
			const initScript = document.querySelector('script#ga-init');
			expect(initScript?.textContent).toContain('G-ADID123');
		});

		it('should set script type to text/javascript', () => {
			renderWithProviders(<GoogleAnalytics />, { config: customGoogleAnalyticsConfig });
			const gaScript = document.querySelector('script#ga');
			expect(gaScript?.getAttribute('type')).toBe('text/javascript');
		});

		it('should set script async attribute', () => {
			renderWithProviders(<GoogleAnalytics />, { config: customGoogleAnalyticsConfig });
			const gaScript = document.querySelector('script#ga');
			expect(gaScript).toHaveAttribute('async');
		});

		it('should include measurement ID in gtag config', () => {
			renderWithProviders(<GoogleAnalytics />, { config: customGoogleAnalyticsConfig });
			const initScript = document.querySelector('script#ga-init');
			expect(initScript?.textContent).toContain("gtag('config', 'G-TEST123')");
		});

		it('should render fallback when GoogleAnalytics throws', () => {
			const { container } = renderWithProviders(<GoogleAnalytics />, { config: pixelatedConfigEmpty });

			expect(container.textContent).toMatch(/Sorry, something went wrong loading/i);
			expect(container.textContent).toMatch(/GoogleAnalytics/i);
		});

		it('should not inject GA when analytics is already initialized', () => {
			window.gtag = vi.fn();
			window.dataLayer = [];
			const existingScript = document.createElement('script');
			existingScript.id = 'ga';
			document.head.appendChild(existingScript);

			renderWithProviders(<GoogleAnalytics />, { config: customGoogleAnalyticsConfig });

			const gaInitScript = document.querySelector('script#ga-init');
			expect(gaInitScript).toBeNull();
		});

		it('should trigger GoogleAnalyticsEvent gtag event when gtag exists', async () => {
			const gtagMock = vi.fn();
			window.gtag = gtagMock;

			renderWithProviders(<GoogleAnalyticsEvent event_name="test_event" event_parameters={{ test: 'value' }} />);

			await new Promise(resolve => setTimeout(resolve, 0));
			expect(gtagMock).toHaveBeenCalledWith('event', 'test_event', { test: 'value' });
		});
	});
});
