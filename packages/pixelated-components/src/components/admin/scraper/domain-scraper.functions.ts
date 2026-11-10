import type { PersonSelectorValues } from './person.functions';

export type PatternSource = { source: string; flags: string };

export type ScopedPerson = {
	email?: string;
	fields: PersonSelectorValues;
};

export function parseFullName(fullName: string): { firstName: string; lastName: string } {
	const parts = fullName.trim().split(/\s+/).filter(Boolean);
	if (parts.length <= 1) return { firstName: parts[0] ?? '', lastName: '' };
	return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] };
}

export function extractMemberId(sourceUrl: string): string | undefined {
	try {
		const pathname = new URL(sourceUrl).pathname.replace(/\/+$/, '');
		const match = pathname.match(/\/Member\/[^/]+~([^/]+)$/i);
		return match?.[1] || undefined;
	} catch {
		return undefined;
	}
}

export function extractPeopleFromDocument(document: Document, fieldSelectors: Record<string, readonly string[]>, configuredBoundarySelectors: readonly string[], patternSources: Record<string, readonly PatternSource[]>, pageHostname: string): ScopedPerson[] {
	const clean = (value: string): string => {
		const normalized = String(value).replace(/\s+/g, ' ').trim();
		return /^\[object\s+(?:Object|Set)\]$/i.test(normalized) ? '' : normalized;
	};
	const cleanAddress = (value: string): string => String(value)
		.replace(/\r\n?/g, '\n')
		.split('\n')
		.map((line) => line.replace(/\s+/g, ' ').trim())
		.filter(Boolean)
		.join('\n');
	const uniqueValues = (values: string[]): string[] => values.filter((value, index) => values.indexOf(value) === index);
	const dedupeAddresses = (values: string[]): string[] => {
		const unique: string[] = [];
		for (const rawValue of values) {
			const value = cleanAddress(String(rawValue)).replace(/^(?:mailing\s+)?address\s*:?\s*/i, '').trim();
			if (!value) continue;
			const normalized = value.toLowerCase().replace(/\s+/g, ' ');
			const duplicateIndex = unique.findIndex((existing) => {
				const normalizedExisting = existing.toLowerCase().replace(/\s+/g, ' ');
				return normalizedExisting === normalized || normalizedExisting.includes(normalized) || normalized.includes(normalizedExisting);
			});
			if (duplicateIndex < 0) unique.push(value);
			else if (value.length > unique[duplicateIndex].length) unique[duplicateIndex] = value;
		}
		return unique;
	};
	const parseAddress = (value: string): Record<string, string> => {
		const lines = cleanAddress(value).split('\n');
		if (lines.length < 2) return {};
		const match = lines[1].match(/^([^,]+),\s*([^,\d]+?)\s+(\d{5}(?:-\d{4})?)(?:\s+(.+))?$/);
		if (!match) return {};
		return {
			streetAddress: lines[0],
			city: match[1].trim(),
			state: match[2].trim(),
			zip: match[3],
			...(match[4] ? { country: match[4].trim() } : {})
		};
	};
	const normalizeEmailValue = (value: string): string => {
		if (!value) return '';
		let normalized = String(value).trim();
		try { normalized = decodeURIComponent(normalized); } catch { /* Keep the original value. */ }
		return normalized.replace(/\s+/g, '').toLowerCase();
	};
	const matchesFor = (field: string, value: string): string[] => (patternSources[field] ?? []).flatMap((pattern) => value.match(new RegExp(pattern.source, pattern.flags)) ?? []);
	const valuesFor = (root: Element, field: string): string[] => {
		const selectors = (fieldSelectors[field] ?? []).join(',');
		if (!selectors) return [];
		return Array.from(root.querySelectorAll(selectors)).map((element) => {
			const content = element.getAttribute('content');
			if (content) return clean(content);
			if (element.tagName === 'A') return clean(element.getAttribute('href') || element.textContent || '');
			if (field === 'address') {
				const clone = element.cloneNode(true) as Element;
				clone.querySelectorAll('br').forEach((lineBreak) => lineBreak.replaceWith('\n'));
				return cleanAddress(clone.textContent || '');
			}
			return clean(element.textContent || '');
		}).filter(Boolean);
	};
	const configuredRoots = configuredBoundarySelectors.flatMap((selector) => {
		try {
			return Array.from(document.querySelectorAll(selector));
		} catch {
			return [];
		}
	});
	const people: ScopedPerson[] = [];
	const socialPlatforms: Record<string, string> = { 'facebook.com': 'facebook', 'instagram.com': 'instagram', 'linkedin.com': 'linkedin', 'youtube.com': 'youtube', 'tiktok.com': 'tiktok', 'twitter.com': 'twitter', 'x.com': 'x', 'yelp.com': 'yelp' };
	for (const configuredRoot of configuredRoots) {
		const emailValues = valuesFor(configuredRoot, 'emails');
		const emails = uniqueValues([
			...emailValues.flatMap((value) => matchesFor('emails', value.replace(/\s+/g, ''))),
			...(emailValues.length === 0 ? matchesFor('emails', clean(configuredRoot.textContent || '')) : [])
		].map(normalizeEmailValue).filter(Boolean));
		const fields: PersonSelectorValues = {};
		if (emails.length > 0) fields.emails = emails;
		for (const field of Object.keys(fieldSelectors)) {
			if (field === 'emails') continue;
			const rawValues = valuesFor(configuredRoot, field);
			const values = field === 'address'
				? dedupeAddresses(rawValues)
				: field === 'website'
					? rawValues.filter((value) => {
						try {
							return new URL(value, document.baseURI).hostname !== pageHostname;
						} catch {
							return false;
						}
					})
					: field === 'phone'
						? uniqueValues(rawValues.flatMap((value) => matchesFor('phone', value)))
						: uniqueValues(rawValues);
			if (values.length === 0) continue;
			const fullNameValues = values
				.map((candidate) => String(candidate).replace(/\b(contacts?|specified|email|phone|telephone)\b/gi, ' ').replace(/\s+/g, ' ').trim())
				.filter((candidate) => candidate && !/^(mailing address|contacts?)$/i.test(candidate));
			const value = field === 'fullName'
				? fullNameValues
				: field === 'streetAddress' ? values.sort((left, right) => right.length - left.length)[0] : values[0];
			(fields as Record<string, unknown>)[field] = field === 'phone' || field === 'category' || field === 'address'
				? values
				: value;
		}
		const addressValues = Array.isArray(fields.address) ? fields.address : fields.address ? [fields.address] : [];
		for (const addressValue of addressValues) {
			const parsedAddress = parseAddress(addressValue);
			for (const [field, value] of Object.entries(parsedAddress)) {
				if ((fields as Record<string, unknown>)[field] === undefined) (fields as Record<string, unknown>)[field] = value;
			}
			if (Object.keys(parsedAddress).length > 0) break;
		}
		if (!fields.fullName) {
			const heading = Array.from(configuredRoot.querySelectorAll('h1,h2,h3,h4,h5')).map((element) => clean(element.textContent || '')).find(Boolean);
			if (heading) fields.fullName = [heading];
		}
		if (!fields.phone || fields.phone.length === 0) {
			const phones = matchesFor('phone', clean(configuredRoot.textContent || ''));
			if (phones.length > 0) fields.phone = uniqueValues(phones);
		}
		const socials: Record<string, string> = {};
		for (const element of Array.from(configuredRoot.querySelectorAll('a[href]'))) {
			try {
				const url = new URL(element.getAttribute('href') || '', document.baseURI);
				const host = url.hostname.toLowerCase().replace(/^www\./, '');
				const socialHost = Object.keys(socialPlatforms).find((candidate) => host === candidate || host.endsWith('.' + candidate));
				if (!socialHost || !['http:', 'https:'].includes(url.protocol)) continue;
				const platform = socialPlatforms[socialHost];
				if (socials[platform]) continue;
				url.hash = '';
				url.search = '';
				socials[platform] = url.href.replace(/\/$/, '');
			} catch {
				continue;
			}
		}
		if (Object.keys(socials).length > 0) fields.socials = socials;
		people.push({ ...(emails[0] ? { email: emails[0] } : {}), fields });
	}
	return people;
}