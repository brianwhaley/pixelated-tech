import assert from 'node:assert/strict';
// eslint-disable-next-line pixelated/package-json-missing-dependency
import test from 'node:test';

process.env.SMTP_USER = 'test@example.com';
process.env.SMTP_PASSWORD = 'test-password';

const { handler } = await import('./src/index.mjs');

test('rejects an empty form submission', async () => {
	const response = await handler({});

	assert.equal(response.statusCode, 400);
	assert.equal(JSON.parse(response.body).message, 'Bad Request: Request body cannot be empty.');
});