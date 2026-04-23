const fs = require('fs');
const path = require('path');

const inFile = process.argv[2] || 'public/reports/companies-with-emails-no-website.json';
const outFile = process.argv[3] || (() => {
	const parsed = path.parse(inFile);
	return path.join(parsed.dir, `${parsed.name}.csv`);
})();

function normalizeKey(k) {
	return k.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
}

function normalizeEmails(value) {
	if (!value) return [];
	if (Array.isArray(value)) {
		return value.map((email) => String(email || '').trim()).filter(Boolean);
	}
	return String(value)
		.split(/[;,|\n]+/)
		.map((email) => String(email || '').trim())
		.filter(Boolean);
}

function toCsvRow(values) {
	return values.map(v => {
		if (v === null || v === undefined) return '';
		const s = String(v);
		// Escape quotes and wrap in quotes if necessary
		if (s.includes(',') || s.includes('"') || s.includes('\n')) {
			return '"' + s.replace(/"/g, '""') + '"';
		}
		return s;
	}).join(',');
}

if (!fs.existsSync(inFile)) {
	console.error('Input file not found:', inFile);
	process.exit(1);
}

const raw = fs.readFileSync(inFile, 'utf8');
let obj;
try { obj = JSON.parse(raw); } catch (e) { console.error('Failed to parse JSON:', e); process.exit(1);} 

let rows;
if (Array.isArray(obj)) rows = obj;
else if (Array.isArray(obj.processed)) rows = obj.processed;
else if (Array.isArray(obj.results)) rows = obj.results;
else if (Array.isArray(obj.leads)) rows = obj.leads;
else rows = [];
// Determine fields to include (take union of keys across objects)
const keysSet = new Set();
rows.forEach(r => {
	Object.keys(r).forEach(k => keysSet.add(k));
});
// We'll replace 'emails' with single 'email' column; remove 'emails' from keys
keysSet.delete('emails');
const keys = Array.from(keysSet);
// Normalize keys for header
const headerKeys = keys.map(k => normalizeKey(k));
// Ensure standard 'email' column after others
const header = [...headerKeys, 'email'];

// Build CSV lines
const outLines = [];
outLines.push(header.join(','));

rows.forEach(r => {
	const emails = normalizeEmails(r.emails || r.email);
	emails.forEach(email => {
		if (!email || String(email).trim() === '') return; // skip empty
		const vals = keys.map(k => {
			const v = r[k];
			if (Array.isArray(v)) return v.join('|');
			return v === undefined ? '' : v;
		});
		vals.push(email);
		outLines.push(toCsvRow(vals));
	});
});

// Ensure output dir exists
const outdir = path.dirname(outFile);
if (outdir && !fs.existsSync(outdir)) fs.mkdirSync(outdir, { recursive: true });
fs.writeFileSync(outFile, outLines.join('\n'), 'utf8');
console.log(`Wrote ${outLines.length - 1} rows to ${outFile}`);
