// Single source of truth: spec, helpers, and types live here.
export const CompanySpec = {
	id: { type: 'string' },
	company: { type: 'string', required: true },
	category: { type: 'string' },
	leadType: { type: 'string' },
	emails: { type: 'string[]' },
	phone: { type: 'string' },
	website: { type: 'string|string[]|null' },
	'web domain': { type: 'string' },
	'email domain': { type: 'string' },
	'street address': { type: 'string' },
	address: { type: 'string' },
	city: { type: 'string' },
	state: { type: 'string' },
	zip: { type: 'string' },
	'full name': { type: 'string' },
	'first name': { type: 'string' },
	'last name': { type: 'string' },
	rating: { type: 'string' },
	'rating count': { type: 'string' },
	customer: { type: 'boolean' },
	partner: { type: 'boolean' },
	'first group': { type: 'boolean' },
	'different domains': { type: 'boolean' },
	notes: { type: 'string' }
} as const;

export type CompanyKeys = keyof typeof CompanySpec;

// Map spec types to TypeScript types
type SpecToTs<S> = S extends { type: 'string' } ? string :
	S extends { type: 'string[]' } ? string[] :
	S extends { type: 'string|string[]|null' } ? string | string[] | null :
	S extends { type: 'boolean' } ? boolean : any;

export type CompanyType = {
	[K in keyof typeof CompanySpec]?: SpecToTs<(typeof CompanySpec)[K]>;
};

export const flagKeys = ['customer', 'partner', 'first group', 'different domains'] as const;

// simple email regex for validation
export const simpleEmailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

export function normalizeEmail(e: string): string {
	if (!e) return '';
	let s = String(e).trim();
	// eslint-disable-next-line no-empty, @typescript-eslint/no-unused-vars
	try { s = decodeURIComponent(s); } catch (_err) { }
	// eslint-disable-next-line no-misleading-character-class
	s = s.replace(/[\u200B\u200C\u200D\uFEFF]/g, '');
	s = s.replace(/^=+/, '');
	s = s.replace(/\s+/g, '');
	return s.toLowerCase();
}

export function splitEmails(val: any): string[] {
	if (!val && val !== '') return [];
	if (Array.isArray(val)) return val.map(String).map(normalizeEmail).filter(Boolean);
	return String(val).split(/[;,|\n]+/).map(String).map(normalizeEmail).filter(Boolean);
}

export function normalizeFlag(val: any): boolean {
	if (typeof val === 'boolean') return val;
	if (val == null) return false;
	const s = String(val).trim().toLowerCase();
	// explicit truthy values
	if (['x', 'yes', 'true', '1'].includes(s)) return true;
	// explicit falsy values
	if (['no', '0', ''].includes(s)) return false;
	// default to false for unknown strings
	return false;
}


export class Company {
	data: CompanyType;

	constructor(data: CompanyType) {
		this.data = data;
	}

	static validate(obj: any): { valid: boolean; errors: Record<string, string[]> } {
		const errors: Record<string, string[]> = {};
		const row = obj;

		for (const key of Object.keys(CompanySpec) as CompanyKeys[]) {
			const spec = CompanySpec[key];
			const val = row[key as string];

			if (('required' in spec) && (spec as any).required && (val === undefined || val === null || String(val).trim() === '')) {
				errors[key as string] = errors[key as string] || [];
				errors[key as string].push('required');
				continue;
			}

			if (val !== undefined && val !== null) {
				if (spec.type === 'string' && typeof val !== 'string') {
					errors[key as string] = errors[key as string] || [];
					errors[key as string].push('not a string');
				}
				if (spec.type === 'string|string[]|null' && val !== null && !(typeof val === 'string' || Array.isArray(val))) {
					errors[key as string] = errors[key as string] || [];
					errors[key as string].push('must be a string, array of strings, or null');
				}
				if (spec.type === 'string[]') {
					const emails = splitEmails(val);
					if (!Array.isArray(emails) || emails.length === 0) {
						errors[key as string] = errors[key as string] || [];
						errors[key as string].push('must be non-empty array of strings or semi/commadelimited string');
					} else {
						for (const e of emails) {
							if (!normalizeEmail(e)) {
								errors[key as string] = errors[key as string] || [];
								errors[key as string].push(`invalid email:${e}`);
							}
						}
					}
				}
				if (spec.type === 'string|string[]|null' && Array.isArray(val)) {
					for (const item of val) {
						if (typeof item !== 'string') {
							errors[key as string] = errors[key as string] || [];
							errors[key as string].push('array elements must be strings');
						}
					}
				}
				if (spec.type === 'boolean') {
					// accept boolean or convertible
					if (!(typeof val === 'boolean' || ['x', 'yes', 'true', '1', '0', 'no', ''].includes(String(val).toLowerCase()))) {
						errors[key as string] = errors[key as string] || [];
						errors[key as string].push('must be boolean or convertible');
					}
				}
			}
		}

		return { valid: Object.keys(errors).length === 0, errors };
	}

	static from(obj: any): Company {
		const out: any = {};

		for (const key of Object.keys(CompanySpec) as CompanyKeys[]) {
			const spec = CompanySpec[key];
			const v = obj[key as string];
			if (v === undefined || v === null) continue;

			if (spec.type === 'string') out[key] = String(v).trim();
			else if (spec.type === 'string[]') out[key] = Array.from(new Set(splitEmails(v)));
			else if (spec.type === 'string|string[]|null') {
				if (v === null) {
					out[key] = null;
				} else if (Array.isArray(v)) {
					out[key] = Array.from(new Set((v as any[]).map((item) => String(item).trim()).filter(Boolean)));
				} else {
					out[key] = String(v).trim();
				}
			} else if (spec.type === 'boolean') out[key] = normalizeFlag(v);
			else out[key] = v;
		}

		return new Company(out as CompanyType);
	}

	toJSON(): CompanyType {
		return this.data;
	}

	normalizeInPlace() {
		const normalized = Company.from(this.data).data;
		this.data = normalized;
	}
}
