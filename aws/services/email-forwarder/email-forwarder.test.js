import assert from 'node:assert/strict';
// eslint-disable-next-line pixelated/package-json-missing-dependency
import test from 'node:test';

const { handler } = await import('./src/index.mjs');

test('ignores an event without an SES record', async () => {
	const response = await handler({});

	assert.equal(response, undefined);
});