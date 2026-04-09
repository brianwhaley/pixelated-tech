#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const child = require('child_process');

const ROOT = process.cwd();
const BUILD_DIR = path.join(ROOT, 'build', 'validate');
const FALLBACK_DIR = path.join('/tmp', 'validate');

function runTSC() {
	const tsc = path.join(ROOT, 'node_modules', '.bin', 'tsc');
	const cmd = fs.existsSync(tsc) ? tsc : 'tsc';
	console.log('Compiling TypeScript (this may take a moment)...');
	// Try to compile into the project build dir first; fall back to /tmp for reliability
	let res = child.spawnSync(cmd, ['-p', 'tsconfig.json', '--outDir', BUILD_DIR], { stdio: 'inherit' });
	if (res.status !== 0) {
		console.warn('Local build failed, retrying to /tmp/...');
		res = child.spawnSync(cmd, ['-p', 'tsconfig.json', '--outDir', FALLBACK_DIR], { stdio: 'inherit' });
		if (res.status !== 0) throw new Error('tsc failed');
	}
}

function loadCompanyModule() {
	// compiled Company.js may be at BUILD_DIR or in fallback /tmp location; try both
	const possible = [
		path.join(BUILD_DIR, 'src', 'app', 'company', 'Company.js'),
		path.join(BUILD_DIR, 'Company.js'),
		path.join(FALLBACK_DIR, 'Company.js'),
		path.join(FALLBACK_DIR, 'src', 'app', 'company', 'Company.js')
	];
	for (const p of possible) {
		if (fs.existsSync(p)) return require(p);
	}
	throw new Error('Compiled Company.js not found at expected locations: ' + possible.join(', '));
}

function listPublicFiles() {
	const P = path.join(ROOT, 'public');
	return fs.readdirSync(P).filter(f => f.endsWith('.json')).map(f => path.join(P, f));
}

function run() {
	try {
		runTSC();
	} catch (err) {
		console.error('TypeScript compile failed:', err.message || err);
		process.exit(1);
	}

	const CompanyModule = loadCompanyModule();
	const Company = CompanyModule.Company;
	const CompanySpec = CompanyModule.CompanySpec;

	const report = { generatedAt: new Date().toISOString(), files: {}, extraKeys: {} };

	const files = listPublicFiles();
	for (const filePath of files) {
		const fileName = path.basename(filePath);
		let obj;
		try { obj = JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch (err) { report.files[fileName] = { error: 'parse failed', err: String(err) }; continue; }
		const rows = Array.isArray(obj.results) ? obj.results : [];
		const fileReport = { total: rows.length, problems: 0, samples: [], extraKeys: {} };

		for (let i = 0; i < rows.length; i++) {
			const r = rows[i];
			// collect extra keys
			Object.keys(r).forEach(k => {
				if (!(k in CompanySpec)) {
					fileReport.extraKeys[k] = (fileReport.extraKeys[k] || 0) + 1;
					report.extraKeys[k] = report.extraKeys[k] || { count: 0, files: [] };
					report.extraKeys[k].count += 1;
					if (!report.extraKeys[k].files.includes(fileName)) report.extraKeys[k].files.push(fileName);
				}
			});

			const res = Company.validate(r);
			if (res && res.errors && Object.keys(res.errors).length) {
				fileReport.problems += 1;
				if (fileReport.samples.length < 10) fileReport.samples.push({ index: i, company: r.company || r.Name || r.name || null, problems: res.errors, row: r });
			}
		}

		report.files[fileName] = fileReport;
	}

	// finalize
	report.extraKeySummary = Object.keys(report.extraKeys).length;

	const REPORTS_DIR = path.join(ROOT, 'reports');
	if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR);
	const ts = new Date().toISOString().replace(/[:.]/g, '-');
	const outPath = path.join(REPORTS_DIR, `validation-${ts}.json`);
	fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
	console.log('Validation complete. Report written to', outPath);
	for (const f of Object.keys(report.files)) {
		const fr = report.files[f];
		console.log(`${f}: ${fr.total} rows, ${fr.problems} rows with problems, ${Object.keys(fr.extraKeys).length} extra keys`);
	}
}

if (require.main === module) run();

module.exports = run;
