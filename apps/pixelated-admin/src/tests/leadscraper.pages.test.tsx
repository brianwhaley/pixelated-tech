import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@pixelated-tech/components', () => ({
	PageGridItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	PageSection: ({ children }: { children: React.ReactNode }) => <section id="test-section">{children}</section>,
	PageSectionHeader: ({ title }: { title: string }) => <h2>{title}</h2>,
	PageTitleHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

vi.mock('../app/(pages)/domain-scraper/actions.server', () => ({
	scrapeDomain: vi.fn(),
}));

import LeadScraperPage from '../app/(pages)/lead-scraper/page';
import DomainScraperPage from '../app/(pages)/domain-scraper/page';

describe('migrated Leadscraper pages', () => {
	it('renders the renamed Lead Scraper landing page', () => {
		render(<LeadScraperPage />);

		expect(screen.getByRole('heading', { name: 'Lead Scraper' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Domain Scraper' })).toHaveAttribute('href', '/domain-scraper');
		expect(screen.getByRole('link', { name: 'Scrape Google Places' })).toHaveAttribute('href', '/api/scrape-google-places');
	});

	it('renders the migrated Domain Scraper form', () => {
		render(<DomainScraperPage />);

		expect(screen.getByRole('heading', { name: 'Domain Scraper', level: 1 })).toBeInTheDocument();
		expect(screen.getByLabelText('Starting URL')).toBeInTheDocument();
		expect(screen.getByLabelText('Maximum pages')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Start crawl' })).toBeInTheDocument();
	});
});