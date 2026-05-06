export const dynamic = 'force-dynamic';

import React from 'react';
import { PageSection, PageSectionHeader, PageTitleHeader, Table } from '@pixelated-tech/components';
import {
	DEFAULT_PIXELATED_FORM_NAME,
	DEFAULT_PIXELATED_FORM_SUBMISSION_DOMAIN,
	DEFAULT_PIXELATED_FORM_SUBMISSIONS_TABLE,
	listPixelatedFormSubmissionReportRows,
} from '@pixelated-tech/components/server';

function sortReportRows(rows: Array<Record<string, any>>) {
	return [...rows].sort((left, right) => {
		const leftDate = new Date(left.created_at || left.updatedAt || 0).getTime();
		const rightDate = new Date(right.created_at || right.updatedAt || 0).getTime();
		return rightDate - leftDate;
	});
}

export default async function EventReportPage() {
	try {
		const rows = await listPixelatedFormSubmissionReportRows({
			tableName: DEFAULT_PIXELATED_FORM_SUBMISSIONS_TABLE,
			domain: DEFAULT_PIXELATED_FORM_SUBMISSION_DOMAIN,
			formName: DEFAULT_PIXELATED_FORM_NAME,
		});
		const reportRows = sortReportRows(rows);

		return (
			<>
				<PageTitleHeader title="Three Muses Order Report" />
				<PageSection columns={1} maxWidth="100%" id="three-muses-order-report-section">
					<PageSectionHeader title={`${reportRows.length} form submission${reportRows.length === 1 ? '' : 's'}`} />
					<div style={{ marginBottom: '1rem' }}>
						<small>Columns: created_at, shipping_to, registration_data, items</small>
					</div>
					{reportRows.length > 0 ? (
						<div style={{ overflowX: 'auto', width: '100%' }}>
							<Table id="three-muses-order-report" data={reportRows} />
						</div>
					) : (
						<div>No matching form submissions were found.</div>
					)}
				</PageSection>
			</>
		);
	} catch (error: any) {
		return (
			<>
				<PageTitleHeader title="Three Muses Order Report" />
				<PageSection columns={1} id="three-muses-order-report-section">
					<div>Unable to load the report: {error?.message || 'Unknown error'}</div>
				</PageSection>
			</>
		);
	}
}
