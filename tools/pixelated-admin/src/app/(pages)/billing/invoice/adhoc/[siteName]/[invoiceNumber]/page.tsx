import React from 'react';
import { AdHocInvoiceBuilder } from '@pixelated-tech/components/adminserver';

interface PrintAdHocInvoiceProps {
	params: Promise<{
		siteName: string;
		invoiceNumber: string;
	}>;
}

export default async function PrintAdHocInvoicePage({ params }: PrintAdHocInvoiceProps) {
	const { siteName, invoiceNumber } = await params;
	return <AdHocInvoiceBuilder siteName={siteName} invoiceNumber={invoiceNumber} />;
}