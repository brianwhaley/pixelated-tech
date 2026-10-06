import React from 'react';
import { MonthlyInvoiceBuilder } from '@pixelated-tech/components/adminserver';
import { PageTitleHeader } from '@pixelated-tech/components';

interface PrintInvoiceProps {
	params: Promise<{
		siteName: string;
		billingCycle: string;
	}>;
}

export default async function PrintInvoicePage({ params }: PrintInvoiceProps) {
	const { siteName, billingCycle } = await params;
	return (
		<>
			<PageTitleHeader title={`Invoice for ${siteName} - ${billingCycle}`} />
			<MonthlyInvoiceBuilder siteName={siteName} billingCycle={billingCycle} />
		</>
	);
}
