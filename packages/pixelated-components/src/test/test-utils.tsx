// Shared test utility helpers used by src/tests/*. This file should contain only
// reusable rendering helpers, custom assertions, and test support helpers. It
// should not contain raw test data or fixture objects.
//
// NOT for:
// - fixture objects or sample payloads (use src/test/fixtures.ts or src/test/data/*.json)
// - shared test data exports/barrel exports (use src/test/test-data.ts)
// - application code or component implementation


import React, { ComponentType, ReactElement } from 'react';
import { render, RenderOptions, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import { PixelatedClientConfigProvider } from '../components/config/config.client';
import type { GoogleAnalyticsConfig, GoogleMapsConfig, GoogleSearchConfig, GooglePlacesConfig, PixelatedConfig } from '../components/config/config.types';
import { pixelatedConfig, mockContentfulItems, mockContentfulAssets, formDefinition, mockPlaceReviews, mockContentfulItem } from './test-data';

export const mockConfig = pixelatedConfig;
export const createMockConfig = (overrides: Partial<PixelatedConfig> = {}): PixelatedConfig => ({
	...mockConfig,
	...overrides,
});

expect.extend({
	toBeInTheDocument(received: any) {
		const pass = received !== null && received !== undefined && document.contains(received as Node);
		return {
			pass,
			message: () => pass ? 'expected element not to be in the document' : 'expected element to be in the document',
		};
	},
	toHaveClass(received: any, ...expectedClasses: string[]) {
		const actualClasses = received?.classList ? Array.from(received.classList) : [];
		// Split space-separated class strings so 'boxed grid' checks both 'boxed' and 'grid'
		const normalized = expectedClasses.flatMap((c: string) => c.trim().split(/\s+/));
		const pass = normalized.every((className) => actualClasses.includes(className));
		return {
			pass,
			message: () => pass
				? `expected element not to have class ${normalized.join(', ')}`
				: `expected element to have class ${normalized.join(', ')}, but had ${(actualClasses as string[]).join(', ')}`,
		};
	},
	toHaveAttribute(received: any, attributeName: string, expectedValue?: any) {
		const actualValue = received?.getAttribute ? received.getAttribute(attributeName) : null;
		let pass: boolean;
		if (expectedValue === undefined) {
			pass = actualValue !== null;
		} else if (expectedValue !== null && typeof expectedValue === 'object' && typeof expectedValue.asymmetricMatch === 'function') {
			pass = actualValue !== null && expectedValue.asymmetricMatch(actualValue);
		} else {
			pass = actualValue === expectedValue;
		}
		return {
			pass,
			message: () => pass
				? `expected element not to have attribute ${attributeName}`
				: expectedValue === undefined
					? `expected element to have attribute ${attributeName}`
					: `expected attribute ${attributeName} to equal ${String(expectedValue)}, but got ${actualValue}`,
		};
	},
});

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  config?: Partial<PixelatedConfig> | null;
}

/**
 * Custom render function that wraps components in the necessary providers.
 * Defaults to using the mock version of the global pixelated.config.json.
 */
export function renderWithProviders(
	ui: ReactElement,
	{
		config,
		...renderOptions
	}: ExtendedRenderOptions = {}
) {
	const mergedConfig = config === undefined || config === null
		? mockConfig
		: Object.keys(config).length === 0
			? config
			: { ...mockConfig, ...config };

	function Wrapper({ children }: { children: React.ReactNode }) {
		return (
			<PixelatedClientConfigProvider config={mergedConfig}>
				{children}
			</PixelatedClientConfigProvider>
		);
	}

	return {
		...render(ui, { wrapper: Wrapper, ...renderOptions }),
		config: mergedConfig,
	};
}

export function renderWithConfig(
	ui: ReactElement,
	config: Partial<PixelatedConfig> | null = null,
	renderOptions: Omit<ExtendedRenderOptions, 'config'> = {}
) {
	return renderWithProviders(ui, { config, ...renderOptions });
}

export function renderWithoutProviders(
	ui: ReactElement,
	renderOptions: Omit<RenderOptions, 'queries'> = {}
) {
	return render(ui, renderOptions);
}

export function createConfig(overrides: Partial<PixelatedConfig> = {}) {
	return {
		...mockConfig,
		...overrides,
	};
}

export function expectScriptInjected(scriptId: string) {
	return expect(document.getElementById(scriptId)).not.toBeNull();
}

export function expectErrorFallback(container: HTMLElement) {
	return expect(container.textContent).toMatch(/something went wrong|error/i);
}

export function expectJsonLdSchema(container: HTMLElement) {
	return expect(
		container.querySelector('script[type="application/ld+json"]')
	).not.toBeNull();
}

export function expectRenderSuccess(container: HTMLElement) {
	return expect(container).toBeInTheDocument();
}

export function runScenarioTable(
	Component: ComponentType<any>,
	scenarios: Array<{ name: string; props: Record<string, any> }>
) {
	scenarios.forEach(({ name, props }) => {
		test(name, () => {
			const { container } = renderWithProviders(<Component {...props} />);
			expectRenderSuccess(container);
		});
	});
}

export function runConfigScenarioTests(
	name: string,
	Component: ComponentType<any>,
	scenarios: Array<{ name: string; config?: Partial<PixelatedConfig>; props?: Record<string, any> }>
) {
	describe(name, () => {
		scenarios.forEach(({ name: scenarioName, config, props }) => {
			test(scenarioName, () => {
				const { container } = renderWithConfig(
					<Component {...props} />,
					config ?? null
				);
				expectRenderSuccess(container);
			});
		});
	});
}

export function runSmokeTest(
	Component: ComponentType<any>,
	props: Record<string, any> = {}
) {
	test('renders without crashing', () => {
		const { container } = renderWithProviders(<Component {...props} />);
		expectRenderSuccess(container);
	});
}

export function runErrorStateTest(
	Component: ComponentType<any>,
	props: Record<string, any> = {},
	errorText = /error/i
) {
	test('renders error state', async () => {
		const { container } = renderWithProviders(<Component {...props} />);
		await waitFor(() => {
			expect(container.textContent).toMatch(errorText);
		});
	});
}

export {
	renderWithProviders as render,
	renderWithProviders as renderComponentWithProviders,
	renderWithConfig as renderComponentWithConfig,
	screen, fireEvent, waitFor, userEvent 
};
