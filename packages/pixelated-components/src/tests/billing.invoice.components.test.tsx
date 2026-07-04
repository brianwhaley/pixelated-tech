import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../test/test-utils';
import React from 'react';
import { InvoiceView } from '../components/admin/billing/billing.invoice.components';

describe('InvoiceView Component', () => {
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
		render(<InvoiceView invoice={mockInvoice} html="<h1>Mock HTML</h1>" />);
		
		expect(screen.getByTestId('invoice-preview-container')).toBeInTheDocument();
		expect(screen.queryByTestId('back-btn')).not.toBeInTheDocument();
	});

	it('renders an invoice without note or posts', () => {
		const invoiceWithoutExtras = {
			...mockInvoice,
			note: undefined,
			posts: [],
		};

		render(<InvoiceView invoice={invoiceWithoutExtras as any} html="<h1>Mock HTML</h1>" />);

		expect(screen.getByTestId('invoice-preview-container')).toBeInTheDocument();
		expect(screen.queryByText('Published Content & Analytics Overview')).not.toBeInTheDocument();
		expect(screen.queryByText('NOTE:')).not.toBeInTheDocument();
	});

	it('renders back button and fires onBack callback', () => {
		const onBackMock = vi.fn();
		render(<InvoiceView invoice={mockInvoice} html="<h1>Mock HTML</h1>" onBack={onBackMock} />);
		
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

		render(<InvoiceView invoice={invoiceWithPosts} html="<h1>Mock HTML</h1>" />);

		expect(screen.getByText('Published Content & Analytics Overview')).toBeInTheDocument();
		expect(screen.getByText('Post One')).toBeInTheDocument();
		expect(screen.getByText('Thank you for your business.')).toBeInTheDocument();
		expect(screen.getByText('https://twitter.com/test')).toBeInTheDocument();
	});

	it('renders error if invoice is missing', () => {
		render(<InvoiceView invoice={null as any} html="" />);
		expect(screen.getByTestId('invoice-error')).toBeInTheDocument();
	});
});
