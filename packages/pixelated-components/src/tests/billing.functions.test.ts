import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadBillingData, compileInvoiceData } from '../components/admin/billing/billing.functions';
import fs from 'fs';
import { generateInvoicePdfsForSites, dispatchInvoiceEmails, loadBillingConfigData } from '../components/admin/billing/billing.server';
import puppeteer from 'puppeteer';
import nodemailer from 'nodemailer';
import { getFullPixelatedConfig } from '../components/config/config';
import { getLiveBillingStats } from '../components/integrations/wordpress.jetpack.server';
import * as dynamoIntegration from '../components/integrations/aws.dynamo.integration';

const mockSend = vi.hoisted(() => vi.fn());

vi.mock('@aws-sdk/client-dynamodb', () => ({
	DynamoDBClient: class {
		config: any;

		constructor(config: any) {
			this.config = config;
		}

		send = mockSend;
	},
	ScanCommand: class {
		input: any;

		constructor(input: any) {
			this.input = input;
		}
	},
}));

vi.mock('fs', () => ({
	default: {
		existsSync: vi.fn(),
		readFileSync: vi.fn(),
		mkdirSync: vi.fn()
	}
}));

vi.mock('puppeteer', () => ({
	default: {
		launch: vi.fn()
	},
	launch: vi.fn()
}));

vi.mock('nodemailer', () => ({
	default: {
		createTransport: vi.fn()
	}
}));

vi.mock('next/headers', () => ({
	headers: vi.fn().mockResolvedValue({
		get: (key: string) => {
			if (key === 'host') return 'localhost:3000';
			if (key === 'x-forwarded-proto') return 'https';
			return undefined;
		}
	})
}));

vi.mock('../components/config/config', () => ({
	getFullPixelatedConfig: vi.fn()
}));

vi.mock('../components/integrations/aws.dynamo.integration', () => ({
	listPixelatedFormSubmissionReportRows: vi.fn(),
	DEFAULT_PIXELATED_FORM_SUBMISSIONS_TABLE: 'PixelatedFormSubmissionsTable'
}));

vi.mock('../components/integrations/wordpress.jetpack.server', () => ({
	getLiveBillingStats: vi.fn()
}));

describe('Billing Functions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(getFullPixelatedConfig).mockReturnValue({
			integrations: {
				aws: { region: 'us-east-1' }
			}
		} as any);
		vi.mocked(dynamoIntegration.listPixelatedFormSubmissionReportRows).mockResolvedValue([]);
	});

	describe('loadBillingData', () => {
		it('loads valid billing configuration successfully', () => {
			const mockData = {
				subscriptions: { standard: { price: 200, services: ['Test'] } },
				paymentInfo: { method: 'Cash', details: 'Hand it over', terms: 'Now' },
				sites: [{ name: 'testsite', url: 'https://testsite.com' }]
			};
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockData));

			const result = loadBillingData('/fake/path.json');
			expect(result.subscriptions.standard.price).toBe(200);
			expect(result.paymentInfo.method).toBe('Cash');
			expect(result.sites.length).toBe(1);
		});

		it('throws an error if configuration file is missing', () => {
			vi.mocked(fs.existsSync).mockReturnValue(false);
			expect(() => loadBillingData('/fake/path.json')).toThrow('Failed to load billing configuration');
		});

		it('loads site-specific form completions by domain without filtering by form name', async () => {
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
				subscriptions: {},
				paymentInfo: { method: '', details: '', terms: '' },
				sites: [
					{
						name: 'palmetto-epoxy',
						url: 'https://www.palmetto-epoxy.com',
						billing: { tier: 'premium', email: 'x@y.com', companyName: 'Palmetto Epoxy', address: '116 Beckenridge Circle' }
					}
				]
			}));
			vi.mocked(dynamoIntegration.listPixelatedFormSubmissionReportRows).mockResolvedValueOnce([
				{
					created_at: '2026-06-15T12:00:00.000Z',
					formName: 'Palmetto Epoxy Order Form',
					shipping_to: { email: 'test@palmetto-epoxy.com' }
				}
			]);

			const result = await loadBillingConfigData('2026-06', 'palmetto-epoxy');

			expect(dynamoIntegration.listPixelatedFormSubmissionReportRows).toHaveBeenCalledWith({
				tableName: 'PixelatedFormSubmissionsTable',
				domain: 'palmetto-epoxy.com'
			});
			expect(result.formCompletions).toHaveLength(1);
			expect(result.formCompletions[0].formName).toBe('Palmetto Epoxy Order Form');
		});
	});

	describe('compileInvoiceData', () => {
		const mockSubscriptions = {
			standard: { price: 100, services: ['Hosting'] },
			premium: { price: 300, services: ['Hosting', 'SEO'] }
		};
		const mockPayment = { method: 'Zelle', details: 'Send to Zelle', terms: 'Net 30' };

		it('compiles invoice correctly for standard tier without overrides', () => {
			const site = {
				name: 'testsite',
				url: 'https://testsite.com',
				billing: { tier: 'standard', email: 'test@test.com', companyName: 'Test Inc', address: '123 Test St' }
			};

			const data = compileInvoiceData(site, '2026-06', mockSubscriptions, mockPayment, [], []);
			expect(data.invoiceNumber).toBe('INV-202606-TESTSITE');
			expect(data.totalOwed).toBe(100);
			expect(data.items[0].description).toContain('STANDARD Plan');
		});

		it('compiles invoice correctly applying legacy price overrides', () => {
			const site = {
				name: 'testsite',
				url: 'https://testsite.com',
				billing: { tier: 'premium', priceOverride: 150, email: 'test@test.com', companyName: 'Test Inc', address: '123 Test St' }
			};

			const data = compileInvoiceData(site, '2026-06', mockSubscriptions, mockPayment, [], [], [], { '2026-06': ['Added website accessibility enhancements', 'Updated local SEO schema'] });
			expect(data.totalOwed).toBe(150);
			expect(data.enhancements).toEqual(['Added website accessibility enhancements', 'Updated local SEO schema']);
		});

		it('includes additional invoice items before the subscription line and totals them correctly', () => {
			const site = {
				name: 'testsite',
				url: 'https://testsite.com',
				billing: {
					tier: 'premier',
					price: 250,
					email: 'test@test.com',
					companyName: 'Test Inc',
					address: '123 Test St',
					additionalInvoiceItems: {
						'2026-07': {
							amount: 500,
							description: 'Payment #4 for Initial Build'
						}
					}
				}
			};

			const data = compileInvoiceData(site, '2026-07', mockSubscriptions, mockPayment, [], []);
			expect(data.items[0].description).toContain('Payment #4 for Initial Build');

			expect(data.totalOwed).toBe(750);
		});

		it('normalizes tier names properly', () => {
			const site = {
				name: 'testsite',
				url: 'https://testsite.com',
				billing: { tier: 'premier', email: 'test@test.com', companyName: 'Test Inc', address: '123 Test St' }
			};

			const data = compileInvoiceData(site, '2026-06', mockSubscriptions, mockPayment, [], []);
			expect(data.items[0].amount).toBe(300); // Because 'premier' normalizes to 'premium'
		});

		it('throws an error if site is not billable', () => {
			const site = { name: 'unbillable', url: 'https://testsite.com' };
			expect(() => compileInvoiceData(site, '2026-06', mockSubscriptions, mockPayment, [], [])).toThrow('is not a billable account');
		});
	});

	describe('generateInvoicePdfsForSites', () => {
		it('generates PDF buffer via Puppeteer and returns success object', async () => {
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
				subscriptions: { standard: { price: 200, services: [] } },
				paymentInfo: {},
				sites: [{
					name: 'testsite',
					url: 'https://testsite.com',
					blogRss: 'https://blog.testsite.com/feed',
					billing: { tier: 'standard', email: 'test@test.com', companyName: 'Test Inc', address: '123 Test St' }
				}]
			}));
			vi.mocked(getFullPixelatedConfig).mockReturnValue({
				integrations: {
					wordpress: { apiToken: 'token' },
					puppeteer: { internalToken: 'secret-token' }
				}
			} as any);
			vi.mocked(getLiveBillingStats).mockResolvedValue({ posts: [], socialReferrers: [], simulated: false });

			const mockPage = {
				goto: vi.fn().mockResolvedValue(true),
				setContent: vi.fn().mockResolvedValue(true),
				pdf: vi.fn().mockResolvedValue(true),
				close: vi.fn().mockResolvedValue(true)
			};
			const mockBrowser = {
				newPage: vi.fn().mockResolvedValue(mockPage),
				close: vi.fn().mockResolvedValue(true)
			};
			vi.mocked(puppeteer.launch).mockResolvedValue(mockBrowser as any);

			const results = await generateInvoicePdfsForSites(['testsite'], '2026-06');
			expect(results).toHaveLength(1);
			expect(results[0].success).toBe(true);
			expect(results[0].pdfPath).toContain('.pdf');
			expect(mockBrowser.close).toHaveBeenCalled();
		});

		it('skips site if missing from configuration', async () => {
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
				subscriptions: { standard: { price: 200, services: [] } },
				paymentInfo: {},
				sites: []
			}));

			const results = await generateInvoicePdfsForSites(['missing-site'], '2026-06');
			expect(results).toHaveLength(1);
			expect(results[0].success).toBe(false);
			expect(results[0].message).toContain('not found or has no billing setup');
		});

		it('handles puppeteer errors gracefully', async () => {
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
				subscriptions: { standard: { price: 200, services: [] } },
				paymentInfo: {},
				sites: [{
					name: 'testsite',
					url: 'https://testsite.com',
					billing: { tier: 'standard', email: 'test@test.com', companyName: 'Test Inc', address: '123 Test St' }
				}]
			}));
			vi.mocked(getFullPixelatedConfig).mockReturnValue({} as any);
			vi.mocked(getLiveBillingStats).mockResolvedValue({ posts: [], socialReferrers: [], simulated: false });

			const mockBrowser = {
				newPage: vi.fn().mockRejectedValue(new Error('Browser crash')),
				close: vi.fn().mockResolvedValue(true)
			};
			vi.mocked(puppeteer.launch).mockResolvedValue(mockBrowser as any);

			const results = await generateInvoicePdfsForSites(['testsite'], '2026-06');
			expect(results).toHaveLength(1);
			expect(results[0].success).toBe(false);
			expect(results[0].message).toBe('Browser crash');
		});

		it('handles preview mode and returns compiled invoice data', async () => {
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
				subscriptions: { standard: { price: 200, services: [] } },
				paymentInfo: {},
				sites: [{
					name: 'testsite',
					url: 'https://testsite.com',
					billing: { tier: 'standard', email: 'test@test.com', companyName: 'Test Inc', address: '123 Test St' }
				}]
			}));
			vi.mocked(getFullPixelatedConfig).mockReturnValue({
				integrations: {
					aws: { region: 'us-east-1' }
				}
			} as any);
			vi.mocked(getLiveBillingStats).mockResolvedValue({ posts: [], socialReferrers: [], simulated: false });

			const results = await generateInvoicePdfsForSites(['testsite'], '2026-06', true);
			expect(results).toHaveLength(1);
			expect(results[0].success).toBe(true);
			expect(results[0].invoiceData).toBeDefined();
			expect(results[0].invoiceData.companyName).toBe('Test Inc');
		});
	});

	describe('dispatchInvoiceEmails', () => {
		it('sends emails successfully and returns logs', async () => {
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
				paymentInfo: { fromEmail: 'billing@test.com' }
			}));
			vi.mocked(getFullPixelatedConfig).mockReturnValue({
				integrations: { smtp: { smtpHost: 'smtp.test.com', smtpUser: 'user', smtpPass: 'pass' } }
			} as any);

			const mockTransporter = {
				sendMail: vi.fn().mockResolvedValue({ messageId: '12345' })
			};
			vi.mocked(nodemailer.createTransport).mockReturnValue(mockTransporter as any);

			const invoices = [{ siteName: 'testsite', pdfPath: 'test.pdf', email: 'client@test.com' }];
			const logs = await dispatchInvoiceEmails(invoices);
			
			expect(logs.some(log => log.includes('12345'))).toBe(true);
			expect(mockTransporter.sendMail).toHaveBeenCalled();
		});

		it('handles missing PDF files gracefully', async () => {
			vi.mocked(fs.existsSync).mockReturnValueOnce(true).mockReturnValueOnce(false); // second call is for the PDF file
			
			const invoices = [{ siteName: 'testsite', pdfPath: 'missing.pdf', email: 'client@test.com' }];
			const logs = await dispatchInvoiceEmails(invoices);
			
			expect(logs.some(log => log.includes('Invoice PDF file not found'))).toBe(true);
		});

		it('handles missing smtp config by falling back to stream transport', async () => {
			vi.mocked(fs.existsSync).mockReturnValue(true); // file exists
			vi.mocked(getFullPixelatedConfig).mockReturnValue({} as any);

			const mockTransporter = {
				sendMail: vi.fn().mockResolvedValue({ message: Buffer.from('mock stream') })
			};
			vi.mocked(nodemailer.createTransport).mockReturnValue(mockTransporter as any);

			const invoices = [{ siteName: 'testsite', pdfPath: 'test.pdf', email: 'client@test.com' }];
			const logs = await dispatchInvoiceEmails(invoices);
			
			expect(logs.some(log => log.includes('Local Stream Mode'))).toBe(true);
			expect(mockTransporter.sendMail).toHaveBeenCalled();
		});
	});
});
