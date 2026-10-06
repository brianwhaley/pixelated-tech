export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export const headers = () => [{
	key: 'Cache-Control',
	value: 'no-store, no-cache, max-age=0, s-maxage=0, must-revalidate',
},{
	key: 'Pragma',
	value: 'no-cache',
},{
	key: 'Expires',
	value: '0',
}];

import React from 'react';
import { PageSection, PageSectionHeader, PageTitleHeader, Table } from '@pixelated-tech/components';
import {
	DEFAULT_PIXELATED_FORM_SUBMISSIONS_TABLE,
	listPixelatedFormSubmissionReportRows,
} from '@pixelated-tech/components/server';

function normalizeSearchParam(value: string | string[] | undefined) {
	if (Array.isArray(value)) {
		return value[0] ?? '';
	}
	return value ?? '';
}

export default async function FormSubmitsReportPage({
	searchParams,
}: {
	searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
	const resolvedSearchParams = await searchParams;
	const domain = normalizeSearchParam(resolvedSearchParams?.domain);
	const formName = normalizeSearchParam(resolvedSearchParams?.formName);
	const fromDate = normalizeSearchParam(resolvedSearchParams?.fromDate);
	const toDate = normalizeSearchParam(resolvedSearchParams?.toDate);

	const rows = await listPixelatedFormSubmissionReportRows({
		tableName: DEFAULT_PIXELATED_FORM_SUBMISSIONS_TABLE,
	});

	const domains = Array.from(new Set(rows
		.map((row) => String(row.domain || '').trim())
		.filter((value) => value !== '')
	)).sort();

	const formNames = Array.from(new Set(rows
		.map((row) => String(row.formName || '').trim())
		.filter((value) => value !== '')
	)).sort();

	const filteredRows = rows.filter((row) => {
		if (domain && String(row.domain || '').trim() !== String(domain).trim()) {
			return false;
		}
		if (formName && String(row.formName || '').trim() !== String(formName).trim()) {
			return false;
		}
		if ((fromDate || toDate) && !row.timestamp) {
			return false;
		}
		if (fromDate) {
			const rowTime = new Date(row.timestamp).getTime();
			const startTime = new Date(fromDate).getTime();
			if (Number.isNaN(rowTime) || rowTime < startTime) return false;
		}
		if (toDate) {
			const rowTime = new Date(row.timestamp).getTime();
			const endTime = new Date(toDate).getTime();
			if (Number.isNaN(rowTime) || rowTime > endTime) return false;
		}
		return true;
	});

	const tableData = filteredRows.map((row) => ({
		formName: row.formName || row.form_name || '',
		timestamp: row.timestamp || row.created_at || '',
		data: row,
	}));

	return (
		<>
			<PageTitleHeader title="Form Submissions Report" />

			<PageSection columns={1} maxWidth="1024px" id="pixelated-admin-form-submissions-filters-section">
				<PageSectionHeader title="Report Filters" />
				<form method="get" style={{ display: 'grid', gap: '1rem', marginTop: '0.75rem' }}>
					<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
						<label>
							Domain
							<select name="domain" defaultValue={domain}>
								<option value="">All</option>
								{domains.map((domainOption) => (
									<option key={domainOption} value={domainOption}>{domainOption}</option>
								))}
							</select>
						</label>
						<label>
							Form Name
							<select name="formName" defaultValue={formName}>
								<option value="">All</option>
								{formNames.map((formNameOption) => (
									<option key={formNameOption} value={formNameOption}>{formNameOption}</option>
								))}
							</select>
						</label>
					</div>
					<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
						<label>
							From Date
							<input name="fromDate" type="date" defaultValue={fromDate} />
						</label>
						<label>
							To Date
							<input name="toDate" type="date" defaultValue={toDate} />
						</label>
					</div>
					<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
						<div style={{ alignSelf: 'end', justifySelf: 'end' }}>
							<button type="submit">Apply Filters</button>
						</div>
						<div style={{ alignSelf: 'end' }}>
							<button type="submit" form="clearFormFilters">Clear Filters</button>
						</div>
					</div>
				</form>
				<form id="clearFormFilters" action="/form-submits"></form>
			</PageSection>

			<PageSection columns={1} maxWidth="100%" id="pixelated-admin-form-submissions-report-section">
				<PageSectionHeader title={`Form Submission Rows (${tableData.length})`} />
				{tableData.length > 0 ? (
					<div style={{ overflowX: 'auto', width: '100%' }}>
						<Table
							id="pixelated-admin-form-submissions-report"
							key={`${domain || 'domain'}-${formName || 'formName'}-${fromDate || 'fromDate'}-${toDate || 'toDate'}`}
							data={tableData}
						/>
					</div>
				) : (
					<div>No form submission rows were found for the selected filters.</div>
				)}
			</PageSection>
		</>
	);
}
