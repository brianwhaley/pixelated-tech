import assert from 'node:assert/strict';
// eslint-disable-next-line pixelated/package-json-missing-dependency
import test from 'node:test';

const { handler, isDeliveryStatusMessage, summarizeDeliveryStatus } = await import('./src/index.mjs');

test('ignores an event without an SES record', async () => {
	const response = await handler({});

	assert.equal(response, undefined);
});

test('recognizes delivery-status reports addressed to the relay', () => {
	const rawEmail = [
		'Content-Type: multipart/report; report-type="delivery-status"',
		'',
		'Content-Type: message/delivery-status',
		'',
		'Final-Recipient: rfc822; manningmetalworks@gmail.com',
		'Action: failed',
		'Diagnostic-Code: SMTP; 552 message blocked for potential security issue'
	].join('\r\n');

	assert.equal(isDeliveryStatusMessage(rawEmail, ['relay@forwarding.pixelated.tech']), true);
	assert.deepEqual(summarizeDeliveryStatus(rawEmail), {
		finalRecipient: 'manningmetalworks@gmail.com',
		deliveryStatus: 'rejected',
		smtpStatus: '552'
	});
});

test('does not classify a delivery-status report for a tenant recipient as a relay report', () => {
	const rawEmail = 'Content-Type: message/delivery-status\r\n';

	assert.equal(isDeliveryStatusMessage(rawEmail, ['info@manningmetalworks.com']), false);
});