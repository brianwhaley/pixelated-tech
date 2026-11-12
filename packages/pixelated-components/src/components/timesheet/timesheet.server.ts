"use server";

import { getDynamoStringItem, putDynamoStringItem, queryDynamoStringItems } from '../integrations/aws.dynamo.integration';
import {
	DEFAULT_PASSCODE_COOKIE,
	createPasscodeAuthHandlers,
	validatePasscodeSession,
	type PasscodeAuthStore,
} from '../foundation/auth/passcode-auth.server';
import { smartFetch } from '../foundation/smartfetch';
import { getWeekDates, getWeekStart, isValidHours, totalHours } from './timesheet.functions';
import type { TimesheetHours, TimesheetRecord, TimesheetUser } from './timesheet.types';

const TIMESHEET_USERS_TABLE = 'PixelatedTimesheetUsersTable';
const TIMESHEETS_TABLE = 'PixelatedTimesheetsTable';
const SENDMAIL_URL = 'https://api.pixelated.tech/sendmail';

function nowIso() {
	return new Date().toISOString();
}

function toUser(item: Record<string, string>): TimesheetUser {
	return {
		domain: item.domain,
		email: item.email,
		name: item.name || undefined,
		company: item.company || undefined,
		role: item.role === 'admin' ? 'admin' : 'user',
		passcode: item.passcode || undefined,
		passcodeExpires: item.passcodeExpires || undefined,
		sessionToken: item.sessionToken || undefined,
		sessionExpires: item.sessionExpires || undefined,
		createdAt: item.createdAt || undefined,
		updatedAt: item.updatedAt || undefined,
	};
}

function toDynamoItem(item: Record<string, string | undefined>) {
	return Object.fromEntries(
		Object.entries(item).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)]),
	);
}

function createAuthStore(domain: string, siteName?: string): PasscodeAuthStore {
	const senderEmail = `timesheets@${domain}`;
	const findUser = async (email: string) => {
		const item = await getDynamoStringItem(TIMESHEET_USERS_TABLE, { domain, email });
		return item ? toUser(item) : null;
	};
	return {
		findUser,
		findUserBySession: async (sessionToken) => {
			const items = await queryDynamoStringItems(TIMESHEET_USERS_TABLE, 'domain', domain);
			const item = items.find((entry) => entry.sessionToken === sessionToken);
			return item ? toUser(item) : null;
		},
		saveUser: async (user) => {
			await putDynamoStringItem(TIMESHEET_USERS_TABLE, toDynamoItem({
				domain,
				email: user.email,
				name: user.name,
				company: user.company,
				role: user.role,
				passcode: user.passcode,
				passcodeExpires: user.passcodeExpires,
				sessionToken: user.sessionToken,
				sessionExpires: user.sessionExpires,
				createdAt: user.createdAt || nowIso(),
				updatedAt: user.updatedAt || nowIso(),
			}));
		},
		sendPasscode: async (user, passcode) => {
			if (!siteName) throw new Error('Timesheet site name is required to send a passcode.');
			await smartFetch(SENDMAIL_URL, {
				requestInit: {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						from: senderEmail,
						to: user.email,
						subject: `Your ${siteName} timesheet passcode`,
						text: `Your timesheet passcode is ${passcode}. It expires in 10 minutes.`,
						html: `<p>Your timesheet passcode is <strong>${passcode}</strong>.</p><p>It expires in 10 minutes.</p>`,
					}),
				},
			});
		},
	};
}

export async function createTimesheetAuthHandlers(domain: string, siteName: string) {
	const store = createAuthStore(domain, siteName);
	return createPasscodeAuthHandlers({
		store,
		loginPath: '/timesheets',
		getAuthenticatedPath: (user) => user.role === 'admin' ? '/timesheets/admin' : '/timesheets/summary',
		cookieName: DEFAULT_PASSCODE_COOKIE,
	});
}

export async function getAuthenticatedTimesheetUser(domain: string, sessionToken?: string) {
	const user = await validatePasscodeSession(sessionToken, createAuthStore(domain));
	return user ? toUser({
		...user,
		domain,
		email: user.email,
		role: user.role || 'user',
	}) : null;
}

export async function listUserTimesheets(domain: string, email: string) {
	const items = await queryDynamoStringItems(TIMESHEETS_TABLE, 'domain', domain);
	return items
		.filter((item) => item.email === email)
		.sort((left, right) => String(right.weekOf).localeCompare(String(left.weekOf)))
		.map(toTimesheetRecord);
}

export async function listAdminTimesheets(domain: string, weekOf: string) {
	const items = await queryDynamoStringItems(TIMESHEETS_TABLE, 'domain', domain);
	return items
		.filter((item) => item.weekOf === weekOf)
		.sort((left, right) => left.email.localeCompare(right.email))
		.map(toTimesheetRecord);
}

function toTimesheetRecord(item: Record<string, string>): TimesheetRecord {
	return item as unknown as TimesheetRecord;
}

export async function saveTimesheet(
	domain: string,
	email: string,
	weekOf: string,
	hours: TimesheetHours,
	existing?: TimesheetRecord,
) {
	const normalizedWeek = getWeekStart(weekOf);
	const normalizedWeekOf = normalizedWeek.toISOString().slice(0, 10);
	if (!isValidHours(hours)) throw new Error('Hours must be non-negative numbers.');
	const dates = getWeekDates(normalizedWeekOf);
	const timestamp = nowIso();
	const item = {
		domain,
		id: `${email}#${normalizedWeekOf}`,
		email,
		weekOf: normalizedWeekOf,
		...Object.fromEntries(dates.map((date, index) => [`${['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][index]}Date`, date])),
		...hours,
		totalHours: String(totalHours(hours)),
		createdAt: existing?.createdAt || timestamp,
		updatedAt: timestamp,
	};
	await putDynamoStringItem(TIMESHEETS_TABLE, toDynamoItem(item));
	return item as TimesheetRecord;
}

export async function getTimesheetForWeek(domain: string, email: string, weekOf: string) {
	const items = await queryDynamoStringItems(TIMESHEETS_TABLE, 'domain', domain);
	const item = items.find((entry) => entry.email === email && entry.weekOf === weekOf);
	return item ? toTimesheetRecord(item) : null;
}

export async function isTimesheetAdmin(user: TimesheetUser | null): Promise<boolean> {
	return user?.role === 'admin';
}
