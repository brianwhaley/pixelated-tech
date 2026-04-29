import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createPageComponentMocks } from '@/test/page-mocks';

const googleMapsConfigKey = 'googleMaps' as const;
const googleMapsApiKeyKey = 'apiKey' as const;

vi.mock('@pixelated-tech/components', () => {
	return {
		__esModule: true,
		...createPageComponentMocks({
			usePixelatedConfig: () => ({ [googleMapsConfigKey]: { [googleMapsApiKeyKey]: 'mm-api-key' } }),
			BusinessFooter: ({ googleMapsApiKey }: any) => (
				<div data-testid="mock-businessfooter" data-google={googleMapsApiKey ?? ''} />
			),
			Hero: ({ video, children }: any) => (
				<div data-testid="mock-hero" data-video={video}>{children}</div>
			),
			PageSection: ({ children, ...props }: any) => <section id="mock-section" {...props}>{children}</section>,
			MenuAccordion: ({ menuItems, children }: any) => (
				<div data-testid="mock-menuaccordion" data-menu={JSON.stringify(menuItems)}>{children}</div>
			),
			MenuAccordionButton: () => <button data-testid="mock-menuaccordionbutton" />,
			SmartImage: () => <div data-testid="mock-smartimage" />,
			MenuSimple: ({ menuItems }: any) => (
				<nav data-testid="mock-menusimple">{JSON.stringify(menuItems)}</nav>
			),
		}),
	};
});

import Header from '@/app/elements/header';
import Footer from '@/app/elements/footer';
import Nav from '@/app/elements/nav';

describe('Manning Metalworks element coverage', () => {
	it('renders Header and passes hero video to Hero', async () => {
		render(<Header />);

		await waitFor(() => expect(screen.getByTestId('mock-hero')).toBeTruthy());
		const hero = screen.getByTestId('mock-hero');
		expect(hero.getAttribute('data-video')).toBeTruthy();
	});

	it('renders Footer and passes googleMapsApiKey to BusinessFooter', () => {
		render(<Footer />);

		expect(screen.getByTestId('mock-businessfooter')).toHaveAttribute('data-google', 'mm-api-key');
	});

	it('renders Nav with menu items', () => {
		render(<Nav />);
		expect(screen.getByTestId('mock-menusimple')).toBeInTheDocument();
	});
});
