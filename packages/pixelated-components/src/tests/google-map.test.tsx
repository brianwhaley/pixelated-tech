import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { GoogleMaps } from '../components/integrations/google.maps';
import { GoogleMap } from '../components/integrations/google.map';
import { renderWithProviders, render } from '../test/test-utils';
import { pixelatedConfig, pixelatedConfigEmpty } from '../test/test-data';

describe('Google Map Components', () => {
	const defaultProps = {
		map_mode: 'place',
		parameters: 'q=New+York,NY'
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Map Initialization', () => {
		it('should render map container with gmap class', () => {
			const { container } = render(
				<GoogleMaps {...defaultProps} />
			);

			const mapDiv = container.querySelector('.gmap');
			expect(mapDiv).toBeDefined();
			expect(mapDiv).toBeInTheDocument();
		});

		it('should render Google Maps iframe', () => {
			const { container } = render(
				<GoogleMaps {...defaultProps} />
			);

			const iframe = container.querySelector('iframe');
			expect(iframe).toBeDefined();
			expect(iframe).toBeInTheDocument();
		});

		it('should load Google Maps embed API', () => {
			const { container } = render(
			<GoogleMaps {...defaultProps} />
			);

			const iframe = container.querySelector('iframe');
			const src = iframe?.getAttribute('src');
			expect(src).toContain('google.com/maps/embed/v1');
		});

		it('should configure map embed mode', () => {
			const { container } = render(
				<GoogleMaps {...defaultProps} />
			);

			const iframe = container.querySelector('iframe');
			const src = iframe?.getAttribute('src');
			expect(src).toContain('place');
		});

		it('should include API key from config in embed URL', () => {
			const { container } = render(
				<GoogleMaps {...defaultProps} />
			);

			const iframe = container.querySelector('iframe');
			const src = iframe?.getAttribute('src');
			expect(src).toContain('key=AIzaSyACcYSG_w7Fy2jfC_yphe05vsWPW4TxOAE');
		});

		it('should use custom API key from provider config', () => {
			const customConfig = {
				integrations: {
					googleMaps: { apiKey: 'test-api-key-prop' }
				}
			} as any;
			const { container } = renderWithProviders(
				<GoogleMaps {...defaultProps} />,
				{ config: customConfig }
			);

			const iframe = container.querySelector('iframe');
			const src = iframe?.getAttribute('src');
			expect(src).toContain('key=test-api-key-prop');
		});

		it('should set iframe title from prop', () => {
			const { container } = render(
				<GoogleMaps {...defaultProps} title="My Cafe Location" />
			);
			
			const iframe = container.querySelector('iframe');
			expect(iframe?.getAttribute('title')).toBe('My Cafe Location');
		});

		it('should use default title when not provided', () => {
			const { container } = render(
				<GoogleMaps {...defaultProps} />
			);
			
			const iframe = container.querySelector('iframe');
			expect(iframe?.getAttribute('title')).toBe('Google Map');
		});

		it('should set iframe width from prop', () => {
			const { container } = render(
				<GoogleMaps {...defaultProps} width="800" />
			);
			
			const iframe = container.querySelector('iframe');
			expect(iframe?.getAttribute('width')).toBe('800');
		});

		it('should set iframe height from prop', () => {
			const { container } = render(
				<GoogleMaps {...defaultProps} height="500" />
			);
			
			const iframe = container.querySelector('iframe');
			expect(iframe?.getAttribute('height')).toBe('500');
		});

		it('should support different map modes', () => {
			const modes = ['place', 'search', 'directions', 'streetview'];

			modes.forEach(mode => {
				const { container } = render(
					<GoogleMaps {...defaultProps} map_mode={mode} />
				);

				const iframe = container.querySelector('iframe');
				const src = iframe?.getAttribute('src');
				expect(src).toContain(mode);
			});
		});
	});

	describe('GoogleMap component', () => {
		it('should render GoogleMap iframe with provider config apiKey and query', () => {
			const customConfig = {
				integrations: {
					googleMaps: { apiKey: 'custom-key-123' }
				}
			} as any;
			const { container } = renderWithProviders(
				<GoogleMap q="Los Angeles, CA" />,
				{ config: customConfig }
			);

			const iframe = container.querySelector('iframe');
			expect(iframe).toBeDefined();
			expect(iframe?.getAttribute('src')).toContain('key=custom-key-123');
			expect(iframe?.getAttribute('src')).toContain('q=Los%20Angeles%2C%20CA');
			expect(iframe?.getAttribute('title')).toBe('Google Map');
		});

		it('should render fallback when apiKey is missing from props and config', () => {
			const { container } = renderWithProviders(
				<GoogleMap q="Austin, TX" />,
				{
					config: {
						integrations: {
							google: { api_key: undefined },
							googleMaps: { apiKey: undefined }
						}
					} as any
				}
			);

			expect(container.textContent).toMatch(/Sorry, something went wrong loading GoogleMap/i);
		});
	});

	describe('Error Handling', () => {
		it('should render error message when apiKey is missing', () => {
			const { container } = render(
				<GoogleMaps {...defaultProps} />,
				{ 
					config: { 
						integrations: { 
							googleMaps: { apiKey: undefined } 
						} 
					} as any 
				}
			);

			expect(container.textContent).toMatch(/Sorry, something went wrong loading/i);
			expect(container.textContent).toMatch(/GoogleMaps/i);
		});
	});

	describe('Markers and Locations', () => {
		it('should accept location query parameters', () => {
			const { container } = renderWithProviders(
				<GoogleMaps 
					{...defaultProps} 
					parameters="q=New+York,NY"
				/>
			);

			const iframe = container.querySelector('iframe');
			const src = iframe?.getAttribute('src');
			expect(src).toContain('q=New');
		});

		it('should handle multiple locations', () => {
			const { container } = renderWithProviders(
				<GoogleMaps 
					{...defaultProps} 
					parameters="q=New+York,NY&zoom=12"
				/>
			);

			const iframe = container.querySelector('iframe');
			const src = iframe?.getAttribute('src');
			expect(src).toContain('zoom=12');
		});

		it('should support center parameter', () => {
			const { container } = renderWithProviders(
				<GoogleMaps 
					{...defaultProps} 
					parameters="center=40.7128,-74.0060"
				/>
			);

			const iframe = container.querySelector('iframe');
			const src = iframe?.getAttribute('src');
			expect(src).toContain('center=');
		});

		it('should support zoom level parameter', () => {
			const { container } = renderWithProviders(
				<GoogleMaps 
					{...defaultProps} 
					parameters="zoom=15"
				/>
			);

			const iframe = container.querySelector('iframe');
			const src = iframe?.getAttribute('src');
			expect(src).toContain('zoom=15');
		});
	});

	describe('Map Configuration', () => {
		it('should set default width to 600px', () => {
			const { container } = renderWithProviders(
				<GoogleMaps {...defaultProps} />
			);

			const iframe = container.querySelector('iframe');
			expect(iframe?.getAttribute('width')).toBe('600');
		});

		it('should set default height to 400px', () => {
			const { container } = renderWithProviders(
				<GoogleMaps {...defaultProps} />
			);

			const iframe = container.querySelector('iframe');
			expect(iframe?.getAttribute('height')).toBe('400');
		});

		it('should accept custom width', () => {
			const { container } = renderWithProviders(
				<GoogleMaps {...defaultProps} width="800" />
			);

			const iframe = container.querySelector('iframe');
			expect(iframe?.getAttribute('width')).toBe('800');
		});

		it('should accept custom height', () => {
			const { container } = renderWithProviders(
				<GoogleMaps {...defaultProps} height="600" />
			);

			const iframe = container.querySelector('iframe');
			expect(iframe?.getAttribute('height')).toBe('600');
		});

		it('should support percentage width', () => {
			const { container } = renderWithProviders(
				<GoogleMaps {...defaultProps} width="100%" />
			);

			const iframe = container.querySelector('iframe');
			expect(iframe?.getAttribute('width')).toBe('100%');
		});

		it('should set frameBorder by default', () => {
			const { container } = renderWithProviders(
				<GoogleMaps {...defaultProps} />
			);

			const iframe = container.querySelector('iframe');
			expect(iframe?.getAttribute('frameBorder')).toBe('0');
		});

		it('should accept custom frameBorder', () => {
			const { container } = renderWithProviders(
				<GoogleMaps {...defaultProps} frameBorder="1" />
			);

			const iframe = container.querySelector('iframe');
			expect(iframe?.getAttribute('frameBorder')).toBe('1');
		});
	});

	describe('Accessibility', () => {
		it('should have default title', () => {
			const { container } = renderWithProviders(
				<GoogleMaps {...defaultProps} />
			);

			const iframe = container.querySelector('iframe');
			expect(iframe?.getAttribute('title')).toBe('Google Map');
		});

		it('should accept custom title', () => {
			const { container } = renderWithProviders(
				<GoogleMaps {...defaultProps} title="Our Location" />
			);

			const iframe = container.querySelector('iframe');
			expect(iframe?.getAttribute('title')).toBe('Our Location');
		});

		it('should set referrerPolicy', () => {
			const { container } = renderWithProviders(
				<GoogleMaps {...defaultProps} />
			);

			const iframe = container.querySelector('iframe');
			expect(iframe?.getAttribute('referrerPolicy')).toBe('no-referrer-when-downgrade');
		});

		it('should allow fullscreen', () => {
			const { container } = renderWithProviders(
				<GoogleMaps {...defaultProps} />
			);

			const iframe = container.querySelector('iframe');
			expect(iframe?.hasAttribute('allowFullScreen')).toBe(true);
		});
	});

	describe('API Key Configuration', () => {
		it('should use custom API key from provider config', () => {
			const customConfig = {
				integrations: {
					googleMaps: { apiKey: 'custom-key-456' }
				}
			} as any;
			const { container } = renderWithProviders(
				<GoogleMaps {...defaultProps} />,
				{ config: customConfig }
			);

			const iframe = container.querySelector('iframe');
			const src = iframe?.getAttribute('src');
			expect(src).toContain('key=custom-key-456');
		});

		it('should use specific config API key when provided', () => {
			const customConfig = {
				integrations: {
					googleMaps: { apiKey: 'config-key-789' }
				}
			} as any;
			const { container } = renderWithProviders(
				<GoogleMaps map_mode="place" parameters="q=test" />,
				{ config: customConfig }
			);

			const iframe = container.querySelector('iframe');
			const src = iframe?.getAttribute('src');
			expect(src).toContain('key=config-key-789');
	});
	});

	describe('Styling', () => {
		it('should apply default inline styles', () => {
			const { container } = renderWithProviders(
				<GoogleMaps {...defaultProps} />
			);

			const iframe = container.querySelector('iframe');
			const style = iframe?.getAttribute('style');
			expect(style).toBeDefined();
		});

		it('should accept custom styles', () => {
			const customStyle = { border: '2px solid red', borderRadius: '8px' };
			const { container } = renderWithProviders(
				<GoogleMaps {...defaultProps} style={customStyle} />
			);

			const iframe = container.querySelector('iframe');
			expect(iframe).toBeDefined();
		});
	});

	describe('Embed Modes', () => {
		it('should support place embed mode', () => {
			const customConfig = {
				integrations: {
					googleMaps: { apiKey: 'test-key' }
				}
			} as any;
			const { container } = renderWithProviders(
				<GoogleMaps map_mode="place" parameters="q=coffee+shops" />,
				{ config: customConfig }
			);

			const iframe = container.querySelector('iframe');
			const src = iframe?.getAttribute('src');
			expect(src).toContain('/place?');
		});

		it('should support search embed mode', () => {
			const customConfig = {
				integrations: {
					googleMaps: { apiKey: 'test-key' }
				}
			} as any;
			const { container } = renderWithProviders(
				<GoogleMaps map_mode="search" parameters="q=restaurants" />,
				{ config: customConfig }
			);

			const iframe = container.querySelector('iframe');
			const src = iframe?.getAttribute('src');
			expect(src).toContain('/search?');
		});

		it('should support directions embed mode', () => {
			const customConfig = {
				integrations: {
					googleMaps: { apiKey: 'test-key' }
				}
			} as any;
			const { container } = renderWithProviders(
				<GoogleMaps map_mode="directions" parameters="origin=New+York&destination=Boston" />,
				{ config: customConfig }
			);

			const iframe = container.querySelector('iframe');
			const src = iframe?.getAttribute('src');
			expect(src).toContain('/directions?');
		});

		it('should support streetview embed mode', () => {
			const customConfig = {
				integrations: {
					googleMaps: { apiKey: 'test-key' }
				}
			} as any;
			const { container } = renderWithProviders(
				<GoogleMaps map_mode="streetview" parameters="location=40.7128,-74.006" />,
				{ config: customConfig }
			);

			const iframe = container.querySelector('iframe');
			const src = iframe?.getAttribute('src');
			expect(src).toContain('/streetview?');
		});
	});

	describe('Parameter Passing', () => {
		it('should properly encode query parameters', () => {
			const { container } = renderWithProviders(
				<GoogleMaps 
					{...defaultProps}
					parameters="q=New+York+City"
				/>
			);

			const iframe = container.querySelector('iframe');
			const src = iframe?.getAttribute('src');
			expect(src).toContain('q=New');
		});

		it('should support multiple query parameters', () => {
			const customConfig = {
				integrations: {
					googleMaps: { apiKey: 'test-key' }
				}
			} as any;
			const { container } = renderWithProviders(
				<GoogleMaps map_mode="place" parameters="q=restaurants&zoom=15&type=dining" />,
				{ config: customConfig }
			);

			const iframe = container.querySelector('iframe');
			const src = iframe?.getAttribute('src');
			expect(src).toContain('zoom');
		});
	});
});
