import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '../test/test-utils';
import React from 'react';
import { AdHocBillingDashboard, MonthlyBillingDashboard } from '../components/admin/billing/billing.dashboard.components';
import { loadAdHocBillingConfigData, loadBillingConfigData, generateAdHocInvoice, generateInvoicePdfsForSites, dispatchInvoiceEmails } from '../components/admin/billing/billing.server';

vi.mock('../components/admin/billing/billing.server', () => ({
	loadBillingConfigData: vi.fn(),
	loadAdHocBillingConfigData: vi.fn(),
	generateAdHocInvoice: vi.fn(),
	generateInvoicePdfsForSites: vi.fn(),
	dispatchInvoiceEmails: vi.fn()
}));

vi.mock('../components/admin/billing/billing.invoice.components', () => ({
	default: ({ onBack }: { onBack: () => void }) => (
		<div data-testid="invoice-view">
			<button data-testid="back-btn" onClick={onBack}>Back</button>
		</div>
	)
}));

describe('MonthlyBillingDashboard Component', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		
		// Mock default billing config fetch
		vi.mocked(loadBillingConfigData).mockResolvedValue({
			sites: [
				{ name: 'billable1', url: 'https://b1.com', monthlyBilling: { tier: 'standard', email: 'b1@test.com', companyName: 'Billable One', address: '123 Test Ln' } },
				{ name: 'billable2', url: 'https://b2.com', monthlyBilling: { tier: 'premium', email: 'b2@test.com', priceOverride: 500, companyName: 'Billable Two', address: '456 Test Ave' } },
				{ name: 'non-billable', url: 'https://nobill.com' }
			],
			subscriptions: {
				standard: { price: 200, services: [] },
				premium: { price: 400, services: [] }
			},
			paymentInfo: { method: 'Cash', details: '', terms: '' },
			formCompletions: []
		});
	});

	it('renders loading state initially', () => {
		// Mock a delayed promise so loading is visible
		render(<MonthlyBillingDashboard />);
		expect(screen.getByText('Loading billing metadata details...')).toBeInTheDocument();
	});

	it('loads sites and filters non-billable ones out', async () => {
		render(<MonthlyBillingDashboard />);
		
		await waitFor(() => {
			expect(screen.queryByText('Loading billing metadata details...')).not.toBeInTheDocument();
		});

		expect(screen.getByText('billable1 (https://b1.com)')).toBeInTheDocument();
		expect(screen.getByText('billable2 (https://b2.com)')).toBeInTheDocument();
		expect(screen.queryByText('non-billable (https://nobill.com)')).not.toBeInTheDocument();
	});

	it('toggles selection of all sites', async () => {
		render(<MonthlyBillingDashboard />);
		await waitFor(() => expect(screen.queryByText('Loading billing metadata details...')).not.toBeInTheDocument());

		const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
		
		// Uncheck all
		fireEvent.click(selectAllCheckbox);
		
		// Verify individual boxes are unchecked
		const checkboxes = screen.getAllByRole('checkbox');
		expect((checkboxes[1] as HTMLInputElement).checked).toBe(false);
		expect((checkboxes[2] as HTMLInputElement).checked).toBe(false);

		// Check all
		fireEvent.click(selectAllCheckbox);
		expect((checkboxes[1] as HTMLInputElement).checked).toBe(true);
		expect((checkboxes[2] as HTMLInputElement).checked).toBe(true);
	});

	it('handles generating invoices via server action', async () => {
		render(<MonthlyBillingDashboard />);
		await waitFor(() => expect(screen.queryByText('Loading billing metadata details...')).not.toBeInTheDocument());

		vi.mocked(generateInvoicePdfsForSites).mockResolvedValueOnce([
			{ siteName: 'billable1', success: true, pdfPath: '/inv.pdf', email: 'test@test.com' }
		]);

		const generateBtn = screen.getByText('Generate Invoices');
		fireEvent.click(generateBtn);

		await waitFor(() => {
			expect(screen.getByText('2. Review Generated PDF Invoices')).toBeInTheDocument();
		});

		expect(screen.getByText('📄 View Generated PDF File')).toBeInTheDocument();
	});

	it('shows interactive preview modal on click and supports back button', async () => {
		render(<MonthlyBillingDashboard />);
		await waitFor(() => expect(screen.queryByText('Loading billing metadata details...')).not.toBeInTheDocument());

		vi.mocked(generateInvoicePdfsForSites).mockResolvedValueOnce([
			{ siteName: 'billable1', invoiceData: { invoiceNumber: '123' } }
		] as any);

		const previewBtns = screen.getAllByText('Interactive Preview');
		fireEvent.click(previewBtns[0]);

		await waitFor(() => {
			expect(screen.getByTestId('invoice-view')).toBeInTheDocument();
		});

		// Click back
		fireEvent.click(screen.getByTestId('back-btn'));

		await waitFor(() => {
			expect(screen.queryByTestId('invoice-view')).not.toBeInTheDocument();
		});
	});

	it('handles emailing invoices successfully', async () => {
		render(<MonthlyBillingDashboard />);
		await waitFor(() => expect(screen.queryByText('Loading billing metadata details...')).not.toBeInTheDocument());

		// 1. Generate
		vi.mocked(generateInvoicePdfsForSites).mockResolvedValueOnce([
			{ siteName: 'billable1', success: true, pdfPath: '/inv.pdf', email: 'test@test.com' }
		]);

		fireEvent.click(screen.getByText('Generate Invoices'));
		await waitFor(() => expect(screen.getByText('2. Review Generated PDF Invoices')).toBeInTheDocument());

		// 2. Email
		vi.mocked(dispatchInvoiceEmails).mockResolvedValueOnce(['[LOG] Email sent to test@test.com']);

		fireEvent.click(screen.getByText('Email Invoices'));

		await waitFor(() => {
			expect(screen.getByText('Email Dispatch logs')).toBeInTheDocument();
		});
		
		expect(screen.getByText('[LOG] Email sent to test@test.com')).toBeInTheDocument();
	});

	it('handles load errors correctly', async () => {
		// Mock the billing config loader failing entirely
		vi.mocked(loadBillingConfigData).mockRejectedValueOnce(new Error('fail'));

		render(<MonthlyBillingDashboard />);
		await waitFor(() => expect(screen.queryByText('Loading billing metadata details...')).not.toBeInTheDocument());

		expect(screen.getByText(/No billable sites configured/i)).toBeInTheDocument();
	});
});

describe('AdHocBillingDashboard Component', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.mocked(loadAdHocBillingConfigData).mockResolvedValue({
			invoiceNumbers: ['INV-20261004-AMAVA-001'],
			paymentInfo: { method: 'Cash', details: '', terms: '' },
		});
	});

	it('selects only an invoice number and keeps email disabled until PDF generation succeeds', async () => {
		render(<AdHocBillingDashboard />);

		await waitFor(() => expect(screen.queryByText('Loading ad hoc invoices...')).not.toBeInTheDocument());

		expect(screen.queryByLabelText('Site')).not.toBeInTheDocument();
		expect(screen.getByLabelText('Invoice Number')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Email Invoice' })).toBeDisabled();

		vi.mocked(generateAdHocInvoice).mockResolvedValueOnce({
			siteName: 'AMAVA Janitorial',
			pdfPath: '/invoices/INV-20261004-AMAVA-001.pdf',
			email: 'al@amavajanitorial.com',
			success: true,
		});

		fireEvent.click(screen.getByRole('button', { name: 'Generate PDF' }));

		await waitFor(() => expect(screen.getByText('/invoices/INV-20261004-AMAVA-001.pdf')).toBeInTheDocument());
		expect(generateAdHocInvoice).toHaveBeenCalledWith('INV-20261004-AMAVA-001');
		expect(dispatchInvoiceEmails).not.toHaveBeenCalled();
		expect(screen.getByRole('button', { name: 'Email Invoice' })).not.toBeDisabled();
	});

	it('emails only after the generated PDF is reviewed and explicitly submitted', async () => {
		render(<AdHocBillingDashboard />);
		await waitFor(() => expect(screen.queryByText('Loading ad hoc invoices...')).not.toBeInTheDocument());

		vi.mocked(generateAdHocInvoice).mockResolvedValueOnce({
			siteName: 'AMAVA Janitorial',
			pdfPath: '/invoices/INV-20261004-AMAVA-001.pdf',
			email: 'al@amavajanitorial.com',
			success: true,
		});
		fireEvent.click(screen.getByRole('button', { name: 'Generate PDF' }));
		await waitFor(() => expect(screen.getByRole('button', { name: 'Email Invoice' })).not.toBeDisabled());

		vi.mocked(dispatchInvoiceEmails).mockResolvedValueOnce(['[LOG] Email sent']);
		fireEvent.click(screen.getByRole('button', { name: 'Email Invoice' }));

		await waitFor(() => expect(screen.getByText('[LOG] Email sent')).toBeInTheDocument());
		expect(dispatchInvoiceEmails).toHaveBeenCalledOnce();
	});
});
