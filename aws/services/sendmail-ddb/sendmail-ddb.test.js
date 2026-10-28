import assert from 'node:assert/strict';
// eslint-disable-next-line pixelated/package-json-missing-dependency
import test from 'node:test';

import { handler } from './src/index.mjs';

test('returns a validation response when required fields are missing', async () => {
	const response = await handler({});

	assert.equal(response.statusCode, 400);
	assert.match(JSON.parse(response.body).error, /Missing required fields/);
});