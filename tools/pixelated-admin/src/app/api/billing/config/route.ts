import { NextResponse } from 'next/server';
import { loadBillingData } from '@pixelated-tech/components/adminserver';
import path from 'path';

export async function GET() {
	try {
		const sitesPath = path.join(process.cwd(), 'src/app/data/sites.json');
		const billingData = loadBillingData(sitesPath);
		return NextResponse.json(billingData);
	} catch (error) {
		console.error('Error loading billing configuration:', error);
		return NextResponse.json({ error: 'Failed to load billing configuration' }, { status: 500 });
	}
}
