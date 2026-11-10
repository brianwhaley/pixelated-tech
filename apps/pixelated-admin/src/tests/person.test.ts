import { describe, expect, it } from 'vitest';
import { Person } from '../../../../packages/pixelated-components/src/components/admin/scraper/person.functions';

describe('Person', () => {
	it('accepts a full name without first and last names', () => {
		expect(Person.validate({ fullName: ['Jane Doe'] })).toEqual({ valid: true, errors: {} });
	});

	it('accepts first and last names without a full name', () => {
		expect(Person.validate({ firstName: 'Jane', lastName: 'Doe' })).toEqual({ valid: true, errors: {} });
	});

	it('requires either a full name or both first and last names', () => {
		expect(Person.validate({ emails: ['jane@example.com'] })).toEqual({
			valid: false,
			errors: { name: ['full name or first name and last name is required'] }
		});
		expect(Person.validate({ firstName: 'Jane' }).valid).toBe(false);
	});

	it('normalizes supported person fields', () => {
		expect(Person.from({
			fullName: ' Jane Doe ',
			emails: 'JANE@EXAMPLE.COM; jane@example.com',
			phone: '555-0100'
		}).toJSON()).toEqual({
			fullName: ['Jane Doe'],
			emails: ['jane@example.com'],
			phone: ['555-0100']
		});
	});
});
