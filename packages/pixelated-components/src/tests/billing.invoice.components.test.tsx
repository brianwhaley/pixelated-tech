import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../test/test-utils';
import React from 'react';

vi.mock('../components/admin/site-health/site-health-google-analytics', () => ({
	SiteHealthGoogleAnalytics: ({ siteName }: { siteName: string }) => (
		<div data-testid="ga-card">Google Analytics for {siteName}</div>
	),
}));

vi.mock('../components/admin/site-health/site-health-cloudwatch', () => ({
	SiteHealthCloudwatch: ({ siteName }: { siteName: string }) => (
		<div data-testid="cloudwatch-card">CloudWatch Uptime for {siteName}</div>
	),
}));

import { InvoiceTemplate } from '../components/admin/billing/billing.invoice.components';

describe('InvoiceTemplate Component', () => {
	const mockInvoice = {
		invoiceNumber: 'INV-001',
		invoiceDate: '2026-06-18',
		dueDate: '2026-07-18',
		billingMonth: '2026-06',
		companyName: 'Test Company',
		address: '123 Address',
		email: 'test@test.com',
		siteName: 'Test Site',
		siteUrl: 'https://test.com',
		tier: 'standard',
		items: [{ description: 'Test Plan', amount: 150 }],
		totalOwed: 150,
		paymentInfo: { method: 'Cash', details: 'Hand over', terms: 'Net 30' },
		posts: [],
		socialReferrers: []
	};

	it('renders correctly with html content', () => {
		render(<InvoiceTemplate invoice={mockInvoice} html="<h1>Mock HTML</h1>" />);
		
		expect(screen.getByTestId('invoice-preview-container')).toBeInTheDocument();
		expect(screen.queryByTestId('back-btn')).not.toBeInTheDocument();
	});

	it('renders an invoice without note or posts', () => {
		const invoiceWithoutExtras = {
			...mockInvoice,
			note: undefined,
			posts: [],
		};

		render(<InvoiceTemplate invoice={invoiceWithoutExtras as any} html="<h1>Mock HTML</h1>" />);

		expect(screen.getByTestId('invoice-preview-container')).toBeInTheDocument();
		expect(screen.queryByText('Published Content')).not.toBeInTheDocument();
		expect(screen.queryByText('NOTE:')).not.toBeInTheDocument();
	});

	it('renders back button and fires onBack callback', () => {
		const onBackMock = vi.fn();
		render(<InvoiceTemplate invoice={mockInvoice} html="<h1>Mock HTML</h1>" onBack={onBackMock} />);
		
		const backBtn = screen.getByTestId('back-btn');
		expect(backBtn).toBeInTheDocument();
		
		fireEvent.click(backBtn);
		expect(onBackMock).toHaveBeenCalledOnce();
	});

	it('renders posts and note content when invoice includes additional details', () => {
		const invoiceWithPosts = {
			...mockInvoice,
			note: 'Thank you for your business.',
			posts: [
				{
					title: 'Post One',
					url: 'https://test.com/post-one',
					date: '2026-06-01T12:00:00Z',
					views: 100,
					socialLinks: ['https://twitter.com/test'],
				},
			],
		};

		render(<InvoiceTemplate invoice={invoiceWithPosts as any} html="<h1>Mock HTML</h1>" />);

		expect(screen.getByText('Published Content')).toBeInTheDocument();
		expect(screen.getByText('Post One')).toBeInTheDocument();
		expect(screen.getByText('Thank you for your business.')).toBeInTheDocument();
		expect(screen.getByText('https://twitter.com/test')).toBeInTheDocument();
	});

	it('renders a note list when invoice.note is an array', () => {
		const invoiceWithNoteList = {
			...mockInvoice,
			note: ['First note line.', 'Second note line.', 'Third note line.'],
		};

		render(<InvoiceTemplate invoice={invoiceWithNoteList as any} html="<h1>Mock HTML</h1>" />);

		expect(screen.getByText('NOTE:')).toBeInTheDocument();
		expect(screen.getByText('First note line.')).toBeInTheDocument();
		expect(screen.getByText('Second note line.')).toBeInTheDocument();
		expect(screen.getByText('Third note line.')).toBeInTheDocument();
		expect(screen.getAllByRole('listitem')).toHaveLength(3);
	});

	it('renders enhancements section when invoice includes enhancements', () => {
		const invoiceWithEnhancements = {
			...mockInvoice,
			enhancements: ['Added schema markup', 'Published press release'],
		};

		render(<InvoiceTemplate invoice={invoiceWithEnhancements as any} html="<h1>Mock HTML</h1>" />);

		expect(screen.getByText('Enhancements')).toBeInTheDocument();
		expect(screen.getByText('Added schema markup')).toBeInTheDocument();
		expect(screen.getByText('Published press release')).toBeInTheDocument();
	});

	it('does not render enhancements section when there are no enhancements', () => {
		render(<InvoiceTemplate invoice={mockInvoice} html="<h1>Mock HTML</h1>" />);
		expect(screen.queryByText('Enhancements')).not.toBeInTheDocument();
	});

	it('renders analytics and uptime cards when GA4 property ID is configured', () => {
		const invoiceWithAnalytics = {
			...mockInvoice,
			ga4PropertyId: '123456789',
		};

		render(<InvoiceTemplate invoice={invoiceWithAnalytics as any} html="<h1>Mock HTML</h1>" />);
		expect(screen.getByTestId('ga-card')).toBeInTheDocument();
		expect(screen.getByTestId('cloudwatch-card')).toBeInTheDocument();
	});

	it('does not render analytics card when GA4 property ID is missing or placeholder', () => {
		const invoiceWithoutAnalytics = {
			...mockInvoice,
			ga4PropertyId: undefined,
		};

		render(<InvoiceTemplate invoice={invoiceWithoutAnalytics as any} html="<h1>Mock HTML</h1>" />);
		expect(screen.queryByTestId('ga-card')).not.toBeInTheDocument();
	});

	it('still renders CloudWatch card when the GA4 key is missing or placeholder', () => {
		const invoiceWithoutAnalytics = {
			...mockInvoice,
			ga4PropertyId: undefined,
		};

		render(<InvoiceTemplate invoice={invoiceWithoutAnalytics as any} html="<h1>Mock HTML</h1>" />);
		expect(screen.queryByTestId('ga-card')).not.toBeInTheDocument();
		expect(screen.getByTestId('cloudwatch-card')).toBeInTheDocument();
	});

	it('hides both site health cards when site health is disabled', () => {
		const invoiceWithoutSiteHealth = {
			...mockInvoice,
			ga4PropertyId: '123456789',
			showSiteHealth: false,
		};

		render(<InvoiceTemplate invoice={invoiceWithoutSiteHealth as any} html="<h1>Mock HTML</h1>" />);
		expect(screen.queryByTestId('ga-card')).not.toBeInTheDocument();
		expect(screen.queryByTestId('cloudwatch-card')).not.toBeInTheDocument();
	});

	it('hides the billing cycle for ad hoc invoices', () => {
		const adHocInvoice = {
			...mockInvoice,
			showBillingCycle: false,
		};

		render(<InvoiceTemplate invoice={adHocInvoice as any} html="<h1>Mock HTML</h1>" />);
		expect(screen.queryByText('Billing Cycle: 2026-06')).not.toBeInTheDocument();
	});

	it('renders error if invoice is missing', () => {
		render(<InvoiceTemplate invoice={null as any} html="" />);
		expect(screen.getByTestId('invoice-error')).toBeInTheDocument();
	});
});
