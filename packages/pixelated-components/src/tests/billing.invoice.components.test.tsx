import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

	it('renders back button and fires onBack callback', () => {
		const onBackMock = vi.fn();
		render(<InvoiceView invoice={mockInvoice} html="<h1>Mock HTML</h1>" onBack={onBackMock} />);
		
		const backBtn = screen.getByTestId('back-btn');
		expect(backBtn).toBeInTheDocument();
		
		fireEvent.click(backBtn);
		expect(onBackMock).toHaveBeenCalledOnce();
	});

	it('renders error if invoice is missing', () => {
		render(<InvoiceView invoice={null as any} html="" />);
		expect(screen.getByTestId('invoice-error')).toBeInTheDocument();
	});
});
