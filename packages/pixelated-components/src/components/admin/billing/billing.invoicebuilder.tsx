'use server';

import React from 'react';
import { notFound } from 'next/navigation';
import { InvoiceView } from './billing.invoice.components';
import { loadBillingConfigData } from './billing.server';
import { compileInvoiceData } from './billing.functions';
import { getLiveBillingStats } from '../../integrations/wordpress.jetpack.server';
import { getFullPixelatedConfig } from '../../config/config';

interface InvoiceBuilderProps {
  siteName: string;
  billingCycle: string;
}

export async function InvoiceBuilder({ siteName, billingCycle }: InvoiceBuilderProps) {
	const billingData = await loadBillingConfigData(billingCycle, siteName);
	const config = getFullPixelatedConfig() as any;
	const wpToken = config?.integrations?.wordpress?.apiToken;

	const site = billingData.sites.find((s) => s.name === siteName);
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
		socialReferrers,
		billingData.formCompletions || [],
		billingData.enhancements || {}
	);

	return (
		<div className="print-invoice-page">
			<InvoiceView invoice={compiledInvoice} />
		</div>
	);
}
