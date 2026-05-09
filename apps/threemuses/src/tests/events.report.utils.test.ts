import { describe, expect, it } from 'vitest';
import { asArray, buildEventGroups, getEventIdentity, normalizeReportRow, parsePossibleJson, sortReportRows } from '@/app/(pages)/events/report/page';

describe('Event report utilities', () => {
	it('sorts report rows by newest created date first', () => {
		const rows = [
			{ created_at: '2024-01-01' },
			{ created_at: '2025-01-01' },
		];
		expect(sortReportRows(rows)[0].created_at).toBe('2025-01-01');
	});

	it('returns arrays unchanged and wraps values in arrays', () => {
		expect(asArray([1, 2, 3])).toEqual([1, 2, 3]);
		expect(asArray('hello')).toEqual(['hello']);
		expect(asArray(null)).toEqual([]);
	});

	it('parses JSON strings and returns non-string values unchanged', () => {
		expect(parsePossibleJson('{"foo": true}')).toEqual({ foo: true });
		expect(parsePossibleJson('not json')).toBe('not json');
		expect(parsePossibleJson(123)).toBe(123);
	});

	it('normalizes report rows to extract shipping and registration data', () => {
		const normalized = normalizeReportRow({
			data: {
				orderData: JSON.stringify({ checkoutData: { items: [{ id: '1', title: 'Event' }], shippingTo: { name: 'Alex' } } }),
			},
			created_at: '2025-01-01',
		});
		expect(normalized.shippingTo).toEqual({ name: 'Alex' });
		expect(normalized.registrationData).toEqual({ name: 'Alex' });
		expect(normalized.items).toEqual([{ id: '1', title: 'Event' }]);
	});

	it('identifies event fields from alternate payload names', () => {
		expect(getEventIdentity({ itemID: '2', itemTitle: 'Alternate Event' })).toEqual({
			eventId: '2',
			eventName: 'Alternate Event',
			quantity: 1,
		});
	});

	it('groups event rows by event id and name and sorts by latest date', () => {
		const rows = [
			{
				created_at: '2024-01-01',
				items: [{ id: 'x', title: 'X Event', quantity: 1 }],
				shipping_to: { name: 'Sam' },
			},
			{
				updatedAt: '2025-01-01',
				items: [{ id: 'y', title: 'Y Event', quantity: 2 }],
				registration_data: { child_name: 'Jamie' },
			},
		];

		const groups = buildEventGroups(rows);
		expect(groups.length).toBe(2);
		expect(groups[0].eventId).toBe('y');
		expect(groups[0].registrationCount).toBe(2);
		expect(groups[1].eventId).toBe('x');
	});
});
