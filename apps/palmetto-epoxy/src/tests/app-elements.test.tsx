import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks({
	MicroInteractions: () => null,
	preloadAllCSS: () => null,
	preloadImages: () => null,
	Callout: ({ title }: any) => <div data-testid="mock-callout">{title}</div>,
	SmartImage: () => <span data-testid="mock-smartimage" />,
	MenuSimple: () => <div data-testid="mock-menu-simple" />,
}));

vi.mock('@next/third-parties/google', () => ({
	GoogleAnalytics: () => <div data-testid="mock-google-analytics" />,
}));

import Footer from '@/app/elements/footer';
import Header from '@/app/elements/header';
import Nav from '@/app/elements/nav';
import Social from '@/app/elements/social';
import { LayoutClient } from '@/app/elements/layoutclient';
import * as CalloutLibrary from '@/app/elements/calloutlibrary';

describe('Palmetto Epoxy app elements', () => {
	it('renders Header, Footer, Nav, Social, and LayoutClient', () => {
		render(<Header />);
		expect(screen.getByTestId('mock-smartimage')).toBeTruthy();

		render(<Nav />);
		expect(screen.getAllByTestId('mock-menu-simple').length).toBeGreaterThan(0);

		render(<Social />);
		expect(screen.getAllByTestId('mock-callout').length).toBeGreaterThan(0);

		render(<Footer />);
		expect(screen.getByTestId('mock-google-analytics')).toBeTruthy();
		expect(screen.getAllByTestId('mock-menu-simple').length).toBeGreaterThan(0);

		render(<LayoutClient />);
		expect(screen.queryByTestId('mock-loading')).toBeNull();
	});

	it('renders all callout library exports', () => {
		render(<CalloutLibrary.PageTitle title="Test Title" />);
		expect(screen.getByTestId('mock-pagetitleheader')).toBeTruthy();

		render(<CalloutLibrary.ContactCTA />);
		expect(screen.getByText(/Discover the transformative power of epoxy flooring/)).toBeTruthy();

		render(<CalloutLibrary.AllPartners />);
		expect(screen.getAllByTestId('mock-smartimage').length).toBeGreaterThan(0);

		render(<CalloutLibrary.LowCountrysBest />);
		expect(screen.getAllByTestId('mock-smartimage').length).toBeGreaterThan(0);
	});
});
