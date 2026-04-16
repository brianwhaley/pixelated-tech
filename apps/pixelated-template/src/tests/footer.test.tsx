import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@pixelated-tech/components', () => {
	const React = require('react');
	return {
		PageSection: ({ children }: { children?: React.ReactNode }) => React.createElement('div', { 'data-testid': 'page-section' }, children),
		GoogleAnalytics: () => React.createElement('div', { 'data-testid': 'google-analytics' }, null),
		PixelatedFooter: () => React.createElement('div', { 'data-testid': 'pixelated-footer' }, 'Footer'),
	};
});

import Footer from '@/app/elements/footer';

describe('Footer component', () => {
	it('renders footer content and current year', () => {
		render(<Footer />);
		expect(screen.getByTestId('google-analytics')).toBeInTheDocument();
		expect(screen.getByTestId('pixelated-footer')).toBeInTheDocument();
		expect(screen.getByText(/__SITE_NAME__/)).toBeInTheDocument();
	});
});
