import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '../test/test-utils';
import React from 'react';
import { BillingDashboard } from '../components/admin/billing/billing.dashboard.components';
import { smartFetch } from '../components/foundation/smartfetch';

vi.mock('../components/foundation/smartfetch', () => ({
	smartFetch: vi.fn()
}));

vi.mock('../components/admin/billing/billing.invoice.components', () => ({
	default: ({ onBack }: { onBack: () => void }) => (
		<div data-testid="invoice-view">
			<button data-testid="back-btn" onClick={onBack}>Back</button>
		</div>
	)
}));

describe('BillingDashboard Component', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		
		// Mock default site config fetch
		vi.mocked(smartFetch).mockResolvedValue({
			sites: [
				{ name: 'billable1', url: 'https://b1.com', billing: { tier: 'standard', email: 'b1@test.com' } },
				{ name: 'billable2', url: 'https://b2.com', billing: { tier: 'premium', email: 'b2@test.com', priceOverride: 500 } },
				{ name: 'non-billable', url: 'https://nobill.com' }
			],
			subscriptions: {
				standard: { price: 200, services: [] },
				premium: { price: 400, services: [] }
			},
			paymentInfo: { method: 'Cash', details: '', terms: '' }
		});
	});

	it('renders loading state initially', () => {
		// Mock a delayed promise so loading is visible
		vi.mocked(smartFetch).mockReturnValue(new Promise(() => {}));
		render(<BillingDashboard />);
		expect(screen.getByText('Loading billing metadata details...')).toBeInTheDocument();
	});

	it('loads sites and filters non-billable ones out', async () => {
		render(<BillingDashboard />);
		
		await waitFor(() => {
			expect(screen.queryByText('Loading billing metadata details...')).not.toBeInTheDocument();
		});

		expect(screen.getByText('billable1 (https://b1.com)')).toBeInTheDocument();
		expect(screen.getByText('billable2 (https://b2.com)')).toBeInTheDocument();
		expect(screen.queryByText('non-billable (https://nobill.com)')).not.toBeInTheDocument();
	});

	it('toggles selection of all sites', async () => {
		render(<BillingDashboard />);
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

	it('handles generating invoices via backend API', async () => {
		render(<BillingDashboard />);
		await waitFor(() => expect(screen.queryByText('Loading billing metadata details...')).not.toBeInTheDocument());

		vi.mocked(smartFetch).mockResolvedValueOnce({
			success: true,
			results: [
				{ siteName: 'billable1', success: true, pdfPath: '/inv.pdf', email: 'test@test.com' }
			]
		});

		const generateBtn = screen.getByText('Generate Invoices');
		fireEvent.click(generateBtn);

		await waitFor(() => {
			expect(screen.getByText('2. Review Generated PDF Invoices')).toBeInTheDocument();
		});

		expect(screen.getByText('📄 View Generated PDF File')).toBeInTheDocument();
	});

	it('shows interactive preview modal on click and supports back button', async () => {
		render(<BillingDashboard />);
		await waitFor(() => expect(screen.queryByText('Loading billing metadata details...')).not.toBeInTheDocument());

		vi.mocked(smartFetch).mockResolvedValueOnce({
			success: true,
			results: [
				{ siteName: 'billable1', invoiceData: { invoiceNumber: '123' }, html: '<p>Hi</p>' }
			]
		});

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
		render(<BillingDashboard />);
		await waitFor(() => expect(screen.queryByText('Loading billing metadata details...')).not.toBeInTheDocument());

		// 1. Generate
		vi.mocked(smartFetch).mockResolvedValueOnce({
			success: true,
			results: [
				{ siteName: 'billable1', success: true, pdfPath: '/inv.pdf', email: 'test@test.com' }
			]
		});

		fireEvent.click(screen.getByText('Generate Invoices'));
		await waitFor(() => expect(screen.getByText('2. Review Generated PDF Invoices')).toBeInTheDocument());

		// 2. Email
		vi.mocked(smartFetch).mockResolvedValueOnce({
			success: true,
			logs: ['[LOG] Email sent to test@test.com']
		});

		fireEvent.click(screen.getByText('Email Invoices'));

		await waitFor(() => {
			expect(screen.getByText('Email Dispatch logs')).toBeInTheDocument();
		});
		
		expect(screen.getByText('[LOG] Email sent to test@test.com')).toBeInTheDocument();
	});

	it('handles load errors correctly', async () => {
		// Mock call failing entirely
		vi.mocked(smartFetch).mockRejectedValueOnce(new Error('fail'));

		render(<BillingDashboard />);
		await waitFor(() => expect(screen.queryByText('Loading billing metadata details...')).not.toBeInTheDocument());

		expect(screen.getByText(/No billable sites configured/i)).toBeInTheDocument();
	});
});
