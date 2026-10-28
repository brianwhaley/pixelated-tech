const assert = require('node:assert/strict');
// eslint-disable-next-line pixelated/package-json-missing-dependency
const test = require('node:test');

const { handler } = require('./index');

test('returns a launch response for Alexa LaunchRequest events', async () => {
    const response = await handler({ request: { type: 'LaunchRequest' } }, {});

    assert.equal(response.version, '1.0');
    assert.equal(response.response.shouldEndSession, false);
    assert.match(response.response.outputSpeech.text, /Would you like to hear a nerd joke/);
});