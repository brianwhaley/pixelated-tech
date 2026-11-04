import assert from 'node:assert/strict';
// eslint-disable-next-line pixelated/package-json-missing-dependency
import test from 'node:test';

const { handler, getMailOptions, getSesMessageBody } = await import('./src/index.mjs');

test('rejects an empty form submission', async () => {
	const response = await handler({});

	assert.equal(response.statusCode, 400);
	assert.equal(JSON.parse(response.body).message, 'Bad Request: Request body cannot be empty.');
});

test('builds a generic SES message from the platform sender', () => {
	assert.deepEqual(getMailOptions({
		to: 'owner@customer.com',
		subject: 'Contact submission',
		html: '<p>Form details</p>'
	}), {
		from: 'info@pixelated.tech',
		to: 'owner@customer.com',
		subject: 'Contact submission',
		html: '<p>Form details</p>',
		text: '<p>Form details</p>'
	});
});

test('builds an SES body with text and optional HTML', () => {
	assert.deepEqual(getSesMessageBody({
		html: '<p>Form details</p>',
		text: 'Form details'
	}), {
		Html: { Data: '<p>Form details</p>', Charset: 'UTF-8' },
		Text: { Data: 'Form details', Charset: 'UTF-8' }
	});
});