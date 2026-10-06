'use client';

import React from 'react';
import { PageSection, PageTitleHeader } from '@pixelated-tech/components';
import { MonthlyBillingDashboard } from '@pixelated-tech/components/adminclient';

export default function MonthlyBillingPage() {
	return (
		<>
			<PageTitleHeader title="Monthly Billing Dashboard" />
			<PageSection id="billing-dashboard-section" maxWidth="1024px" columns={1}>
				<MonthlyBillingDashboard />
			</PageSection>
		</>
	);
}