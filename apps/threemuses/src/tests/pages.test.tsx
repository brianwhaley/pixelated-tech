import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createPageComponentMocks } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import DancewearPage from '@/app/(pages)/dancewear/page';
import SewingPage from '@/app/(pages)/sewing/page';
import BoutiquePage from '@/app/(pages)/boutique/page';
import ContactUsPage from '@/app/(pages)/contact-us/page';
import FAQsPage from '@/app/(pages)/faqs/page';
import StyleGuidePage from '@/app/(pages)/styleguide/page';
import BlogCalendarPage from '@/app/(pages)/blogcalendar/page';
import UpdatesPage from '@/app/(pages)/updates/page';

describe('Threemuses page coverage', () => {
	it('renders the dancewear page title', async () => {
		render(<DancewearPage />);
		await waitFor(() => expect(screen.getByTestId('mock-pagetitleheader').textContent).toContain("Terpsichore's Dancewear"));
	});

	it('renders the sewing page title', async () => {
		render(<SewingPage />);
		await waitFor(() => expect(screen.getByTestId('mock-pagetitleheader').textContent).toContain("Erato's Sewing Studio"));
	});

	it('renders the boutique page title', async () => {
		render(<BoutiquePage />);
		await waitFor(() => expect(screen.getByTestId('mock-pagetitleheader').textContent).toContain("Thalia's Boutique"));
	});

	it('renders the contact page title and contact info links', async () => {
		render(<ContactUsPage />);
		await waitFor(() => expect(screen.getByTestId('mock-pagetitleheader').textContent).toContain('Contact Three Muses'));
		expect(screen.getByText(/info@thethreemusesofbluffton.com/i)).toBeTruthy();
	});

	it('renders the FAQ page header and accordion', async () => {
		render(<FAQsPage />);
		await waitFor(() => expect(screen.getByTestId('mock-pagetitleheader').textContent).toContain('Frequently Asked Questions'));
		expect(screen.getByTestId('mock-faqaccordion')).toBeTruthy();
	});

	it('renders the style guide UI', () => {
		render(<StyleGuidePage />);
		expect(screen.getByTestId('mock-styleguideui')).toBeTruthy();
	});

	it('renders the blog calendar markdown content', async () => {
		render(<BlogCalendarPage />);
		await waitFor(() => expect(screen.getByTestId('mock-markdown')).toBeTruthy());
	});

	it('renders the updates page markdown section', async () => {
		render(<UpdatesPage />);
		await waitFor(() => expect(screen.getByTestId('mock-markdown')).toBeTruthy());
	});

	// Register page removed; remaining coverage is for active routes.
});
