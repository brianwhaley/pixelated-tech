import { NextResponse } from 'next/server';
import { generateInvoicePdfsForSites } from '@pixelated-tech/components/adminserver';

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { sites: targetSites, billingMonth, previewOnly } = body;

		if (!Array.isArray(targetSites) || targetSites.length === 0 || !billingMonth) {
			return NextResponse.json({ success: false, message: 'sites array and billingMonth are required' }, { status: 400 });
		}

		// Delegate PDF orchestrator generation completely to the standalone components library function
		const results = await generateInvoicePdfsForSites(targetSites, billingMonth, !!previewOnly);

		return NextResponse.json({
			success: true,
			results
		});

	} catch (error) {
		console.error('Invoice generation critical error:', error);
		return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
	}
}
