import React from 'react';
import { screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Calendly } from '../components/integrations/calendly';
import { pixelatedConfig, pixelatedConfigEmpty } from '../test/test-data';
import { renderWithProviders } from '../test/test-utils';

describe('Calendly Component', () => {
	beforeEach(() => {
		document.head.innerHTML = '';
		vi.clearAllMocks();
	});

	it('should render the calendly inline widget div using config', () => {
		renderWithProviders(
			<Calendly 
				width="320px" 
				height="700px" 
			/>
		);
		
		const widget = document.querySelector('.calendly-inline-widget');
		expect(widget).toBeInTheDocument();
		expect(widget?.getAttribute('data-url')).toBe(pixelatedConfig.integrations?.calendly?.url);
	});

	it('should trigger error boundary when no URL is provided', () => {
		renderWithProviders(
			<Calendly 
				width="320px" 
				height="700px" 
			/>
		);
		
		const widget = document.querySelector('.calendly-inline-widget');
		expect(widget).toBeInTheDocument();
		expect(widget?.getAttribute('data-url')).toBe(pixelatedConfig.integrations?.calendly?.url);
	});

	it('should trigger error boundary when no URL is provided', () => {
		// suppress console.error for expected error
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		
		renderWithProviders(
			<Calendly 
				width="320px" 
				height="700px" 
			/>,
			{ config: pixelatedConfigEmpty }
		);
		
		expect(screen.getByText(/Sorry, something went wrong loading/)).toBeInTheDocument();
		expect(screen.getByText(/Calendly/)).toBeInTheDocument();
		consoleSpy.mockRestore();
	});
});
