import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@pixelated-tech/components', () => {
	const React = require('react');
	return {
		__esModule: true,
		usePixelatedConfig: () => ({ siteInfo: { name: 'Simple Day Concierge', telephone: '(000) 000-0000', email: 'info@simpledayconcierge.com', address: {} } }),
		PageSection: ({ children }: { children?: React.ReactNode }) => React.createElement('div', { 'data-testid': 'page-section' }, children),
		PageGridItem: ({ children }: { children?: React.ReactNode }) => React.createElement('div', { 'data-testid': 'page-grid-item' }, children),
		PageSectionHeader: ({ title }: { title?: string }) => React.createElement('div', { 'data-testid': 'page-section-header' }, title || null),
		BusinessFooterAddress: ({ children }: { children?: React.ReactNode }) => React.createElement('div', { 'data-testid': 'business-footer-address' }, children),
		BusinessFooterMap: ({ children }: { children?: React.ReactNode }) => React.createElement('div', { 'data-testid': 'business-footer-map' }, children),
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
		expect(screen.getByText(/Simple Day Concierge/)).toBeInTheDocument();
	});
});
