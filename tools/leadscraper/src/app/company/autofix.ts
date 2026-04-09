#!/usr/bin/env ts-node
import fs from 'fs';
import path from 'path';
import { splitEmails, normalizeEmail } from './Company.js';

// Autofix script with mapping object for key renames and simple value normalizers.
// Default mode is dry-run (read-only). Use --apply or --write to apply changes and write backups (.bak).

const PUBLIC_DIR = path.join(process.cwd(), 'public');

// Easy mapping object — update this to add or change rules
const keyMapping: { [k: string]: string } = {
	'Company': 'company',
	'Name': 'first name',
	'name': 'first name',
	'address': 'address',
	'street_address': 'street address',
	'City': 'city',
	'State': 'state',
	'Phone': 'phone',
	'Website': 'website',
	'Category': 'category'
};

function applyMappingToRow(row: any) {
	const newRow: any = {};
	// first copy all existing canonical keys (preserve if present)
	for (const k of Object.keys(row)) {
		const mapped = keyMapping[k] || k;
		if (mapped in newRow) {
			// merge when necessary (emails arrays mostly)
			if (mapped === 'emails') {
				newRow[mapped] = Array.from(new Set([...(newRow[mapped] || []), ...splitEmails(row[k])]));
			} else {
				// keep existing unless it's empty
				if (!newRow[mapped] && row[k]) newRow[mapped] = row[k];
			}
		} else {
			// For emails, ensure it's an array
			if (mapped === 'emails') newRow[mapped] = Array.from(new Set(splitEmails(row[k])));
			else newRow[mapped] = row[k];
		}
	}

	// normalize emails
	if (newRow.emails) newRow.emails = Array.from(new Set(newRow.emails.map((e: string) => normalizeEmail(e)).filter(Boolean)));

	// normalize flags to 'x' for yes and '' (empty) for no
	for (const fk of ['customer', 'partner', 'first group', 'different domains']) {
		if (newRow[fk] === undefined || newRow[fk] === null || String(newRow[fk]).trim() === '') {
			newRow[fk] = '';
		} else {
			const v = String(newRow[fk]).trim().toLowerCase();
			if (v === 'x' || v === 'yes' || v === 'true' || v === '1' || v === 'y') newRow[fk] = 'x';
			else newRow[fk] = '';
		}
	}

	// ensure web domain/email domain are strings
	if (newRow['email domain']) newRow['email domain'] = String(newRow['email domain']);
	if (newRow['web domain']) newRow['web domain'] = String(newRow['web domain']);

	// normalize website placeholders to empty string (NONE, N/A, No Website)
	if (newRow['website'] !== undefined && newRow['website'] !== null) {
		const w = String(newRow['website']).trim();
		if (/^(none|n\/a|no website)$/i.test(w)) newRow['website'] = '';
		else newRow['website'] = w;
	}

	return newRow;
}

function listPublicFiles() {
	return fs.readdirSync(PUBLIC_DIR).filter(f => f.endsWith('.json'));
}

export async function run(argv?: string[]) {
	// Accept explicit argv, otherwise detect flags both for normal scripts (argv[2+])
	// and -e one-liners (argv[1+]). This keeps behavior consistent when invoked
	// via `node -e` or as a standalone script.
	const args = argv ?? (process.argv[2] ? process.argv.slice(2) : process.argv.slice(1));
	const apply = args.includes('--apply') || args.includes('--write');
	const dry = !apply; // default: dry (read-only)
	const files = listPublicFiles();
	for (const f of files) {
		const p = path.join(PUBLIC_DIR, f);
		let obj: any;
		try { obj = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (err) { console.error('Parse failed', f, err); continue; }
		const rows = Array.isArray(obj.results) ? obj.results : [];
		const outRows: any[] = [];
		const diffs: any[] = [];
		for (let i = 0; i < rows.length; i++) {
			const r = rows[i];
			const fixed = applyMappingToRow(r);
			outRows.push(fixed);
			// log if there is a key add/remove or normalized flag change
			const keysBefore = Object.keys(r).sort();
			const keysAfter = Object.keys(fixed).sort();
			if (JSON.stringify(keysBefore) !== JSON.stringify(keysAfter) || JSON.stringify(r) !== JSON.stringify(fixed)) {
				diffs.push({ index: i, beforeKeys: keysBefore, afterKeys: keysAfter });
			}
		}
		if (dry) {
			console.log(`[dry-run] ${f}: ${rows.length} rows, ${diffs.length} rows would change`);
			if (diffs.length && diffs.length < 20) console.log(diffs.slice(0, 20));
			continue;
		}
		// write backup
		fs.copyFileSync(p, p + '.bak');
		fs.writeFileSync(p, JSON.stringify({ results: outRows }, null, '\t') + '\n', 'utf8');
		console.log(`${f}: wrote ${outRows.length} rows (backup at ${f}.bak). ${diffs.length} rows changed`);
	}
}

// safe entry for both ESM and CJS runtimes
try {
	if (typeof require !== 'undefined' && require.main === module) run();
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
} catch (_e) { /* ignore in ESM */ }

export default run;
