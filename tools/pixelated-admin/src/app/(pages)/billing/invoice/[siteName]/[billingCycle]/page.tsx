import React from 'react';
import { MonthlyInvoiceBuilder } from '@pixelated-tech/components/adminserver';

interface PrintInvoiceProps {
	params: Promise<{
		siteName: string;
		billingCycle: string;
	}>;
}

export default async function PrintInvoicePage({ params }: PrintInvoiceProps) {
	const { siteName, billingCycle } = await params;
	return <MonthlyInvoiceBuilder siteName={siteName} billingCycle={billingCycle} />;
}
