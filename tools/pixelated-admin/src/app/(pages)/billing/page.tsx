'use client';

import React from 'react';
import { PageSection, PageTitleHeader } from '@pixelated-tech/components';
import { BillingDashboard } from '@pixelated-tech/components/adminclient';

export default function BillingPage() {
	return (
		<>
			<PageTitleHeader title="Billing Dashboard" />
			<PageSection id="billing-dashboard-section" maxWidth="1024px" columns={1}>
				<BillingDashboard />
			</PageSection>
		</>
	);
}
