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
import { redirect } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';
import { PageSection, PageSectionHeader, PageTitleHeader, Table } from '@pixelated-tech/components';
import {
	DEFAULT_PIXELATED_FORM_SUBMISSIONS_TABLE,
	getFullPixelatedConfig,
	getSquareEventItems,
	listPixelatedFormSubmissionReportRows,
} from '@pixelated-tech/components/server';

const EVENT_FILTER_KEYS = ['active', 'year', 'all'] as const;
export type EventFilterKey = (typeof EVENT_FILTER_KEYS)[number];
const EVENT_FILTER_LABELS: Record<EventFilterKey, string> = {
	active: 'Active Events',
	year: 'This Year',
	all: 'All',
};

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

function parseEventDate(value?: string) {
	if (!value) return undefined;
	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function formatReportDate(value?: string) {
	const date = parseEventDate(value);
	return date ? date.toLocaleDateString('en-US') : undefined;
}

function getEventSortTime(event: { startDate?: string; endDate?: string }) {
	const startDate = parseEventDate(event.startDate);
	const endDate = parseEventDate(event.endDate);
	if (startDate) return startDate.getTime();
	if (endDate) return endDate.getTime();
	return Number.POSITIVE_INFINITY;
}

function eventMatchesFilter(
	event: { eventKey: string; eventName: string; startDate?: string; endDate?: string },
	selectedFilter: EventFilterKey,
	currentTime: number,
	currentYear: number,
	registrationYear: Map<string, number>,
) {
	const startDate = parseEventDate(event.startDate);
	const endDate = parseEventDate(event.endDate);
	const startValid = Boolean(startDate);
	const endValid = Boolean(endDate);

	if (selectedFilter === 'active') {
		if (endValid) {
			return endDate!.getTime() > currentTime;
		}
		if (startValid) {
			return startDate!.getTime() >= currentTime;
		}
		return false;
	}

	if (selectedFilter === 'year') {
		if (startValid || endValid) {
			return (startValid && startDate!.getUTCFullYear() === currentYear)
				|| (endValid && endDate!.getUTCFullYear() === currentYear);
		}
		return registrationYear.get(event.eventKey) === currentYear;
	}

	return true;
}

export function getEventIdentity(item: Record<string, any>) {
	return {
		eventId: item.itemSKU ?? item.itemID ?? item.id ?? 'Unknown',
		eventName: item.title ?? item.itemTitle ?? item.name ?? item.sku ?? item.itemSKU ?? 'Unknown',
		quantity: Number(item.quantity ?? item.itemQuantity ?? 1) || 1,
	};
}

export function getEventMetaIdentity(item: Record<string, any>) {
	const rawId = item?.fields?.id ?? item?.id ?? 'Unknown';
	const eventId = item?.fields?.sku ?? rawId;
	return {
		eventId,
		rawEventId: rawId,
		eventName: item?.fields?.title ?? item?.fields?.name ?? 'Unknown',
		startDate: item?.fields?.startDate,
		endDate: item?.fields?.endDate,
	};
}

export function getEventMetaKey(item: Record<string, any>) {
	return item?.fields?.sku ?? item?.fields?.id ?? item?.id;
}

export function getRegistrationEventKey(item: Record<string, any>) {
	return item?.itemSKU ?? item?.itemID ?? item?.id;
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
			const key = eventId;
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
			if (parsed.createdAtMs >= group.latestCreatedAt) {
				group.eventName = eventName;
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

export default async function EventReportPage({ searchParams }: { searchParams?: Promise<{ v?: string }> } = {}) {
	noStore();
	const resolvedSearchParams = await searchParams;

	try {
		const pixelatedConfig = getFullPixelatedConfig();
		const cartConfig = pixelatedConfig?.integrations?.shoppingcart;
		const domain = cartConfig?.orderDomain ?? '';
		const formName = cartConfig?.orderFormName ?? '';
		const rows = await listPixelatedFormSubmissionReportRows({
			tableName: DEFAULT_PIXELATED_FORM_SUBMISSIONS_TABLE,
			domain,
			formName,
		});
		const reportRows = sortReportRows(rows);
		const selectedFilter = (resolvedSearchParams?.filter === 'year'
			? 'year'
			: resolvedSearchParams?.filter === 'all'
				? 'all'
				: 'active') as EventFilterKey;
		const eventItems = await getSquareEventItems({ includeCompleted: true });
		const currentTime = Date.now();
		const currentYear = new Date().getUTCFullYear();

		const registrationGroups = buildEventGroups(reportRows);
		const registrationYear = new Map<string, number>();
		for (const row of reportRows) {
			const parsed = normalizeReportRow(row);
			const createdAt = new Date(parsed.createdAt || 0);
			const year = createdAt instanceof Date && !Number.isNaN(createdAt.getTime()) ? createdAt.getUTCFullYear() : undefined;
			if (!year) continue;
			parsed.items.forEach((item: any) => {
				const registrationEventKey = getRegistrationEventKey(item || {});
				if (registrationEventKey && !registrationYear.has(registrationEventKey)) {
					registrationYear.set(registrationEventKey, year);
				}
			});
		}

		const eventRoster = eventItems
			.map((item) => ({
				eventKey: getEventMetaKey(item),
				eventName: item?.fields?.title ?? item?.fields?.name ?? 'Unknown',
				startDate: item?.fields?.startDate,
				endDate: item?.fields?.endDate,
			}))
			.filter((event): event is { eventKey: string; eventName: string; startDate?: string; endDate?: string } => Boolean(event.eventKey));

		const unknownEvents = registrationGroups
			.filter((group) => !eventRoster.some((event) => event.eventKey === group.eventId))
			.map((group) => ({
				eventKey: group.eventId,
				eventName: group.eventName,
				startDate: undefined,
				endDate: undefined,
			}));

		const allEvents = [...eventRoster, ...unknownEvents];
		const filteredEvents = allEvents.filter((event) =>
			eventMatchesFilter(event, selectedFilter, currentTime, currentYear, registrationYear),
		);

		filteredEvents.sort((left, right) => {
			const leftTime = getEventSortTime(left);
			const rightTime = getEventSortTime(right);
			if (leftTime !== rightTime) {
				return leftTime - rightTime;
			}
			return left.eventName.localeCompare(right.eventName);
		});

		const eventGroups = new Map(filteredEvents.map((event) => [
			event.eventKey,
			{
				...event,
				registrants: [] as Array<{ attendee: string; parentGuardian: string }> ,
				registrationCount: 0,
				latestCreatedAt: 0,
			},
		]));

		const normalizedRows = reportRows.map(normalizeReportRow);
		const filteredReportRows = normalizedRows
			.filter((row) => row.items.some((item: any) => {
				const registrationEventKey = getRegistrationEventKey(item || {});
				return registrationEventKey ? eventGroups.has(registrationEventKey) : false;
			}))
			.sort((left, right) => right.createdAtMs - left.createdAtMs);

		for (const row of filteredReportRows) {
			const attendee = row.registrationData?.child_name || row.shippingTo?.name || 'Unknown';
			const parentGuardian = row.registrationData?.child_name
				? row.shippingTo?.name || row.registrationData?.emergency_contact_name || ''
				: '';
			row.items.forEach((item: any) => {
				const registrationEventKey = getRegistrationEventKey(item || {});
				if (!registrationEventKey) return;
				const group = eventGroups.get(registrationEventKey);
				if (!group) return;
				const quantity = Number(item.quantity ?? item.itemQuantity ?? 1) || 1;
				for (let index = 0; index < quantity; index += 1) {
					group.registrants.push({ attendee, parentGuardian });
				}
				group.registrationCount += quantity;
				group.latestCreatedAt = Math.max(group.latestCreatedAt, row.createdAtMs);
			});
		}

		const eventReportRows = Array.from(eventGroups.values()).map((group) => ({
			'Event Name': group.eventName,
			'Start Date': formatReportDate(group.startDate) ?? '—',
			'End Date': formatReportDate(group.endDate) ?? '—',
			'Registration Count': group.registrationCount,
			Registrants: group.registrants.map((registrant) => ({
				Attendee: registrant.attendee,
				'Parent / guardian': registrant.parentGuardian || '—',
			})),
		}));

		const requestedVersion = resolvedSearchParams?.v;
		const currentVersion = `${filteredReportRows.length}`;
		if (requestedVersion !== currentVersion && process.env.NODE_ENV !== 'test') {
			redirect(`/events/report?filter=${selectedFilter}&v=${currentVersion}`);
		}

		return (
			<>
				<PageTitleHeader title="The Three Muses of Bluffton Order Report" />

				<div style={{ marginBottom: '1rem', textAlign: 'center' }}>
					<span>FILTERS : </span>
					{EVENT_FILTER_KEYS.map((filterKey) => (
						<a
							key={filterKey}
							href={`/events/report?filter=${filterKey}`}
							style={{
								padding: '10px',
								fontWeight: selectedFilter === filterKey ? '700' : '400',
								textDecoration: selectedFilter === filterKey ? 'underline' : 'none',
							}}
						>
							{EVENT_FILTER_LABELS[filterKey]}
						</a>
					))}
				</div>

				<br /><br />
				<PageSectionHeader title="Registrants Per Class" />
				<PageSection columns={1} maxWidth="100%" id="three-muses-order-report-by-event-section">
					{ /* <div style={{ marginBottom: '1rem' }}>
						<strong>Event breakdown by registration</strong>
					</div>
					<div style={{ marginBottom: '1rem' }}>
						<small>Columns: Event ID + Event Name, Registration Count, Registrants</small>
					</div> */}
					{eventReportRows.length > 0 ? (
						<div style={{ overflowX: 'auto', width: '100%' }}>
							<Table id="three-muses-event-report" data={eventReportRows} />
						</div>
					) : (
						<div>No matching event registrations were found.</div>
					)}
				</PageSection>


				<PageSectionHeader title={`Event Registrations ( ${filteredReportRows.length} )`} />
				<PageSection columns={1} maxWidth="100%" id="three-muses-order-report-section">
					{ /* <div style={{ marginBottom: '1rem' }}>
						<small>Columns: created_at, shipping_to, registration_data, items</small>
					</div> */}
					{filteredReportRows.length > 0 ? (
						<div style={{ overflowX: 'auto', width: '100%' }}>
							<Table id="three-muses-order-report" data={filteredReportRows} />
						</div>
					) : (
						<div>No matching form submissions were found.</div>
					)}
				</PageSection>


			</>
		);
	} catch (error: any) {
		if (typeof error?.message === 'string' && error.message.startsWith('NEXT_REDIRECT')) throw error;
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
