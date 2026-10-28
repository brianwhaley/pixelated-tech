const assert = require('node:assert/strict');
// eslint-disable-next-line pixelated/package-json-missing-dependency
const test = require('node:test');

const { handler } = require('./index');

test('redirects an empty request to the Slack installation flow', async () => {
	const response = await handler({}, {});

	assert.equal(response.statusCode, 302);
	assert.match(response.headers.Location, /^https:\/\/slack\.com\/oauth\/v2\/authorize\?/);
});