import React from 'react';
import { notFound } from 'next/navigation';
import { InvoiceView } from '@pixelated-tech/components/adminclient';
import { loadBillingData, compileInvoiceData } from '@pixelated-tech/components/adminserver';
import { getLiveBillingStats } from '@pixelated-tech/components/server';
import { getFullPixelatedConfig } from '@pixelated-tech/components/server';
import path from 'path';

interface PrintInvoiceProps {
	params: Promise<{
		siteName: string;
		billingCycle: string;
	}>;
}

export default async function PrintInvoicePage({ params }: PrintInvoiceProps) {
	const { siteName, billingCycle } = await params;
	
	try {
		// Load billing configs
		const sitesPath = path.join(process.cwd(), 'src/app/data/sites.json');
		const billingData = loadBillingData(sitesPath);

		// Read configuration details
		const config = getFullPixelatedConfig() as any;
		const wpToken = config?.integrations?.wordpress?.apiToken;

		const site = billingData.sites.find(s => s.name === siteName);
		if (!site || !site.billing) {
			return notFound();
		}

		const wpSiteId = site.blogRss 
			? site.blogRss.replace('https://', '').replace('http://', '').split('/')[0]
			: undefined;

		const { posts, socialReferrers } = await getLiveBillingStats(
			wpSiteId,
			billingCycle,
			wpToken
		);

		const compiledInvoice = compileInvoiceData(
			site,
			billingCycle,
			billingData.subscriptions,
			billingData.paymentInfo,
			posts,
			socialReferrers
		);

		return (
			<div className="print-invoice-page">
				<InvoiceView invoice={compiledInvoice} />
			</div>
		);
	} catch (error) {
		console.error("Print page error:", error);
		return <div style={{ padding: '20px', color: 'red' }}>Error rendering invoice print view</div>;
	}
}
