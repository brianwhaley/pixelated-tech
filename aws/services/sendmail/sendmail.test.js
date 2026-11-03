import assert from 'node:assert/strict';
// eslint-disable-next-line pixelated/package-json-missing-dependency
import test from 'node:test';

process.env.SMTP_USER = 'test@example.com';
process.env.SMTP_PASSWORD = 'test-password';

const { handler, getConfirmationMailOptions, getPrimaryMailOptions } = await import('./src/index.mjs');

test('rejects an empty form submission', async () => {
	const response = await handler({});

	assert.equal(response.statusCode, 400);
	assert.equal(JSON.parse(response.body).message, 'Bad Request: Request body cannot be empty.');
});

test('builds a confirmation email using the configured recipient field', () => {
	const mailOptions = getConfirmationMailOptions({
		domain: 'customer.com',
		email: 'customer@example.com',
		confirmationRecipientField: 'email',
		confirmationSubject: 'Thank you for contacting us',
		confirmationBody: 'We received your request.'
	});

	assert.deepEqual(mailOptions, {
		from: 'thankyou@customer.com',
		to: 'customer@example.com',
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
		subject: 'Contact submission',
		html: '<p>Form details</p>',
		text: '<p>Form details</p>'
	});
});