#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
	const args = { filters: [], filePattern: 'public/*.json', limit: 0, output: null, format: 'matches' };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--filter' && argv[i+1]) { args.filters.push(argv[++i]); continue; }
		if (a.startsWith('--filter=')) { args.filters.push(a.split('=')[1]); continue; }
		if (a === '--filePattern' && argv[i+1]) { args.filePattern = argv[++i]; continue; }
		if (a.startsWith('--filePattern=')) { args.filePattern = a.split('=')[1]; continue; }
		if (a === '--limit' && argv[i+1]) { args.limit = Number(argv[++i]) || 0; continue; }
		if (a.startsWith('--limit=')) { args.limit = Number(a.split('=')[1]) || 0; continue; }
		if (a === '--output' && argv[i+1]) { args.output = argv[++i]; continue; }
		if (a.startsWith('--output=')) { args.output = a.split('=')[1]; continue; }
		if (a === '--format' && argv[i+1]) { args.format = argv[++i]; continue; }
		if (a.startsWith('--format=')) { args.format = a.split('=')[1]; continue; }
		if (a === '--help' || a === '-h') { args.help = true; }
	}
	return args;
}

function listFiles(pattern) {
	// simple glob for public/*.json patterns
	if (pattern === 'public/*.json' || pattern === 'public/*.json') {
		return fs.readdirSync('public').filter(f => f.endsWith('.json')).map(f => path.join('public', f));
	}
	// support simple wildcard *.json in a directory
	const m = pattern.match(/^(.+)\/(\*\.json)$/);
	if (m) {
		const dir = m[1];
		if (!fs.existsSync(dir)) return [];
		return fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => path.join(dir, f));
	}
	// fallback: literal path
	return pattern.split(',').map(p => p.trim()).filter(Boolean);
}

function parseFilter(spec) {
	// spec examples:
	// field:exists
	// field:blank
	// field:contains:value
	// field:exact:value
	// field:regex:pattern (pattern may contain colons)
	// field:in:a|b|c
	const parts = spec.split(':');
	if (parts.length < 2) throw new Error('invalid filter, must be field:op[:value]');
	const field = parts.shift();
	const op = parts.shift();
	const value = parts.length ? parts.join(':') : null;
	return { field, op, value };
}

function valueToStrings(val) {
	if (val === null || val === undefined) return [];
	if (Array.isArray(val)) return val.map(String);
	return [String(val)];
}

function makeMatcher(f) {
	const field = f.field;
	const op = f.op;
	const val = f.value;
	if (op === 'exists') {
		return (row) => {
			const v = row[field];
			if (v === null || v === undefined) return false;
			if (Array.isArray(v)) return v.length > 0;
			return String(v).trim() !== '';
		};
	}
	if (op === 'blank') {
		return (row) => {
			const v = row[field];
			if (v === null || v === undefined) return true;
			if (Array.isArray(v)) return v.length === 0;
			return String(v).trim() === '';
		};
	}
	if (op === 'contains') {
		const needle = String(val || '').toLowerCase();
		return (row) => {
			const vals = valueToStrings(row[field]);
			return vals.some(v => String(v).toLowerCase().includes(needle));
		};
	}
	if (op === 'exact') {
		const needle = String(val);
		return (row) => valueToStrings(row[field]).some(v => v === needle);
	}
	if (op === 'in') {
		const parts = String(val || '').split('|').map(s => s.toLowerCase());
		return (row) => valueToStrings(row[field]).some(v => parts.includes(String(v).toLowerCase()));
	}
	if (op === 'regex') {
		const re = new RegExp(val, 'i');
		return (row) => valueToStrings(row[field]).some(v => re.test(String(v)));
	}
	throw new Error('unknown filter op: ' + op);
}

async function main(argv) {
	const args = parseArgs(argv);
	if (args.help) {
		console.log('Usage: node scripts/search-public.js --filter "emails:exists" --filter "website:regex:(^$|facebook|instagram)" [--filePattern public/*.json] [--limit N] [--output out.json]');
		return;
	}

	const files = listFiles(args.filePattern);
	const parsed = args.filters.map(parseFilter);
	const matchers = parsed.map(makeMatcher);
	const matches = [];

	// default report filename (timestamped) when no --output provided
	if (!args.output) {
		const ts = new Date().toISOString().replace(/[:.]/g, '').replace(/-/g, '');
		args.output = path.join('reports', `search-${ts}.json`);
		args.format = args.format || 'records';
		console.log(`No --output specified; will write to ${args.output}`);
	}

	for (const f of files) {
		let obj;
		try { obj = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { console.error('parse failed', f, e); continue; }
		const rows = Array.isArray(obj.results) ? obj.results : [];
		for (let i = 0; i < rows.length; i++) {
			const r = rows[i];
			const ok = matchers.every(m => m(r));
			if (ok) matches.push({ file: path.basename(f), index: i, row: r });
			if (args.limit && matches.length >= args.limit) break;
		}
		if (args.limit && matches.length >= args.limit) break;
	}

	console.log(`Found ${matches.length} matches`);
	if (args.output) {
		// ensure reports dir exists if the output path starts with reports/
		const outdir = path.dirname(args.output);
		if (outdir && !fs.existsSync(outdir)) fs.mkdirSync(outdir, { recursive: true });
		if (args.format === 'records') {
			const rows = matches.map(m => m.row);
			fs.writeFileSync(args.output, JSON.stringify({ results: rows }, null, 2));
			console.log(`Wrote ${rows.length} records to ${args.output}`);
		} else {
			fs.writeFileSync(args.output, JSON.stringify(matches, null, 2));
			console.log(`Wrote ${matches.length} match objects to ${args.output}`);
		}
	}
	// print a small sample
	matches.slice(0, 20).forEach(m => console.log(m.file, m.index, (m.row.company || m.row.emails || '').toString().slice(0, 120)));
}

if (require.main === module) main(process.argv.slice(2)).catch(err=>{ console.error(err); process.exit(1); });
else module.exports = { parseArgs, parseFilter, makeMatcher };
