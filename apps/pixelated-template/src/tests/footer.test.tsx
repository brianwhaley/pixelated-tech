import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockUsePixelatedConfig = vi.fn(() => ({ siteInfo: { name: '__SITE_NAME__' } }));

vi.mock('@pixelated-tech/components', () => {
	const React = require('react');
	return {
		PageSection: ({ children }: { children?: React.ReactNode }) => React.createElement('div', { 'data-testid': 'page-section' }, children),
		GoogleAnalytics: () => React.createElement('div', { 'data-testid': 'google-analytics' }, null),
		PixelatedFooter: () => React.createElement('div', { 'data-testid': 'pixelated-footer' }, 'Footer'),
		usePixelatedConfig: () => mockUsePixelatedConfig(),
	};
});

import Footer from '@/app/elements/footer';

afterEach(() => {
	mockUsePixelatedConfig.mockReset();
	mockUsePixelatedConfig.mockImplementation(() => ({ siteInfo: { name: '__SITE_NAME__' } }));
});

describe('Footer component', () => {
	it('renders footer content and current year', () => {
		render(<Footer />);
		expect(screen.getByTestId('google-analytics')).toBeInTheDocument();
		expect(screen.getByTestId('pixelated-footer')).toBeInTheDocument();
		expect(screen.getByText(/__SITE_NAME__/)).toBeInTheDocument();
	});

	it('renders fallback site name when config siteInfo is missing', () => {
		mockUsePixelatedConfig.mockImplementation(() => ({ siteInfo: {} }));
		render(<Footer />);
		expect(screen.getByText(/__SITE_NAME__/)).toBeInTheDocument();
	});
});
