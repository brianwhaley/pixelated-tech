import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendMailMock = vi.hoisted(() => vi.fn());
const createTransportMock = vi.hoisted(() => vi.fn(() => ({ sendMail: sendMailMock })));
let mockConfig: any;

vi.mock('nodemailer', () => ({
	default: { createTransport: createTransportMock },
}));

vi.mock('../components/config/config', () => ({
	getFullPixelatedConfig: () => mockConfig,
}));

import { sendSmtpEmail, sendSmtpMail } from '../components/integrations/smtp.integration';

describe('smtp integration', () => {
	beforeEach(() => {
		createTransportMock.mockClear();
		sendMailMock.mockReset();
		mockConfig = {
			integrations: {
				smtp: {
					smtpHost: 'smtp.gmail.com',
					smtpPort: 465,
					smtpSecure: true,
					smtpUser: 'brian.whaley@gmail.com',
					smtpPass: 'password',
				},
			},
		};
	});

	it('sends email through configured SMTP', async () => {
		sendMailMock.mockResolvedValueOnce({ messageId: 'message-1' });

		await expect(sendSmtpEmail('brian.whaley@gmail.com', 'test@example.com', 'Subject', 'Body')).resolves.toMatchObject({ hasSmtpConfig: true });

		expect(createTransportMock).toHaveBeenCalledWith({
			host: 'smtp.gmail.com',
			port: 465,
			secure: true,
			auth: {
				user: 'brian.whaley@gmail.com',
				pass: 'password',
			},
		});
		expect(sendMailMock).toHaveBeenCalledWith({ from: 'brian.whaley@gmail.com', to: 'test@example.com', subject: 'Subject', text: 'Body' });
	});

	it('throws when SMTP config is missing', async () => {
		mockConfig = { integrations: {} };

		await expect(sendSmtpEmail('from@example.com', 'to@example.com', 'Subject', 'Body')).rejects.toThrow('SMTP configuration is missing.');
	});

	it('uses stream transport when fallback is allowed and SMTP config is missing', async () => {
		mockConfig = { integrations: {} };
		sendMailMock.mockResolvedValueOnce({ message: Buffer.from('stream') });

		await expect(sendSmtpMail({ from: 'from@example.com', to: 'to@example.com', subject: 'Subject', text: 'Body' }, { allowStreamFallback: true })).resolves.toMatchObject({ hasSmtpConfig: false });

		expect(createTransportMock).toHaveBeenCalledWith({
			streamTransport: true,
			newline: 'unix',
			buffer: true,
		});
	});
});
