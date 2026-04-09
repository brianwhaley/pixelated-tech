import fs from 'fs';
import path from 'path';
import { Company } from '../app/company/Company';

function isEmptyVal(v: any): boolean {
	if (v === undefined || v === null) return true;
	if (typeof v === 'string') return v.trim() === '';
	if (Array.isArray(v)) return v.length === 0;
	return false; // don't treat boolean false as empty
}

function safeWriteSync(filePath: string, data: any) {
	const tmp = filePath + '.tmp';
	fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
	fs.renameSync(tmp, filePath);
}

export function makeDefaultFileNameFromUrl(url: string): string {
	try {
		const u = new URL(url);
		const host = u.hostname.replace(/[^a-z0-9.-]/gi, '-');
		const ts = new Date().toISOString().replace(/[:.]/g, '-');
		return `${host}-${ts}.json`;
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
	} catch (_e) {
		const ts = new Date().toISOString().replace(/[:.]/g, '-');
		return `scrape-${ts}.json`;
	}
}

/**
 * Upsert a Company-like object into a JSON file with shape { results: [ ... ] }
 * Merge policy: only fill missing fields (do not overwrite non-empty values)
 * Primary key: prefer `id`, fallback to lowercase trimmed `company` name
 */
export function upsertCompanyToFile(fileName: string, raw: any, _scrapeUrl = 'https://example.com') {
	const filePath = path.join(process.cwd(), 'public', fileName);
	let out: any;
	try {
		const rawStr = fs.readFileSync(filePath, 'utf8');
		out = JSON.parse(rawStr);
		if (!Array.isArray(out.results)) out.results = [];
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
	} catch (_e) {
		// file doesn't exist or can't be parsed; start fresh
		out = { results: [] };
	}

	const companyObj = Company.from(raw).toJSON();
	const keyId = companyObj.id ? String(companyObj.id).trim() : null;
	const keyName = companyObj.company ? String(companyObj.company).trim().toLowerCase() : null;

	// find existing index
	let idx = -1;
	for (let i = 0; i < out.results.length; i++) {
		const r = out.results[i];
		if (keyId && r.id && String(r.id).trim() === keyId) { idx = i; break; }
		if (keyName && r.company && String(r.company).trim().toLowerCase() === keyName) { idx = i; break; }
	}

	let created = false;
	let updated = false;
	if (idx >= 0) {
		// merge only missing values
		const existing = out.results[idx];
		for (const k of Object.keys(companyObj)) {
			const vNew = (companyObj as any)[k];
			const vOld = (existing as any)[k];
			if ((vOld === undefined || isEmptyVal(vOld)) && vNew !== undefined && !isEmptyVal(vNew)) {
				(existing as any)[k] = vNew;
				updated = true;
			}
		}
	} else {
		out.results.push(companyObj);
		created = true;
	}

	// ensure directory exists
	const dir = path.dirname(filePath);
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

	// write back
	safeWriteSync(filePath, out);

	return { created, updated, file: filePath };
}

/**
 * Merge an array of company-like objects into the given file and write it.
 * Merging behavior: for existing records (matched by id or company name), fill only missing fields.
 * New records are appended.
 */
export function appendOrMergeResults(fileName: string, items: any[]) {
	const filePath = path.join(process.cwd(), 'public', fileName);
	let out: any;
	try {
		const rawStr = fs.readFileSync(filePath, 'utf8');
		out = JSON.parse(rawStr);
		if (!Array.isArray(out.results)) out.results = [];
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
	} catch (_e) {
		out = { results: [] };
	}

	let added = 0;
	let updated = 0;

	for (const item of items) {
		const companyObj = Company.from(item).toJSON();
		const keyId = companyObj.id ? String(companyObj.id).trim() : null;
		const keyName = companyObj.company ? String(companyObj.company).trim().toLowerCase() : null;

		let idx = -1;
		for (let i = 0; i < out.results.length; i++) {
			const r = out.results[i];
			if (keyId && r.id && String(r.id).trim() === keyId) { idx = i; break; }
			if (keyName && r.company && String(r.company).trim().toLowerCase() === keyName) { idx = i; break; }
		}

		if (idx >= 0) {
			const existing = out.results[idx];
			let madeChange = false;
			for (const k of Object.keys(companyObj)) {
				const vNew = (companyObj as any)[k];
				const vOld = (existing as any)[k];
				if ((vOld === undefined || isEmptyVal(vOld)) && vNew !== undefined && !isEmptyVal(vNew)) {
					(existing as any)[k] = vNew;
					madeChange = true;
				}
			}
			if (madeChange) updated++;
		} else {
			out.results.push(companyObj);
			added++;
		}
	}

	const dir = path.dirname(filePath);
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

	safeWriteSync(filePath, out);
	return { added, updated, file: filePath };
}