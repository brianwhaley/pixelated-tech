import assert from 'node:assert/strict';
// eslint-disable-next-line pixelated/package-json-missing-dependency
import test from 'node:test';

process.env.SMTP_USER = 'test@example.com';
process.env.SMTP_PASSWORD = 'test-password';
process.env.S3_BUCKET = 'test-bucket';

const { handler } = await import('./index.mjs');

test('rejects an S3 event without records', async () => {
	await assert.rejects(
		handler({}),
		new Error('S3 event must contain at least one record')
	);
});