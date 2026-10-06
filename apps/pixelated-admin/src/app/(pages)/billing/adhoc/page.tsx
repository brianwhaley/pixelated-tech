import React from 'react';
import { PageSection, PageTitleHeader } from '@pixelated-tech/components';
import { AdHocBillingDashboard } from '@pixelated-tech/components/adminclient';

export default function AdHocBillingPage() {
	return (
		<>
			<PageTitleHeader title="Ad Hoc Billing" />
			<PageSection id="adhoc-billing-section" maxWidth="1024px" columns={1}>
				<AdHocBillingDashboard />
			</PageSection>
		</>
	);
}