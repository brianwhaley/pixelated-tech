import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	getDynamoStringItem: vi.fn(),
	putDynamoStringItem: vi.fn(),
	queryDynamoStringItems: vi.fn(),
	smartFetch: vi.fn(),
}));

vi.mock('../components/integrations/aws.dynamo.integration', () => ({
	getDynamoStringItem: mocks.getDynamoStringItem,
	putDynamoStringItem: mocks.putDynamoStringItem,
	queryDynamoStringItems: mocks.queryDynamoStringItems,
}));

vi.mock('../components/foundation/smartfetch', () => ({ smartFetch: mocks.smartFetch }));

import {
	createTimesheetAuthHandlers,
	getAuthenticatedTimesheetUser,
	getTimesheetForWeek,
	isTimesheetAdmin,
	listAdminTimesheets,
	listUserTimesheets,
	saveTimesheet,
} from '../components/timesheet/timesheet.server';

const user = {
	domain: 'example.com',
	email: 'worker@example.com',
	role: 'user',
	name: 'Worker',
	company: 'Example',
};

const {
	getDynamoStringItem,
	putDynamoStringItem,
	queryDynamoStringItems,
	smartFetch,
} = mocks;

describe('timesheet server functions', () => {
	it('sends a site-specific passcode email through the auth handler', async () => {
		getDynamoStringItem.mockResolvedValue(user);
		putDynamoStringItem.mockResolvedValue(undefined);
		smartFetch.mockResolvedValue(new Response('{}', { status: 200 }));

		const handlers = await createTimesheetAuthHandlers('example.com', 'Example Services');
		const response = await handlers.POST(new Request('https://example.com/timesheets/auth', {
			method: 'POST',
			body: new URLSearchParams({ action: 'request', email: user.email }),
		}));

		expect(response.status).toBe(303);
		expect(smartFetch).toHaveBeenCalledWith(
			'https://api.pixelated.tech/sendmail',
			expect.objectContaining({
				requestInit: expect.objectContaining({
					body: expect.stringContaining('Your Example Services timesheet passcode'),
				}),
			}),
		);
	});

	it('lists user and admin records from the domain partition', async () => {
		queryDynamoStringItems.mockResolvedValue([
			{ domain: 'example.com', email: 'z@example.com', weekOf: '2026-11-01', totalHours: '2' },
			{ domain: 'example.com', email: 'a@example.com', weekOf: '2026-11-08', totalHours: '3' },
			{ domain: 'example.com', email: 'a@example.com', weekOf: '2026-11-01', totalHours: '1' },
		]);

		const records = await listUserTimesheets('example.com', 'a@example.com');
		expect(records.map((record) => record.weekOf)).toEqual(['2026-11-08', '2026-11-01']);

		const adminRecords = await listAdminTimesheets('example.com', '2026-11-01');
		expect(adminRecords.map((record) => record.email)).toEqual(['a@example.com', 'z@example.com']);
	});

	it('saves normalized weekly hours and preserves an existing creation time', async () => {
		putDynamoStringItem.mockResolvedValue(undefined);
		const record = await saveTimesheet(
			'example.com',
			'worker@example.com',
			'2026-11-12',
			{ sun: '8', mon: '7.5', tue: '0', wed: '8', thu: '8', fri: '6', sat: '0' },
			{ createdAt: '2026-11-01T00:00:00.000Z' } as never,
		);

		expect(record.weekOf).toBe('2026-11-08');
		expect(record.totalHours).toBe('37.5');
		expect(record.sunDate).toBe('2026-11-08');
		expect(record.createdAt).toBe('2026-11-01T00:00:00.000Z');
		expect(putDynamoStringItem).toHaveBeenCalled();
	});

	it('rejects invalid hours and resolves authentication and role checks', async () => {
		await expect(saveTimesheet('example.com', 'worker@example.com', '2026-11-08', {
			sun: '-1', mon: '0', tue: '0', wed: '0', thu: '0', fri: '0', sat: '0',
		})).rejects.toThrow('Hours must be non-negative numbers.');

		queryDynamoStringItems.mockResolvedValue([{ ...user, sessionToken: 'hashed', sessionExpires: '2099-01-01T00:00:00.000Z' }]);
		await expect(getAuthenticatedTimesheetUser('example.com', 'raw-token')).resolves.toBeNull();
		await expect(isTimesheetAdmin({ ...user, role: 'admin' })).resolves.toBe(true);
		await expect(isTimesheetAdmin(user)).resolves.toBe(false);
	});

	it('returns an existing timesheet for a user and week', async () => {
		queryDynamoStringItems.mockResolvedValue([{ email: user.email, weekOf: '2026-11-08', totalHours: '8' }]);
		await expect(getTimesheetForWeek('example.com', user.email, '2026-11-08')).resolves.toMatchObject({ totalHours: '8' });
	});
});
