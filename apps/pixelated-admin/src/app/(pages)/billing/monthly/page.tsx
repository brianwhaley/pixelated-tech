import React from 'react';
import { PageSection, PageTitleHeader } from '@pixelated-tech/components';
import { MonthlyBillingDashboard } from '@pixelated-tech/components/adminclient';
import { loadBillingConfigData } from '@pixelated-tech/components/adminserver';

export default async function MonthlyBillingPage() {
	const billingData = await loadBillingConfigData();

	return (
		<>
			<PageTitleHeader title="Monthly Billing Dashboard" />
			<PageSection id="billing-dashboard-section" maxWidth="1024px" columns={1}>
				<MonthlyBillingDashboard initialData={billingData} />
			</PageSection>
		</>
	);
}