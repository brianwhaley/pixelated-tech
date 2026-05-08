import { NextResponse } from 'next/server';
import { createSquareOrderAndCapturePayment } from '@pixelated-tech/components/server';

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const sourceId = body?.sourceId;
		const checkoutData = body?.checkoutData;
		if (!sourceId || !checkoutData) {
			return NextResponse.json({ error: 'sourceId and checkoutData are required' }, { status: 400 });
		}

		const captureResponse = await createSquareOrderAndCapturePayment(sourceId, checkoutData);
		return NextResponse.json({
			...captureResponse,
		});
	} catch (error: any) {
		console.error('Error creating Square order or capturing payment:', error);
		return NextResponse.json({ error: error?.message || 'Failed to create order or capture payment' }, { status: 500 });
	}
}
