import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockConfig: any = { siteInfo: { name: '__SITE_NAME__' }, routes: [] };

vi.mock('@pixelated-tech/components', () => {
	const React = require('react');
	return {
		PageSection: ({ children }: { children?: React.ReactNode }) => React.createElement('section', { 'data-testid': 'page-section' }, children),
		SmartImage: (props: any) => React.createElement('img', { 'data-testid': 'smart-image', ...props }),
		MenuAccordion: ({ menuItems }: { menuItems?: any[] }) => React.createElement('div', { 'data-testid': 'menu-accordion' }, `items:${menuItems?.length}`),
		MenuAccordionButton: () => React.createElement('button', { 'data-testid': 'menu-accordion-button' }, 'Menu'),
		usePixelatedConfig: () => mockConfig,
	};
});

import Header from '@/app/elements/header';

describe('Header component', () => {
	beforeEach(() => {
		mockConfig.siteInfo = { name: '__SITE_NAME__' };
		mockConfig.routes = [];
	});

	it('renders menu controls and logo image', () => {
		render(<Header />);
		expect(screen.getByTestId('menu-accordion-button')).toBeInTheDocument();
		expect(screen.getByTestId('smart-image')).toHaveAttribute('alt', '__SITE_NAME__ Logo');
	});

	it('renders logo alt fallback when siteInfo.name is missing', () => {
		mockConfig.siteInfo = undefined;
		render(<Header />);
		expect(screen.getByTestId('smart-image')).toHaveAttribute('alt', 'Site Logo');
	});
});
