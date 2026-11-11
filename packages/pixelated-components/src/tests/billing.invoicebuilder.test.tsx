import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AdHocInvoiceBuilder, MonthlyInvoiceBuilder } from '@/components/admin/billing/billing.invoicebuilder';
import { notFound } from 'next/navigation';
import { loadBillingConfigData } from '@/components/admin/billing/billing.server';
import { compileInvoiceData } from '@/components/admin/billing/billing.functions';
import { compileAdHocInvoiceData } from '@/components/admin/billing/billing.functions';
import { getLiveBillingStats } from '@/components/integrations/wordpress.jetpack.server';

vi.mock('@/components/admin/billing/billing.server', () => ({
	loadBillingConfigData: vi.fn()
}));

vi.mock('@/components/admin/billing/billing.functions', () => ({
	compileInvoiceData: vi.fn(),
	compileAdHocInvoiceData: vi.fn()
}));

vi.mock('@/components/integrations/wordpress.jetpack.server', () => ({
	getLiveBillingStats: vi.fn()
}));

vi.mock('next/navigation', async () => {
	const actual = await vi.importActual<typeof import('next/navigation')>('next/navigation');
	return {
		...actual,
		notFound: vi.fn()
	};
});

describe('InvoiceBuilder', () => {
	beforeEach(() => {
		vi.mocked(loadBillingConfigData).mockResolvedValue({
			sites: [
				{ name: 'example-site', monthlyBilling: { tier: 'growth' }, blogRss: 'https://example.com/blog' }
			],
			subscriptions: [],
			paymentInfo: {},
			formCompletions: [],
			enhancements: {}
		});
		vi.mocked(getLiveBillingStats).mockResolvedValue({ posts: [], socialReferrers: [] });
		vi.mocked(compileInvoiceData).mockReturnValue({ invoice: 'compiled' } as any);
		vi.mocked(compileAdHocInvoiceData).mockReturnValue({ invoice: 'ad-hoc-compiled' } as any);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('renders invoice view when site is found and billing enabled', async () => {
		const result = await MonthlyInvoiceBuilder({ siteName: 'example-site', billingCycle: '2026-01' });
		expect(result).toBeDefined();
		expect(loadBillingConfigData).toHaveBeenCalledWith('2026-01', 'example-site');
		expect(getLiveBillingStats).toHaveBeenCalled();
		expect(compileInvoiceData).toHaveBeenCalled();
	});

	it('calls notFound when site is missing or has no billing', async () => {
		vi.mocked(loadBillingConfigData).mockResolvedValue({
			sites: [{ name: 'other-site', monthlyBilling: undefined }],
			subscriptions: [],
			paymentInfo: {},
			formCompletions: [],
			enhancements: {}
		});
		await MonthlyInvoiceBuilder({ siteName: 'example-site', billingCycle: '2026-01' });
		expect(notFound).toHaveBeenCalled();
	});

	it('uses a missing blog RSS value when loading live billing stats', async () => {
		vi.mocked(loadBillingConfigData).mockResolvedValue({
			sites: [{ name: 'example-site', monthlyBilling: { tier: 'growth' } }],
			subscriptions: [],
			paymentInfo: {},
			formCompletions: [],
			enhancements: {}
		} as any);

		await MonthlyInvoiceBuilder({ siteName: 'example-site', billingCycle: '2026-01' });
		expect(getLiveBillingStats).toHaveBeenCalledWith(undefined, '2026-01', undefined);
	});

	it('renders an ad hoc invoice and calls notFound when it is missing', async () => {
		vi.mocked(loadBillingConfigData).mockResolvedValue({
			sites: [{ name: 'example-site', adHocBilling: [{ invoiceNumber: 'INV-1' }] }],
			subscriptions: [],
			paymentInfo: {},
			formCompletions: [],
			enhancements: {}
		} as any);

		const result = await AdHocInvoiceBuilder({ siteName: 'example-site', invoiceNumber: 'INV-1' });
		expect(result).toBeDefined();
		expect(compileAdHocInvoiceData).toHaveBeenCalled();

		await AdHocInvoiceBuilder({ siteName: 'example-site', invoiceNumber: 'missing' });
		expect(notFound).toHaveBeenCalled();
	});
});
