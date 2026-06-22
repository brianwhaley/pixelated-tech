import React, { ReactElement } from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { expect } from 'vitest';
import { PixelatedClientConfigProvider } from '../../packages/pixelated-components/src/components/config/config.client';
import type { PixelatedConfig } from '../../packages/pixelated-components/src/components/config/config.types';

export const mockConfig: PixelatedConfig = {} as PixelatedConfig;
export const createMockConfig = (overrides: Partial<PixelatedConfig>): PixelatedConfig => ({
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

function renderWithProviders(
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
		...rtlRender(ui, { wrapper: Wrapper, ...renderOptions }),
		config: mergedConfig,
	};
}

export { renderWithProviders as render };
export { renderWithProviders };
