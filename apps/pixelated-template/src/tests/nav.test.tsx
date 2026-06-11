import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockConfig: any = { routes: [] };

vi.mock('@pixelated-tech/components', () => {
	const React = require('react');
	return {
		PageSection: ({ children }: { children?: React.ReactNode }) => React.createElement('section', { 'data-testid': 'page-section' }, children),
		MenuSimple: ({ menuItems }: { menuItems?: any[] }) => React.createElement('div', { 'data-testid': 'menu-simple' }, `items:${menuItems?.length}`),
		usePixelatedConfig: () => mockConfig,
	};
});

import Nav from '@/app/elements/nav';

describe('Nav component', () => {
	beforeEach(() => {
		mockConfig.routes = [];
	});

	it('renders the menu component', () => {
		render(<Nav />);
		expect(screen.getByTestId('menu-simple')).toBeInTheDocument();
	});

	it('renders routes when menu items exist', () => {
		mockConfig.routes = [{ path: '/', title: 'Home' }];
		render(<Nav />);
		expect(screen.getByTestId('menu-simple')).toHaveTextContent('items:1');
	});
});
