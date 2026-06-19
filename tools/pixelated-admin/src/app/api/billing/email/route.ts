import { NextResponse } from 'next/server';
import { dispatchInvoiceEmails } from '@pixelated-tech/components/adminserver';

interface EmailInvoiceTarget {
	siteName: string;
	pdfPath: string;
	email: string;
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { invoices } = body as { invoices: EmailInvoiceTarget[] };

		if (!Array.isArray(invoices) || invoices.length === 0) {
			return NextResponse.json({ success: false, message: 'invoices array is required' }, { status: 400 });
		}

		// Delegate the SMTP transporter logic and loops fully to the standalone component package
		const logs = await dispatchInvoiceEmails(invoices);

		return NextResponse.json({
			success: true,
			logs
		});

	} catch (error) {
		console.error('Invoice emailing critical error:', error);
		return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
	}
}
