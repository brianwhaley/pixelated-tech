import assert from 'node:assert/strict';
// eslint-disable-next-line pixelated/package-json-missing-dependency
import test from 'node:test';

process.env.S3_BUCKET = 'test-bucket';

const {
	handler,
	getConfirmationMailOptions,
	getPrimaryMailOptions,
	getSesMessageBody
} = await import('./index.mjs');

test('rejects an S3 event without records', async () => {
	await assert.rejects(
		handler({}),
		new Error('S3 event must contain at least one record')
	);
});

test('builds a confirmation email using the configured recipient field', () => {
	assert.deepEqual(getConfirmationMailOptions({
		domain: 'customer.com',
		email: 'customer@example.com',
		confirmationRecipientField: 'email',
		confirmationSubject: 'Thank you for contacting us',
		confirmationBody: 'We received your request.'
	}), {
		from: 'thankyou@customer.com',
		to: 'customer@example.com',
		cc: 'thankyou@customer.com',
		subject: 'Thank you for contacting us',
		text: 'We received your request.'
	});
});

test('does not build a confirmation email without complete metadata', () => {
	assert.equal(getConfirmationMailOptions({
		email: 'customer@example.com',
		confirmationRecipientField: 'email',
		confirmationSubject: 'Thank you'
	}), null);
});

test('builds the primary email from the platform sender', () => {
	assert.deepEqual(getPrimaryMailOptions({
		to: 'owner@customer.com',
		subject: 'Contact submission'
	}, '<p>Form details</p>'), {
		from: 'info@pixelated.tech',
		to: 'owner@customer.com',
		bcc: 'brian@pixelated.tech',
		subject: 'Contact submission',
		html: '<p>Form details</p>',
		text: '<p>Form details</p>'
	});
});

test('omits the SES HTML body when a message is text-only', () => {
	assert.deepEqual(getSesMessageBody({ text: 'We received your request.' }), {
		Text: { Data: 'We received your request.', Charset: 'UTF-8' }
	});
});

test('includes the SES HTML body when provided', () => {
	assert.deepEqual(getSesMessageBody({
		html: '<p>Form details</p>',
		text: 'Form details'
	}), {
		Html: { Data: '<p>Form details</p>', Charset: 'UTF-8' },
		Text: { Data: 'Form details', Charset: 'UTF-8' }
	});
});
