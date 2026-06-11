import React from 'react';
import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createPageComponentMocks } from '@/test/page-mocks';

const originalLocation = window.location;

beforeAll(() => {
	delete (window as any).location;
	Object.defineProperty(window, 'location', {
		configurable: true,
		value: { href: 'https://example.com/' },
	});
});

afterAll(() => {
	Object.defineProperty(window, 'location', {
		configurable: true,
		value: originalLocation,
	});
});

const googleMapsApiKeyKey = 'apiKey' as const;
const mockGoogleMapsConfig = { integrations: { googleMaps: { [googleMapsApiKeyKey]: 'test-google-key' } } } as const;

vi.mock('@pixelated-tech/components', () => createPageComponentMocks({
	FormButton: ({ onClick, text, ...props }: any) => (
		<button data-testid="mock-formbutton" onClick={onClick} {...props}>{text}</button>
	),
	BusinessFooter: () => <div data-testid="mock-businessfooter" />,
	usePixelatedConfig: () => mockGoogleMapsConfig,
}));

import HomePage from '@/app/(pages)/(home)/page';

describe('JZ Home Improvement home page coverage', () => {
	it('navigates to /contact when the contact button is clicked and renders BusinessFooter', () => {
		render(<HomePage />);

		const button = screen.getByTestId('mock-formbutton');
		fireEvent.click(button);

		expect(window.location.href).toBe('/contact');
		expect(screen.getByTestId('mock-businessfooter')).toBeTruthy();
	});

	it('renders BusinessFooter when config is missing', async () => {
		vi.resetModules();
		vi.doMock('@pixelated-tech/components', () => createPageComponentMocks({
			FormButton: ({ onClick, text, ...props }: any) => (
				<button data-testid="mock-formbutton" onClick={onClick} {...props}>{text}</button>
			),
			BusinessFooter: () => <div data-testid="mock-businessfooter" />,
			usePixelatedConfig: () => undefined,
		}));

		const { default: HomePageNoConfig } = await import('@/app/(pages)/(home)/page');
		render(<HomePageNoConfig />);

		expect(screen.getByTestId('mock-businessfooter')).toBeTruthy();
	});
});
