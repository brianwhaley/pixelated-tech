import assert from 'node:assert/strict';
// eslint-disable-next-line pixelated/package-json-missing-dependency
import test from 'node:test';

import { handler } from './index.mjs';

test('rejects a request without a URL query parameter', async () => {
	const response = await handler({ queryStringParameters: {} });

	assert.equal(response.statusCode, 400);
	assert.deepEqual(JSON.parse(response.body), {
		error: true,
		message: 'A URL query parameter is required.'
	});
});

test('rejects an invalid URL query parameter', async () => {
	const response = await handler({ queryStringParameters: { url: 'not-a-url' } });

	assert.equal(response.statusCode, 400);
	assert.deepEqual(JSON.parse(response.body), {
		error: true,
		message: 'The URL query parameter is invalid.'
	});
});