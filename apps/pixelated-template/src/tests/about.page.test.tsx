import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const mockProfile = {
	avatarUrl: 'https://example.com/avatar.png',
	displayName: 'Brian',
	profileUrl: 'https://gravatar.com/brian',
};

globalThis.__mockGravatarProfile = mockProfile;

vi.mock('@pixelated-tech/components', () => {
	const React = require('react');
	return {
		PageTitleHeader: ({ title }: { title: string }) => React.createElement('h1', { 'data-testid': 'page-title-header' }, title),
		PageSection: ({ children }: { children?: React.ReactNode }) => React.createElement('section', { 'data-testid': 'page-section' }, children),
		PageSectionHeader: ({ title }: { title: string }) => React.createElement('h2', { 'data-testid': 'page-section-header' }, title),
		PageGridItem: ({ children }: { children?: React.ReactNode }) => React.createElement('div', { 'data-testid': 'page-grid-item' }, children),
		GravatarCard: ({ profile }: { profile: any }) => React.createElement('div', { 'data-testid': 'gravatar-card' }, profile?.displayName ?? 'no profile'),
		Carousel: ({ cards }: { cards: any[] }) => React.createElement('div', { 'data-testid': 'carousel' }, `cards:${cards?.length}`),
		getGravatarProfile: () => {
			const response = (globalThis as any).__mockGravatarProfile;
			return response instanceof Error ? Promise.reject(response) : Promise.resolve(response);
		},
	};
});

import About from '@/app/(pages)/about/page';

describe('About page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(globalThis as any).__mockGravatarProfile = mockProfile;
	});

	it('renders the about page with header, team section, and testimonials section', async () => {
		render(<About />);
		expect(screen.getByTestId('page-title-header')).toHaveTextContent('About __SITE_NAME__');
		const sectionHeaders = screen.getAllByTestId('page-section-header');
		expect(sectionHeaders.map((node) => node.textContent)).toEqual([
			'Our Team',
			'Our History',
			'Testimonials',
		]);
		await waitFor(() => expect(screen.getByTestId('gravatar-card')).toBeInTheDocument());
		expect(screen.getByTestId('carousel')).toHaveTextContent('cards:3');
	});

	it('renders the about page fallback when gravatar fetch fails', async () => {
		(globalThis as any).__mockGravatarProfile = new Error('fail');
		render(<About />);
		await waitFor(() => expect(screen.getByTestId('gravatar-card')).toBeInTheDocument());
		expect(screen.getByTestId('gravatar-card')).toHaveTextContent('no profile');
	});
});
