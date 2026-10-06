import React from 'react';
import { AdHocInvoiceBuilder } from '@pixelated-tech/components/adminserver';
import { PageTitleHeader } from '@pixelated-tech/components';

interface PrintAdHocInvoiceProps {
	params: Promise<{
		siteName: string;
		invoiceNumber: string;
	}>;
}

export default async function PrintAdHocInvoicePage({ params }: PrintAdHocInvoiceProps) {
	const { siteName, invoiceNumber } = await params;
	return (
		<>
			<PageTitleHeader title="Ad-Hoc Invoice" />
			<AdHocInvoiceBuilder siteName={siteName} invoiceNumber={invoiceNumber} />
		</>
	);
}