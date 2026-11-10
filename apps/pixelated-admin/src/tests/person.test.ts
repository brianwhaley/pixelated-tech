import { describe, expect, it } from 'vitest';
import { Person } from '../app/person/Person';

describe('Person', () => {
	it('accepts a full name without first and last names', () => {
		expect(Person.validate({ 'full name': 'Jane Doe' })).toEqual({ valid: true, errors: {} });
	});

	it('accepts first and last names without a full name', () => {
		expect(Person.validate({ 'first name': 'Jane', 'last name': 'Doe' })).toEqual({ valid: true, errors: {} });
	});

	it('requires either a full name or both first and last names', () => {
		expect(Person.validate({ email: 'jane@example.com' })).toEqual({
			valid: false,
			errors: { name: ['full name or first name and last name is required'] }
		});
		expect(Person.validate({ 'first name': 'Jane' }).valid).toBe(false);
	});

	it('normalizes supported person fields', () => {
		expect(Person.from({
			'full name': ' Jane Doe ',
			emails: 'JANE@EXAMPLE.COM; jane@example.com',
			phone: '555-0100'
		}).toJSON()).toEqual({
			'full name': 'Jane Doe',
			emails: ['jane@example.com'],
			phone: '555-0100'
		});
	});
});
