export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export const headers = () => [
	{
		key: 'Cache-Control',
		value: 'no-store, no-cache, max-age=0, s-maxage=0, must-revalidate',
	},
	{
		key: 'Pragma',
		value: 'no-cache',
	},
	{
		key: 'Expires',
		value: '0',
	},
];

import React from 'react';
import { unstable_noStore as noStore } from 'next/cache';
import { PageSection, PageSectionHeader, PageTitleHeader, Table } from '@pixelated-tech/components';
import {
	DEFAULT_PIXELATED_FORM_NAME,
	DEFAULT_PIXELATED_FORM_SUBMISSION_DOMAIN,
	DEFAULT_PIXELATED_FORM_SUBMISSIONS_TABLE,
	listPixelatedFormSubmissionReportRows,
} from '@pixelated-tech/components/server';

export function sortReportRows(rows: Array<Record<string, any>>) {
	return [...rows].sort((left, right) => {
		const leftDate = new Date(left.created_at || left.updatedAt || 0).getTime();
		const rightDate = new Date(right.created_at || right.updatedAt || 0).getTime();
		return rightDate - leftDate;
	});
}

export function asArray(value: any) {
	if (Array.isArray(value)) {
		return value;
	}
	return value ? [value] : [];
}

export function parsePossibleJson(value: any) {
	if (typeof value !== 'string') {
		return value;
	}
	try {
		return JSON.parse(value);
	} catch {
		return value;
	}
}

export function normalizeReportRow(row: Record<string, any>) {
	const payload = row?.data ? row.data : row;
	const orderData = parsePossibleJson(
		payload.orderData
				?? payload.order_data
				?? payload.orderData_json
				?? payload.data
				?? payload.payload
				?? payload.submissionData,
	);
	const reportSource = orderData && typeof orderData === 'object' ? orderData : payload;
	const checkoutData = reportSource.checkoutData ?? reportSource;
	const shippingTo = payload.shipping_to ?? checkoutData.shippingTo ?? {};
	const registrationData = payload.registration_data ?? shippingTo;
	const items = asArray(payload.items ?? checkoutData.items);
	const createdAt = payload.created_at || payload.updatedAt || '';

	return {
		createdAt,
		createdAtMs: new Date(createdAt || 0).getTime() || 0,
		shippingTo,
		registrationData,
		items,
	};
}

export function getEventIdentity(item: Record<string, any>) {
	return {
		eventId: item.id ?? item.itemID ?? 'Unknown',
		eventName: item.title ?? item.itemTitle ?? 'Unknown',
		quantity: Number(item.quantity ?? item.itemQuantity ?? 1) || 1,
	};
}

export function buildEventGroups(rows: Array<Record<string, any>>) {
	const groups = new Map<string, {
			eventId: string;
			eventName: string;
			latestCreatedAt: number;
			registrants: Array<{ attendee: string; parentGuardian: string }>;
		}>();

	rows.forEach((row) => {
		const parsed = normalizeReportRow(row);
		const attendee = parsed.registrationData?.child_name || parsed.shippingTo?.name || 'Unknown';
		const parentGuardian = parsed.registrationData?.child_name
			? parsed.shippingTo?.name || parsed.registrationData?.emergency_contact_name || ''
			: '';

		parsed.items.forEach((item) => {
			const { eventId, eventName, quantity } = getEventIdentity(item || {});
			const key = `${eventId}::${eventName}`;
			if (!groups.has(key)) {
				groups.set(key, {
					eventId,
					eventName,
					latestCreatedAt: 0,
					registrants: [],
				});
			}

			const group = groups.get(key)!;
			for (let index = 0; index < quantity; index += 1) {
				group.registrants.push({ attendee, parentGuardian });
			}
			group.latestCreatedAt = Math.max(group.latestCreatedAt, parsed.createdAtMs);
		});
	});

	return [...groups.values()]
		.sort((left, right) => right.latestCreatedAt - left.latestCreatedAt || left.eventName.localeCompare(right.eventName))
		.map((group) => ({
			...group,
			registrationCount: group.registrants.length,
		}));
}

export default async function EventReportPage() {
	noStore();

	try {
		const rows = await listPixelatedFormSubmissionReportRows({
			tableName: DEFAULT_PIXELATED_FORM_SUBMISSIONS_TABLE,
			domain: DEFAULT_PIXELATED_FORM_SUBMISSION_DOMAIN,
			formName: DEFAULT_PIXELATED_FORM_NAME,
		});
		const reportRows = sortReportRows(rows);
		const eventGroups = buildEventGroups(reportRows);
		const eventReportRows = eventGroups.map((group) => ({
			'Event ID + Event Name': `${group.eventId} - ${group.eventName}`,
			'Registration Count': group.registrationCount,
			Registrants: group.registrants.map((registrant) => ({
				Attendee: registrant.attendee,
				'Parent / guardian': registrant.parentGuardian || '—',
			})),
		})).sort((left, right) => String(left['Event ID + Event Name']).localeCompare(String(right['Event ID + Event Name'])));

		return (
			<>
				<PageTitleHeader title="Three Muses Order Report" />

				<br /><br />
				<PageSectionHeader title="Registrants Per Class" />
				<PageSection columns={1} maxWidth="100%" id="three-muses-order-report-by-event-section">
					{ /* <div style={{ marginBottom: '1rem' }}>
						<strong>Event breakdown by registration</strong>
					</div>
					<div style={{ marginBottom: '1rem' }}>
						<small>Columns: Event ID + Event Name, Registration Count, Registrants</small>
					</div> */}
					{eventGroups.length > 0 ? (
						<div style={{ overflowX: 'auto', width: '100%' }}>
							<Table id="three-muses-event-report" data={eventReportRows} />
						</div>
					) : (
						<div>No matching event registrations were found.</div>
					)}
				</PageSection>


				<PageSectionHeader title={`Event Registrations ( ${reportRows.length} )`} />
				<PageSection columns={1} maxWidth="100%" id="three-muses-order-report-section">
					{ /* <div style={{ marginBottom: '1rem' }}>
						<small>Columns: created_at, shipping_to, registration_data, items</small>
					</div> */}
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
