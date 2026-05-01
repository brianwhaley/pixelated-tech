import { NextResponse } from 'next/server';
import { captureSquarePayment } from '@pixelated-tech/components';

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const sourceId = body?.sourceId;
		const checkoutData = body?.checkoutData;
		if (!sourceId || !checkoutData) {
			return NextResponse.json({ error: 'sourceId and checkoutData are required' }, { status: 400 });
		}

		const idempotencyKey = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
		const captureResponse = await captureSquarePayment(sourceId, checkoutData, idempotencyKey);
		return NextResponse.json(captureResponse);
	} catch (error: any) {
		console.error('Error capturing Square payment:', error);
		return NextResponse.json({ error: error?.message || 'Failed to capture payment' }, { status: 500 });
	}
}
