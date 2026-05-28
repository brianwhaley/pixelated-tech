import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@pixelated-tech/components', () => {
	const React = require('react');
	return {
		PageTitleHeader: ({ title }: { title: string }) => React.createElement('h1', { 'data-testid': 'page-title-header' }, title),
		PageSection: ({ children }: { children?: React.ReactNode }) => React.createElement('section', { 'data-testid': 'page-section' }, children),
		PageSectionHeader: ({ title }: { title: string }) => React.createElement('h2', { 'data-testid': 'page-section-header' }, title),
		Callout: ({ title }: { title: string }) => React.createElement('div', { 'data-testid': 'callout' }, title),
	};
});

import About from '@/app/(pages)/about/page';

describe('About page', () => {
	it('renders the about page with header, team section, and historical overview', async () => {
		render(<About />);
		expect(screen.getByTestId('page-title-header')).toHaveTextContent('About Simple Day Concierge');
		const sectionHeaders = screen.getAllByTestId('page-section-header');
		expect(sectionHeaders.map((node) => node.textContent)).toEqual([
			'Our Team',
			'Our History',
		]);
		expect(screen.getAllByTestId('callout')).toHaveLength(2);
	});
});
