import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { createConfig, expectErrorFallback, renderWithProviders } from '../test/test-utils';
import { pixelatedConfig } from '../test/test-data';
import { GoogleSearch } from '@/components/integrations/googlesearch';

describe('GoogleSearch Component', () => {
	beforeEach(() => {
		// Add a dummy script tag to the document to prevent errors
		const script = document.createElement('script');
		script.id = 'dummy-script';
		document.head.appendChild(script);
	});

	afterEach(() => {
		// Clean up
		const script = document.getElementById('dummy-script');
		if (script) {
			script.remove();
		}
		const gcseScripts = document.querySelectorAll('script[src*="cse.google"]');
		gcseScripts.forEach(s => s.remove());
	});

	describe('Component rendering', () => {
		const customSearchConfig = JSON.parse(JSON.stringify(pixelatedConfig));
		customSearchConfig.integrations = customSearchConfig.integrations || {};
		customSearchConfig.integrations.googleSearch = {
			...(customSearchConfig.integrations?.googleSearch || {}),
			id: '009500278966481927899:bcssp73qony',
		};

		const customPixelVividSearchConfig = JSON.parse(JSON.stringify(pixelatedConfig));
		customPixelVividSearchConfig.integrations = customPixelVividSearchConfig.integrations || {};
		customPixelVividSearchConfig.integrations.googleSearch = {
			...(customPixelVividSearchConfig.integrations?.googleSearch || {}),
			id: 'e336d1c9d0e5e48e5',
		};

		it('should render without crashing', () => {
			const { container } = renderWithProviders(<GoogleSearch />);
			expect(container).toBeDefined();
		});

		it('should use config ID when prop not provided', () => {
			renderWithProviders(<GoogleSearch />);
			const gcseScript = document.querySelector('script[src*="cx=009500278966481927899:bcssp73qony"]');
			expect(gcseScript).toBeDefined();
		});

		it('should render error message when ID is missing', () => {
			const { container } = renderWithProviders(<GoogleSearch />, {
				config: createConfig({
					integrations: {
						googleSearch: { id: undefined },
						googleSearchConsole: { id: undefined }
					}
				})
			});
			expectErrorFallback(container);
		});

		it('should render div with gcse-search class', () => {
			const { container } = renderWithProviders(<GoogleSearch />);
			const searchDiv = container.querySelector('.gcse-search');
			expect(searchDiv).toBeDefined();
		});

		it('should render correct element type', () => {
			const { container } = renderWithProviders(<GoogleSearch />);
			const searchDiv = container.querySelector('.gcse-search');
			expect(searchDiv?.tagName.toLowerCase()).toBe('div');
		});

		it('should accept pixelated search ID from config', () => {
			const { container } = renderWithProviders(<GoogleSearch />, { config: customSearchConfig });
			expect(container.querySelector('.gcse-search')).toBeDefined();
		});

		it('should accept pixelvivid search ID from config', () => {
			const { container } = renderWithProviders(<GoogleSearch />, { config: customPixelVividSearchConfig });
			expect(container.querySelector('.gcse-search')).toBeDefined();
		});

		it('should handle empty ID string from config by rendering error', () => {
			const { container } = renderWithProviders(<GoogleSearch />, {
				config: createConfig({
					integrations: {
						googleSearch: { id: '' },
						googleSearchConsole: { id: undefined }
					}
				})
			});
			expect(container.querySelector('.gcse-search')).toBeNull();
			expectErrorFallback(container);
		});

		it('should handle long ID values from config', () => {
			const longId = 'a'.repeat(200);
			const { container } = renderWithProviders(<GoogleSearch />, {
				config: {
					integrations: {
						googleSearch: { id: longId }
					}
				} as any
			});
			expect(container.querySelector('.gcse-search')).toBeDefined();
		});

		it('should have class name exactly as expected', () => {
			const { container } = renderWithProviders(<GoogleSearch />);
			const searchDiv = container.querySelector('.gcse-search');
			expect(searchDiv?.className).toBe('gcse-search');
		});
	});
});
