export const PersonSpec = {
	id: { type: 'string' },
	fullName: { type: 'string[]' },
	firstName: { type: 'string' },
	lastName: { type: 'string' },
	emails: { type: 'string[]' },
	phone: { type: 'string[]' },
	website: { type: 'string|string[]|null' },
	webDomain: { type: 'string' },
	emailDomain: { type: 'string' },
	streetAddress: { type: 'string' },
	address: { type: 'string[]' },
	city: { type: 'string' },
	state: { type: 'string' },
	zip: { type: 'string' },
	country: { type: 'string' },
	company: { type: 'string' },
	category: { type: 'string[]' },
	sourceUrl: { type: 'string[]' },
	notes: { type: 'string' },
	socials: { type: 'socials' }
} as const;

type PersonSpecKey = keyof typeof PersonSpec;
type SpecToTs<S> = S extends { type: 'string' } ? string :
    S extends { type: 'string[]' } ? string[] :
    S extends { type: 'socials' } ? Record<string, string> :
    S extends { type: 'string|string[]|null' } ? string | string[] | null : never;

export type PersonType = {
    [K in PersonSpecKey]?: SpecToTs<(typeof PersonSpec)[K]>;
};

export function createEmptyPerson(): PersonType {
	const person: Record<string, unknown> = {};
	for (const key of Object.keys(PersonSpec) as PersonSpecKey[]) {
		const fieldType = PersonSpec[key].type;
		person[key] = fieldType === 'string[]'
			? []
			: fieldType === 'socials'
				? {}
				: '';
	}
	return person as PersonType;
}

export type PersonSelectorField = keyof PersonType;
export type PersonSelectorValue = PersonType[PersonSelectorField];
export type PersonSelectorValues = Partial<PersonType>;

export const PERSON_FIELD_SELECTORS: Readonly<Record<PersonSelectorField, readonly string[]>> = {
	id: ['[itemprop="identifier"]', '[id*="member-id" i]', '[class*="member-id" i]'],
	fullName: [
		'[itemprop="name"]',
		'[itemtype*="Person" i] [class*="name" i]',
		'[data-name]',
		'[class*="member-name" i]',
		'[class*="agent-name" i]',
		'[class*="contact-name" i]',
		'[class*="clsDMHeader" i]',
		'[id*="member-name" i]',
		'[id*="agent-name" i]'
	],
	firstName: [
		'[itemprop="givenName"]', 
		'[data-first-name]', 
		'[class*="first-name" i]', 
		'[id*="first-name" i]', 
		'[class*="fld-fname" i]'
	],
	lastName: [
		'[itemprop="familyName"]', 
		'[data-last-name]', 
		'[class*="last-name" i]', 
		'[id*="last-name" i]', 
		'[class*="fld-lname" i]'
	],
	emails: [
		'a[href^="mailto:"]', 
		'[itemprop="email"]', 
		'[data-email]', 
		'[class*="email" i]', 
		'[id*="email" i]'
	],
	phone: [
		'a[href^="tel:"]', 
		'[itemprop="telephone"]', 
		'[data-phone]', 
		'[class*="phone" i]', 
		'[class*="telephone" i]', 
		'[id*="phone" i]'
	],
	website: [
		'[itemprop="url"]', 
		'[data-website]', 
		'[class*="website" i]', 
		'[id*="website" i]', 
		'a[rel~="me"]'
	],
	webDomain: [],
	emailDomain: [],
	streetAddress: [
		'[itemprop="streetAddress"]', 
		'[itemprop="street-address"]', 
		'[data-street-address]', 
		'[class*="street-address" i]', 
		'[class*="address-line1" i]', 
		'[id*="street-address" i]', 
		'[id*="address-line1" i]'
	],
	address: [
		'[itemprop="postalAddress"]', 
		'[itemprop="address"]', 
		'[itemtype*="PostalAddress" i]', 
		'[data-address]', 
		'#address_part', 
		'#mailAddr', 
		'[class*="address" i]', 
		'[id*="address" i]'
	],
	city: [
		'[itemprop="addressLocality"]', 
		'[itemprop="locality"]', 
		'[data-city]', 
		'[class*="city" i]', 
		'[id*="city" i]'
	],
	state: [
		'[itemprop="addressRegion"]', 
		'[itemprop="region"]', 
		'[data-state]', 
		'[class*="state" i]', 
		'[class*="region" i]', 
		'[id*="state" i]'
	],
	zip: [
		'[itemprop="postalCode"]', 
		'[itemprop="postal-code"]', 
		'[data-zip]', 
		'[class*="zip" i]', 
		'[class*="postal-code" i]', 
		'[id*="zip" i]'
	],
	country: [
		'[itemprop="addressCountry"]',
		'[itemprop="country-name"]',
		'[data-country]',
		'[class*="country" i]',
		'[id*="country" i]'
	],
	company: [
		'[itemprop="worksFor"]', 
		'[itemprop="affiliation"]', 
		'[itemprop="name"]', 
		'[data-company]', 
		'[class*="company" i]', 
		'[class*="brokerage" i]', 
		'[class*="title" i]'
	],
	category: [
		'[itemprop="jobTitle"]', 
		'[class*="category" i]'
	],
	sourceUrl: [],
	socials: [],
	notes: [
		'[itemprop="description"]', 
		'[class*="bio" i]', 
		'[class*="description" i]'
	]
};

export const PERSON_FIELD_PATTERNS = {
	emails: [/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g],
	phone: [/(?:\+?1[\s.-]*)?(?:\(\d{3}\)|\d{3})[\s.-]*\d{3}[\s.-]*\d{4}/g],
	zip: [/\b\d{5}(?:-\d{4})?\b/g]
} as const;

export function matchPersonFieldPatterns(field: keyof typeof PERSON_FIELD_PATTERNS, value: string): string[] {
	return PERSON_FIELD_PATTERNS[field].flatMap((pattern) => value.match(new RegExp(pattern.source, pattern.flags)) ?? []);
}

export function getPersonFieldSelectors(field: PersonSelectorField): readonly string[] {
	return PERSON_FIELD_SELECTORS[field];
}

export function normalizeEmail(value: string): string {
	if (!value) return '';
	let normalized = String(value).trim();
	try { normalized = decodeURIComponent(normalized); } catch { /* Keep the original value. */ }
	return normalized.replace(/\s+/g, '').toLowerCase();
}

export function splitEmails(value: unknown): string[] {
	if (Array.isArray(value)) return value.map(String).map(normalizeEmail).filter(Boolean);
	if (value === undefined || value === null) return [];
	return String(value).split(/[;,|\n]+/).map(normalizeEmail).filter(Boolean);
}

export function splitValues(value: unknown): string[] {
	if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
	if (value === undefined || value === null) return [];
	return String(value).split(/[;,|\n]+/).map((item) => item.trim()).filter(Boolean);
}

function hasText(value: unknown): boolean {
	return Array.isArray(value) ? value.some((item) => hasText(item)) : typeof value === 'string' && value.trim().length > 0;
}

export class Person {
	data: PersonType;

	constructor(data: PersonType) {
		this.data = data;
	}

	static validate(obj: any): { valid: boolean; errors: Record<string, string[]> } {
		const errors: Record<string, string[]> = {};
		const hasFullName = hasText(obj?.fullName);
		const hasFirstAndLastName = hasText(obj?.firstName) && hasText(obj?.lastName);
		if (!hasFullName && !hasFirstAndLastName) {
			errors.name = ['full name or first name and last name is required'];
		}

		for (const key of Object.keys(PersonSpec) as PersonSpecKey[]) {
			const value = obj?.[key];
			const spec = PersonSpec[key];
			if (value === undefined || value === null) continue;
			if (spec.type === 'string' && typeof value !== 'string') errors[key] = ['not a string'];
			if (spec.type === 'string[]' && splitValues(value).length === 0) errors[key] = ['must contain at least one value'];
			if (spec.type === 'socials' && (typeof value !== 'object' || Array.isArray(value))) errors[key] = ['must be an object'];
			if (spec.type === 'string|string[]|null' && typeof value !== 'string' && !Array.isArray(value)) errors[key] = ['must be a string, array, or null'];
		}

		return { valid: Object.keys(errors).length === 0, errors };
	}

	static from(obj: any): Person {
		const out: Record<string, unknown> = {};
		for (const key of Object.keys(PersonSpec) as PersonSpecKey[]) {
			const value = obj?.[key];
			if (value === undefined || value === null) continue;
			const spec = PersonSpec[key];
			if (spec.type === 'string') out[key] = String(value).trim();
			else if (spec.type === 'string[]') {
				const values = key === 'emails'
					? splitEmails(value)
					: key === 'address'
						? (Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : [String(value).trim()].filter(Boolean))
						: splitValues(value);
				out[key] = Array.from(new Set(values));
			}
			else if (spec.type === 'socials' && typeof value === 'object' && !Array.isArray(value)) {
				out[key] = Object.fromEntries(Object.entries(value)
					.filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].trim().length > 0)
					.map(([platform, url]) => [platform, url.trim()]));
			}
			else if (spec.type === 'string|string[]|null') {
				out[key] = Array.isArray(value)
					? Array.from(new Set(value.map(String).map((item) => item.trim()).filter(Boolean)))
					: String(value).trim();
			}
		}
		return new Person(out as PersonType);
	}

	toJSON(): PersonType {
		return this.data;
	}
}

