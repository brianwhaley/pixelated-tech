import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@pixelated-tech/components', () => {
	const React = require('react');
	return {
		PageSection: ({ children }: { children?: React.ReactNode }) => React.createElement('section', { 'data-testid': 'page-section' }, children),
		MenuSimple: ({ menuItems }: { menuItems?: any[] }) => React.createElement('div', { 'data-testid': 'menu-simple' }, `items:${menuItems?.length}`),
	};
});

import Nav from '@/app/elements/nav';

describe('Nav component', () => {
	it('renders the menu component', () => {
		render(<Nav />);
		expect(screen.getByTestId('menu-simple')).toBeInTheDocument();
	});
});
