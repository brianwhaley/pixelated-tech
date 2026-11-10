import { describe, expect, it } from 'vitest';
import { findSecretMatches, formatFindings } from '../scripts/secret-scanning.js';
import { pixelatedConfig } from '../test/test-data';

describe('secret scanning', () => {
	it('detects a Google API key without exposing it in formatted findings', () => {
		const googleKey = ['AIza', 'SyACcYSG_w7Fy2jfC_yphe05vsWPW4TxOAE'].join('');
		const findings = findSecretMatches(`const url = "?key=${googleKey}";`);

		expect(findings).toHaveLength(1);
		expect(findings[0].rule).toBe('google-api-key');
		expect(formatFindings([{ ...findings[0], file: 'fixture.ts' }])).not.toContain(googleKey);
	});

	it('allows explicit placeholder values', () => {
		const placeholder = ['AIza', 'TEST_GOOGLE_MAPS_KEY'].join('');
		expect(pixelatedConfig).toBeDefined();
		expect(findSecretMatches(placeholder)).toEqual([]);
	});

	it('detects approved provider credential formats', () => {
		const samples = [
			'aws_secret_access_key: ' + 'A'.repeat(40),
			'session_token: ' + 'A'.repeat(80),
			'sk_live_' + 'A'.repeat(20),
			'whsec_' + 'A'.repeat(20),
			'xoxb-' + 'A'.repeat(20),
			'npm_' + 'A'.repeat(20),
			'SG.' + 'A'.repeat(20) + '.' + 'B'.repeat(20),
		].join('\n');
		const rules = findSecretMatches(samples).map((finding) => finding.rule);

		expect(rules).toEqual(expect.arrayContaining([
			'aws-secret-access-key',
			'aws-session-token',
			'stripe-secret-key',
			'stripe-webhook-secret',
			'slack-token',
			'npm-token',
			'sendgrid-api-key',
		]));
	});

	it('requires a complete private-key block', () => {
		const privateKey = [
			['-----BEGIN', 'PRIVATE KEY-----'].join(' '),
			'base64payload',
			['-----END', 'PRIVATE KEY-----'].join(' '),
		].join('\n');
		expect(findSecretMatches(privateKey)[0].rule).toBe('private-key');
		expect(findSecretMatches('-----BEGIN PRIVATE KEY-----')).toEqual([]);
	});

	it('allows private-key fixtures identified as test data', () => {
		const privateKey = [
			'private_key: test fixture',
			'-----BEGIN PRIVATE KEY-----',
			'not-a-real-key',
			'-----END PRIVATE KEY-----',
		].join('\n');
		expect(findSecretMatches(privateKey)).toEqual([]);
	});
});
