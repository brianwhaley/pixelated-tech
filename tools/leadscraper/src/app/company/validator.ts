#!/usr/bin/env ts-node
import fs from 'fs';
import path from 'path';
import { Company, CompanySpec } from './Company';

// Read-only validator: scans public/*.json and validates each entry against the canonical keys
// Produces a report JSON in ./reports/validation-<timestamp>.json and prints a summary.

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const REPORTS_DIR = path.join(process.cwd(), 'reports');
if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR);

function listPublicFiles() {
	return fs.readdirSync(PUBLIC_DIR).filter(f => f.endsWith('.json'));
}

function validateRow(row: any) {
	// Use Company.validate to get structured errors
	const res = Company.validate(row);
	return res.errors || {};
}

function run() {
	const files = listPublicFiles();
	const report: any = { generatedAt: new Date().toISOString(), files: {}, extraKeys: {} };

	for (const f of files) {
		const p = path.join(PUBLIC_DIR, f);
		let obj: any;
		try { obj = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (err) { report.files[f] = { error: 'parse failed', err: String(err) }; continue; }
		const rows = Array.isArray(obj.results) ? obj.results : [];
		const fileReport: any = { total: rows.length, problems: 0, samples: [], extraKeys: {} };

		for (let i = 0; i < rows.length; i++) {
			const r = rows[i];
			// collect any keys that are not in CompanySpec
			Object.keys(r).forEach(k => {
				if (!(k in CompanySpec)) {
					fileReport.extraKeys[k] = (fileReport.extraKeys[k] || 0) + 1;
					report.extraKeys[k] = report.extraKeys[k] || { count: 0, files: [] as string[] };
					report.extraKeys[k].count += 1;
					if (!report.extraKeys[k].files.includes(f)) report.extraKeys[k].files.push(f);
				}
			});

			const problems = validateRow(r);
			if (Object.keys(problems).length) {
				fileReport.problems += 1;
				if (fileReport.samples.length < 10) fileReport.samples.push({ index: i, company: r.company || r.Name || r.name || null, problems, row: r });
			}
		}

		// summarize total extra keys
		report.extraKeySummary = Object.keys(report.extraKeys).length;
		report.files[f] = fileReport;
	}

	const ts = new Date().toISOString().replace(/[:.]/g, '-');
	const outPath = path.join(REPORTS_DIR, `validation-${ts}.json`);
	fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
	// print summary
	console.log('Validation complete. Report written to', outPath);
	for (const f of Object.keys(report.files)) {
		const fr = report.files[f];
		console.log(`${f}: ${fr.total} rows, ${fr.problems} rows with problems, ${Object.keys(fr.extraKeys).length} extra keys`);
	}
}

if (require.main === module) run();

export default run;
