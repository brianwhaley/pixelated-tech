import { describe, expect, it } from 'vitest';
import {
	formatWeekLabel,
	getWeekDates,
	getWeekStart,
	isValidHours,
	totalHours,
} from '../components/admin/timesheet/timesheet.functions';

describe('timesheet functions', () => {
	it('starts weeks on Sunday', () => {
		expect(getWeekStart('2026-11-12').toISOString().slice(0, 10)).toBe('2026-11-08');
		expect(getWeekDates('2026-11-08')).toEqual([
			'2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11',
			'2026-11-12', '2026-11-13', '2026-11-14',
		]);
	});

	it('creates recent weeks in descending order', () => {
		expect(formatWeekLabel('2026-11-08')).toBe('2026-11-08 – 2026-11-14');
	});

	it('accepts non-negative decimal hours and calculates the total', () => {
		const hours = { sun: '1.5', mon: '8', tue: '0', wed: '7.25', thu: '8', fri: '6', sat: '2' };
		expect(isValidHours(hours)).toBe(true);
		expect(totalHours(hours)).toBe(32.75);
		expect(isValidHours({ ...hours, sat: '-1' })).toBe(false);
	});
});
