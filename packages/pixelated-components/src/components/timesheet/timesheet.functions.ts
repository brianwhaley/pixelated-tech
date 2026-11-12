import type { TimesheetHours } from './timesheet.types';

export const TIMESHEET_DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
export type TimesheetDay = typeof TIMESHEET_DAYS[number];

export function getWeekStart(value: Date | string = new Date()) {
	const date = typeof value === 'string' ? new Date(`${value}T00:00:00Z`) : new Date(value);
	if (Number.isNaN(date.getTime())) throw new Error('Invalid date.');
	const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
	result.setUTCDate(result.getUTCDate() - result.getUTCDay());
	return result;
}

export function toDateInputValue(value: Date) {
	return value.toISOString().slice(0, 10);
}

export function getWeekDates(weekOf: Date | string = new Date()) {
	const start = getWeekStart(weekOf);
	return TIMESHEET_DAYS.map((_, index) => {
		const date = new Date(start);
		date.setUTCDate(start.getUTCDate() + index);
		return toDateInputValue(date);
	});
}

export function formatWeekLabel(weekOf: string) {
	const dates = getWeekDates(weekOf);
	return `${dates[0]} – ${dates[6]}`;
}

export function normalizeHours(value: string | number | undefined) {
	const parsed = Number(value ?? '');
	if (!Number.isFinite(parsed) || parsed < 0) return null;
	return parsed;
}

export function totalHours(hours: TimesheetHours) {
	return TIMESHEET_DAYS.reduce((total, day) => total + (normalizeHours(hours[day]) ?? 0), 0);
}

export function isValidHours(hours: TimesheetHours) {
	return TIMESHEET_DAYS.every((day) => normalizeHours(hours[day]) !== null);
}
