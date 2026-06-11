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
			BusinessFooter: () => <div data-testid="mock-businessfooter" />,
			Hero: ({ video, children }: any) => (
				<div data-testid="mock-hero" data-video={video}>{children}</div>
			),
			PageSection: ({ children, className, style }: any) => (
				<section id="mock-section" className={className} style={style}>{children}</section>
			),
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

	it('renders Footer and BusinessFooter', () => {
		render(<Footer />);

		expect(screen.getByTestId('mock-businessfooter')).toBeInTheDocument();
	});

	it('renders Nav with menu items', () => {
		render(<Nav />);
		expect(screen.getByTestId('mock-menusimple')).toBeInTheDocument();
	});
});
