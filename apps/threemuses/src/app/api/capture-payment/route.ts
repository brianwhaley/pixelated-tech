import { NextResponse } from 'next/server';
import { captureSquarePayment, createSquareOrder } from '@pixelated-tech/components/server';

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const sourceId = body?.sourceId;
		const checkoutData = body?.checkoutData;
		if (!sourceId || !checkoutData) {
			return NextResponse.json({ error: 'sourceId and checkoutData are required' }, { status: 400 });
		}

		const orderIdempotencyKey = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}-order`;
		const paymentIdempotencyKey = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}-payment`;
		const orderResponse = await createSquareOrder(checkoutData, orderIdempotencyKey);
		const orderId = orderResponse?.order?.id || orderResponse?.order_id || orderResponse?.id;
		const orderTotalMoney = orderResponse?.order?.total_money;
		const paymentAmount = typeof orderTotalMoney?.amount === 'number'
			? orderTotalMoney.amount / 100
			: checkoutData.total;
		const captureResponse = await captureSquarePayment(sourceId, checkoutData, paymentIdempotencyKey, orderId, paymentAmount);
		return NextResponse.json({
			...captureResponse,
			orderResponse,
		});
	} catch (error: any) {
		console.error('Error creating Square order or capturing payment:', error);
		return NextResponse.json({ error: error?.message || 'Failed to create order or capture payment' }, { status: 500 });
	}
}
