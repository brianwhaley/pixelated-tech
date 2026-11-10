import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const IGNORED_DIRECTORIES = new Set([
	'.git',
	'.next',
	'build',
	'certificates',
	'coverage',
	'dist',
	'node_modules',
	'out',
]);

const PLACEHOLDER_WORDS = [
	'example',
	'fake',
	'dummy',
	'placeholder',
	'redacted',
	'sample',
	'test',
];

export const SECRET_RULES = [
	{
		id: 'google-api-key',
		pattern: /\bAIza[0-9A-Za-z_-]{30,}\b/g,
	},
	{
		id: 'aws-access-key',
		pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g,
	},
	{
		id: 'aws-secret-access-key',
		pattern: /\b(?:aws[_-]?secret[_-]?access[_-]?key|secret[_-]?access[_-]?key|ses[_-]?password)\b\s*[:=]\s*["']?([A-Za-z0-9/+=]{40})["']?/gi,
	},
	{
		id: 'aws-session-token',
		pattern: /\b(?:aws[_-]?session[_-]?token|session[_-]?token)\b\s*[:=]\s*["']?([A-Za-z0-9/+=]{80,})["']?/gi,
	},
	{
		id: 'github-token',
		pattern: /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g,
	},
	{
		id: 'stripe-secret-key',
		pattern: /\b(?:sk|rk)_live_[A-Za-z0-9]{16,}\b/g,
	},
	{
		id: 'stripe-webhook-secret',
		pattern: /\bwhsec_[A-Za-z0-9]{16,}\b/g,
	},
	{
		id: 'slack-token',
		pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g,
	},
	{
		id: 'npm-token',
		pattern: /\bnpm_[A-Za-z0-9]{20,}\b/g,
	},
	{
		id: 'sendgrid-api-key',
		pattern: /\bSG\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g,
	},
	{
		id: 'private-key',
		pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]+?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
	},
];

function isPlaceholderValue(value, text, offset) {
	const context = text.slice(Math.max(0, offset - 120), offset + value.length + 120);
	const normalized = `${value} ${context}`.toLowerCase();
	return PLACEHOLDER_WORDS.some((word) => normalized.includes(word));
}

function getLineNumber(text, offset) {
	return text.slice(0, offset).split('\n').length;
}

function redactValue(value) {
	if (value.length <= 8) return '[redacted]';
	return `${value.slice(0, 4)}...[redacted]`;
}

export function findSecretMatches(text) {
	const findings = [];
	for (const rule of SECRET_RULES) {
		rule.pattern.lastIndex = 0;
		let match;
		while ((match = rule.pattern.exec(text)) !== null) {
			const value = match[0];
			if (!isPlaceholderValue(value, text, match.index)) {
				findings.push({
					rule: rule.id,
					value,
					redactedValue: redactValue(value),
					line: getLineNumber(text, match.index),
				});
			}
			if (match[0].length === 0) rule.pattern.lastIndex += 1;
		}
	}
	return findings.sort((left, right) => left.line - right.line || left.rule.localeCompare(right.rule));
}

function isProbablyBinary(buffer) {
	return buffer.includes(0);
}

function runGit(root, args) {
	const result = spawnSync('git', args, {
		cwd: root,
		encoding: 'buffer',
	});
	if (result.status !== 0) {
		const error = result.stderr?.toString('utf8').trim() || 'Git command failed';
		throw new Error(error);
	}
	return result.stdout;
}

function splitNullSeparated(buffer) {
	return buffer.toString('utf8').split('\0').filter(Boolean);
}

export function getGitFilePaths(root, mode = 'tracked') {
	const args = mode === 'staged'
		? ['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR']
		: ['ls-files', '-z'];
	return splitNullSeparated(runGit(root, args));
}

export async function scanGitFiles(root, mode = 'tracked') {
	const findings = [];
	for (const relativePath of getGitFilePaths(root, mode)) {
		if (relativePath.split('/').some((segment) => IGNORED_DIRECTORIES.has(segment))) continue;
		const absolutePath = path.join(root, relativePath);
		let buffer;
		try {
			buffer = await fs.readFile(absolutePath);
		} catch {
			continue;
		}
		if (isProbablyBinary(buffer)) continue;
		const text = buffer.toString('utf8');
		for (const finding of findSecretMatches(text)) {
			findings.push({ ...finding, file: relativePath });
		}
	}
	return findings;
}

export function formatFindings(findings) {
	return findings.map((finding) => `${finding.file}:${finding.line} [${finding.rule}] ${finding.redactedValue}`).join('\n');
}

async function runCli() {
	const mode = process.argv.includes('--staged') ? 'staged' : 'tracked';
	const quiet = process.argv.includes('--quiet');
	const rootResult = spawnSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' });
	if (rootResult.status !== 0) throw new Error('Unable to determine Git repository root');
	const root = rootResult.stdout.trim();
	const findings = await scanGitFiles(root, mode);
	if (findings.length === 0) {
		if (!quiet) console.log(`✅ Secret scan passed (${mode} files)`);
		return;
	}
	console.error('❌ Secret scan failed:');
	console.error(formatFindings(findings));
	process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
	runCli().catch((error) => {
		console.error(`❌ Secret scan failed: ${error.message}`);
		process.exitCode = 1;
	});
}
