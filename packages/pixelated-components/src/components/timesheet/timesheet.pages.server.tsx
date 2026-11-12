"use server";

import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { MenuSimple, Table } from '../elements/index.elements';
import { PageSection, PageSectionHeader } from '../structure/page-blocks';
import { TimesheetEmailForm, TimesheetEntryForm, TimesheetPasscodeForm, TimesheetWeekSelector } from './timesheet.components';
import { getWeekStart, formatWeekLabel } from './timesheet.functions';
import {
	getAuthenticatedTimesheetUser,
	getTimesheetForWeek,
	isTimesheetAdmin,
	listAdminTimesheets,
	listUserTimesheets,
	saveTimesheet,
} from './timesheet.server';
import { DEFAULT_PASSCODE_COOKIE } from '../foundation/auth/passcode-auth.server';

type SearchParams = Record<string, string | string[] | undefined>;

function value(params: SearchParams, name: string) {
	const entry = params[name];
	return Array.isArray(entry) ? entry[0] || '' : entry || '';
}

function menuItems(isAdmin: boolean) {
	return [
		{ name: 'View My Timesheets', path: '/timesheets/summary' },
		{ name: 'Submit a New Timesheet', path: '/timesheets/new' },
		...(isAdmin ? [{ name: 'Admin View', path: '/timesheets/admin' }] : []),
		{ name: 'Logout', path: '/timesheets/auth?action=logout' },
	];
}

async function getUser(domain: string) {
	const cookieStore = await cookies();
	return getAuthenticatedTimesheetUser(domain, cookieStore.get(DEFAULT_PASSCODE_COOKIE)?.value);
}

export async function TimesheetLoginPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
	const params = await searchParams;
	const cookieStore = await cookies();
	const pendingEmail = cookieStore.get(`${DEFAULT_PASSCODE_COOKIE}-pending`)?.value || '';
	const error = value(params, 'error');
	return (
		<PageSection id="timesheet-login" columns={1} maxWidth="640px">
			{error && <p role="alert">That email or passcode could not be verified.</p>}
			{pendingEmail
				? <>
					<PageSectionHeader title="Enter your passcode" />
					<p>A passcode was sent to your registered email address.</p>
					<TimesheetPasscodeForm email={pendingEmail} />
				</>
				: <>
					<PageSectionHeader title="Sign in" />
					<p>Enter your registered email address to receive a passcode.</p>
					<TimesheetEmailForm />
				</>}
		</PageSection>
	);
}

export async function TimesheetSummaryPage({ domain }: { domain: string }) {
	const user = await getUser(domain);
	if (!user) redirect('/timesheets');
	const records = await listUserTimesheets(domain, user.email);
	const rows = records.map((record) => ({
		Week: formatWeekLabel(record.weekOf),
		'Total Hours': record.totalHours,
		Submitted: record.updatedAt,
	}));
	return (
		<PageSection id="timesheet-summary" columns={1} maxWidth="1024px">
			<MenuSimple menuItems={menuItems(user.role === 'admin')} />
			<Table id="timesheet-summary-table" data={rows} sortable />
		</PageSection>
	);
}

export async function TimesheetNewPage({ domain, searchParams }: { domain: string; searchParams: Promise<SearchParams> }) {
	const user = await getUser(domain);
	if (!user) redirect('/timesheets');
	const params = await searchParams;
	const weekOf = getWeekStart(value(params, 'weekOf') || new Date()).toISOString().slice(0, 10);
	if (value(params, 'action') === 'submit') {
		const hours = {
			sun: value(params, 'sun'),
			mon: value(params, 'mon'),
			tue: value(params, 'tue'),
			wed: value(params, 'wed'),
			thu: value(params, 'thu'),
			fri: value(params, 'fri'),
			sat: value(params, 'sat'),
		};
		const existing = await getTimesheetForWeek(domain, user.email, weekOf);
		await saveTimesheet(domain, user.email, weekOf, hours, existing || undefined);
		redirect('/timesheets/summary');
	}
	const existing = await getTimesheetForWeek(domain, user.email, weekOf);
	return (
		<PageSection id="timesheet-new" columns={1} maxWidth="1024px">
			<MenuSimple menuItems={menuItems(user.role === 'admin')} />
			<PageSectionHeader title={`Week beginning ${weekOf}`} />
			<TimesheetEntryForm weekOf={weekOf} values={existing || undefined} />
		</PageSection>
	);
}

export async function TimesheetAdminPage({ domain, searchParams }: { domain: string; searchParams: Promise<SearchParams> }) {
	const user = await getUser(domain);
	if (!user) redirect('/timesheets');
	if (!await isTimesheetAdmin(user)) {
		return <PageSection id="timesheet-admin-unauthorized" columns={1}><p>You do not have access to this page.</p></PageSection>;
	}
	const params = await searchParams;
	const weekOf = getWeekStart(value(params, 'weekOf') || new Date()).toISOString().slice(0, 10);
	const records = await listAdminTimesheets(domain, weekOf);
	const rows = records.map((record) => ({
		Email: record.email,
		Week: formatWeekLabel(record.weekOf),
		'Total Hours': record.totalHours,
		Updated: record.updatedAt,
	}));
	return (
		<PageSection id="timesheet-admin" columns={1} maxWidth="1024px">
			<MenuSimple menuItems={menuItems(true)} />
			<TimesheetWeekSelector weekOf={weekOf} />
			<Table id="timesheet-admin-table" data={rows} sortable />
		</PageSection>
	);
}
