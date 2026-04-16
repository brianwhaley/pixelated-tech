import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@pixelated-tech/components', () => {
	const React = require('react');
	return {
		PageSection: ({ children }: { children?: React.ReactNode }) => React.createElement('section', { 'data-testid': 'page-section' }, children),
		PageTitleHeader: ({ title }: { title: string }) => React.createElement('h1', { 'data-testid': 'page-title-header' }, title),
	};
});

import Home from '@/app/(pages)/(home)/page';

describe('Home page', () => {
	it('renders the page title and welcome text', () => {
		render(<Home />);
		expect(screen.getByTestId('page-title-header')).toHaveTextContent('__SITE_NAME__');
		expect(screen.getByText('Welcome to __SITE_NAME__')).toBeInTheDocument();
	});
});
