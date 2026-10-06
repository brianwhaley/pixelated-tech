import fs from 'fs';

/** Read companies from a plain-text file (one company per line) */
export function readCompaniesFromTxt(filePath: string): string[] {
	if (!fs.existsSync(filePath)) return [];
	const raw = fs.readFileSync(filePath, 'utf8');
	return raw
		.split(/\r?\n/)
		.map((s) => String(s || '').trim())
		.filter(Boolean);
}

/** Read companies from a JSON file and return an array of company name strings.
 * Supports several shapes:
 * - ["Company A", "Company B"]
 * - [{ company: "Company A" }, ...]
 * - { results: [ { company: "..." }, ... ] }
 * - { companies: [ ... ] }
 * - fallback: object values
 */
export function readCompaniesFromJson(filePath: string): string[] {
	if (!fs.existsSync(filePath)) return [];
	let parsed: any;
	try {
		parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
	} catch (_err) {
		return [];
	}

	const out: string[] = [];

	if (Array.isArray(parsed)) {
		// array of strings or objects
		for (const item of parsed) {
			if (typeof item === 'string') out.push(item.trim());
			else if (item && typeof item === 'object' && 'company' in item) out.push(String(item.company || item.name || '').trim());
		}
		return out.filter(Boolean);
	}

	if (parsed && Array.isArray(parsed.results)) {
		for (const item of parsed.results) {
			if (typeof item === 'string') out.push(item.trim());
			else if (item && typeof item === 'object' && 'company' in item) out.push(String(item.company || item.name || '').trim());
		}
		return out.filter(Boolean);
	}

	if (parsed && Array.isArray(parsed.companies)) {
		for (const item of parsed.companies) {
			out.push(String(item || '').trim());
		}
		return out.filter(Boolean);
	}

	// fallback: inspect object values and nested arrays
	for (const v of Object.values(parsed || {})) {
		if (Array.isArray(v)) {
			for (const item of v) {
				if (typeof item === 'string') out.push(item.trim());
				else if (item && typeof item === 'object' && 'company' in item) out.push(String(item.company).trim());
			}
		} else if (v && typeof v === 'object' && 'company' in v) {
			out.push(String((v as any).company).trim());
		} else if (typeof v === 'string') {
			out.push(v.trim());
		}
	}

	return out.filter(Boolean);
}

/** Extract a single website URL from HTML returned in Google results (main column HTML) */
export function extractWebsiteFromResults(html: string): string | null {
	if (!html) return null;
	const hrefRegex = /href\s*=\s*"(.*?)"/gi;
	let match: RegExpExecArray | null;
	while ((match = hrefRegex.exec(html)) !== null) {
		let href = match[1];
		if (!href) continue;
		// unescape common entities
		href = href.replace(/&amp;/g, '&');
		try {
			// google redirect pattern: /url?q=<realurl>&...
			if (/\/url\?/.test(href) || href.includes('/url?')) {
				const qMatch = href.match(/[?&]q=([^&]+)/);
				if (qMatch && qMatch[1]) {
					const decoded = decodeURIComponent(qMatch[1]);
					if (/^https?:\/\//i.test(decoded)) return decoded;
				}
			}
			if (/^https?:\/\//i.test(href)) return href;
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch (_e) {
			// ignore and continue
		}
	}

	// fallback: pick any plain http/https URL in the HTML
	const urlRegex = /(https?:\/\/[\w\-@:%._+~#=/&?()[\]:;,%!$'*+]+?)(?:["'\s>]|$)/i;
	const fallback = html.match(urlRegex);
	return fallback ? fallback[1] : null;
}

/** Extract all email addresses from an HTML string */
export function extractEmailsFromResults(html: string): string[] {
	if (!html) return [];
	const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
	const found = html.match(emailRegex) || [];
	const normalized = found.map(e => decodeURIComponent(e).trim().toLowerCase());
	return Array.from(new Set(normalized)).sort();
}
