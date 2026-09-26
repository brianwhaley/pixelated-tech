import { beforeEach, describe, expect, it, vi } from 'vitest';

const putDynamoStringItemMock = vi.hoisted(() => vi.fn());
const sendSmtpMailMock = vi.hoisted(() => vi.fn());
const loadSitesConfigMock = vi.hoisted(() => vi.fn());
const getSitesConfigDomainsMock = vi.hoisted(() => vi.fn());

vi.mock('../components/integrations/aws.dynamo.integration', () => ({
	DEFAULT_PIXELATED_FORM_SUBMISSIONS_TABLE: 'PixelatedFormSubmissionsTable',
	putDynamoStringItem: putDynamoStringItemMock,
}));

vi.mock('../components/integrations/smtp.integration', () => ({
	sendSmtpMail: sendSmtpMailMock,
}));

vi.mock('../components/admin/sites/sites.integration', () => ({
	loadSitesConfig: loadSitesConfigMock,
	getSitesConfigDomains: getSitesConfigDomainsMock,
}));

import { processFormSubmission, processFormSubmissionRequest } from '../components/sitebuilder/form/formsubmit-server';

describe('formsubmit-server', () => {
	beforeEach(() => {
		putDynamoStringItemMock.mockReset().mockResolvedValue({});
		sendSmtpMailMock.mockReset().mockResolvedValue({ info: {} });
		loadSitesConfigMock.mockReset().mockResolvedValue([
			{ url: 'https://www.palmetto-epoxy.com', localPort: '3006' },
		]);
		getSitesConfigDomainsMock.mockReset().mockReturnValue(['palmetto-epoxy.com']);
	});

	it('loads allowed domains and local origins from shared site configuration', async () => {
		const response = await processFormSubmissionRequest(new Request('https://admin.pixelated.tech/api/process-form-submit', {
			method: 'OPTIONS',
			headers: { Origin: 'https://localhost:3006' },
		}));

		expect(response.status).toBe(204);
		expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://localhost:3006');
		expect(loadSitesConfigMock).toHaveBeenCalledOnce();
	});

	it('rejects origins outside shared site configuration', async () => {
		const response = await processFormSubmissionRequest(new Request('https://admin.pixelated.tech/api/process-form-submit', {
			method: 'OPTIONS',
			headers: { Origin: 'https://untrusted.example.com' },
		}));

		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({ success: false, message: 'Origin is not allowed.' });
	});

	it('rejects invalid submission payloads with CORS headers', async () => {
		const response = await processFormSubmissionRequest(new Request('https://admin.pixelated.tech/api/process-form-submit', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Origin: 'https://www.palmetto-epoxy.com',
			},
			body: JSON.stringify([]),
		}));

		expect(response.status).toBe(400);
		expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://www.palmetto-epoxy.com');
	});

	it('persists dynamic fields and sends mail with server metadata', async () => {
		const now = new Date('2026-09-25T12:34:56.000Z');
		const result = await processFormSubmission({
			from: 'untrusted@example.com',
			to: 'recipient@example.com',
			subject: 'Contact request',
			domain: 'palmetto-epoxy.com',
			formName: 'contact-us',
			customField: 'kept',
			orderData: { items: [{ id: 'item-1' }] },
		}, {
			allowedDomains: ['palmetto-epoxy.com'],
			now,
			submissionId: 'submission-1',
		});

		expect(result).toEqual({ success: true, submissionId: 'submission-1' });
		expect(putDynamoStringItemMock).toHaveBeenCalledWith('PixelatedFormSubmissionsTable', expect.objectContaining({
		from: 'brian@pixelated.tech',
		customField: 'kept',
		orderData: JSON.stringify({ items: [{ id: 'item-1' }] }),
		Date: now.toLocaleDateString(),
		Status: 'Submitted',
		timestamp: now.toISOString(),
		submissionId: 'submission-1',
	}));
		expect(sendSmtpMailMock).toHaveBeenCalledWith(expect.objectContaining({
		from: 'brian@pixelated.tech',
		to: 'recipient@example.com',
		subject: 'Contact request',
	}));
	});

	it('rejects domains outside the configured site allowlist', async () => {
		const result = await processFormSubmission({
			to: 'recipient@example.com',
			domain: 'untrusted.example.com',
		}, { allowedDomains: ['palmetto-epoxy.com'] });

		expect(result).toEqual({ success: false, errorCode: 'invalid-domain' });
		expect(putDynamoStringItemMock).not.toHaveBeenCalled();
		expect(sendSmtpMailMock).not.toHaveBeenCalled();
	});

	it('silently ignores honeypot submissions', async () => {
		const result = await processFormSubmission({
			to: 'recipient@example.com',
			domain: 'palmetto-epoxy.com',
			website: 'https://spam.example.com',
		}, { allowedDomains: ['palmetto-epoxy.com'] });

		expect(result).toEqual({ success: true, ignored: true });
		expect(putDynamoStringItemMock).not.toHaveBeenCalled();
		expect(sendSmtpMailMock).not.toHaveBeenCalled();
	});
});