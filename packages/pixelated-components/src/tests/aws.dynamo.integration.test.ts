import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pixelatedConfig, mockOrderCheckoutData } from '../test/test-data';

const mockSend = vi.hoisted(() => vi.fn());
let lastClientConfig: any = null;
let mockAwsConfig: any = { ...pixelatedConfig.integrations?.aws };

vi.mock('@aws-sdk/client-dynamodb', () => ({
	DynamoDBClient: class {
		config: any;

		constructor(config: any) {
			this.config = config;
			lastClientConfig = config;
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

vi.mock('../components/config/config', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../components/config/config')>();
	return {
		...actual,
		getFullPixelatedConfig: vi.fn(),
	};
});

import { listPixelatedFormSubmissionReportRows } from '../components/integrations/aws.dynamo.integration';
import { getFullPixelatedConfig } from '../components/config/config';

describe('aws dynamo integration', () => {
	beforeEach(() => {
		mockSend.mockReset();
		lastClientConfig = null;
		mockAwsConfig = { ...pixelatedConfig.integrations?.aws };
		vi.mocked(getFullPixelatedConfig).mockImplementation(() => ({
			...pixelatedConfig,
			integrations: {
				...pixelatedConfig.integrations,
				aws: mockAwsConfig
			}
		} as any));
	});

	it('parses orderData into a generic report row', async () => {
		mockSend.mockResolvedValueOnce({
			Items: [
				{
					domain: { S: 'thethreemusesofbluffton.com' },
					timestamp: { S: '2026-05-05T10:00:00.000Z' },
					orderData: { S: JSON.stringify({
						checkoutData: mockOrderCheckoutData,
						captureResponse: {
							payment: {
								created_at: '2026-05-05T10:00:00.000Z',
							},
						},
					}) },
				},
			],
			LastEvaluatedKey: undefined,
		});

		const rows = await listPixelatedFormSubmissionReportRows({
			tableName: 'PixelatedFormSubmissionsTable',
			domain: 'thethreemusesofbluffton.com'
		});

		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({
			created_at: new Date('2026-05-05T10:00:00.000Z').toISOString(),
			domain: 'thethreemusesofbluffton.com',
			orderData: expect.any(Object),
		});
		expect(rows[0].orderData.checkoutData).toMatchObject(mockOrderCheckoutData);
	});

	it('parses nested orderData object without normalizing custom fields', async () => {
		mockSend.mockResolvedValueOnce({
			Items: [
				{
					domain: { S: 'thethreemusesofbluffton.com' },
					orderData: { S: JSON.stringify({
						checkoutData: {
							domain: 'thethreemusesofbluffton.com',
							items: {
								id: 'solo-1',
								title: 'Solo Class',
								quantity: 1,
								category: 'Adult',
							},
						},
					}) },
				},
			],
			LastEvaluatedKey: undefined,
		});

		const rows = await listPixelatedFormSubmissionReportRows({
			tableName: 'PixelatedFormSubmissionsTable',
			domain: 'thethreemusesofbluffton.com'
		});

		expect(rows).toHaveLength(1);
		expect(rows[0].orderData.checkoutData.items).toEqual({
			id: 'solo-1',
			title: 'Solo Class',
			quantity: 1,
			category: 'Adult',
		});
});

it('preserves legacy item arrays inside parsed orderData', async () => {
		mockSend.mockResolvedValueOnce({
			Items: [
				{
					domain: { S: 'thethreemusesofbluffton.com' },
					orderData: { S: JSON.stringify({
						checkoutData: {
							domain: 'thethreemusesofbluffton.com',
							items: [
								{
									itemID: 'legacy-1',
									itemTitle: 'Legacy Class',
									itemQuantity: 3,
									itemCategory: 'Adult',
								},
							],
						},
					}) },
				},
			],
			LastEvaluatedKey: undefined,
		});

		const rows = await listPixelatedFormSubmissionReportRows({
			tableName: 'PixelatedFormSubmissionsTable',
			domain: 'thethreemusesofbluffton.com'
		});

		expect(rows).toHaveLength(1);
		expect(rows[0].orderData.checkoutData.items).toEqual([
			{
				itemID: 'legacy-1',
				itemTitle: 'Legacy Class',
				itemQuantity: 3,
				itemCategory: 'Adult',
			},
		]);
});

it('scans the report table with domain and formName filters', async () => {
	mockSend.mockResolvedValueOnce({
		Items: [
			{
				domain: { S: 'thethreemusesofbluffton.com' },
				formName: { S: 'The Three Muses of Bluffton Order Form' },
				timestamp: { S: '2026-05-05T10:00:00.000Z' },
				createdAt: { S: '2026-05-05T10:00:00.000Z' },
				orderData: {
					S: JSON.stringify({
						checkoutData: {
							items: [],
							shippingTo: {
								name: 'Test User',
							},
						},
						captureResponse: {
							payment: {
								created_at: '2026-05-05T10:00:00.000Z',
							},
						},
					}),
				},
			},
		],
		LastEvaluatedKey: undefined,
	});

	const rows = await listPixelatedFormSubmissionReportRows({
		tableName: 'PixelatedFormSubmissionsTable',
		domain: 'thethreemusesofbluffton.com',
		formName: 'The Three Muses of Bluffton Order Form',
	});

	expect(mockSend).toHaveBeenCalledTimes(1);
	expect(rows).toHaveLength(1);
	expect(rows[0].created_at).toBe(new Date('2026-05-05T10:00:00.000Z').toISOString());
	expect(rows[0].orderData.checkoutData.shippingTo.name).toBe('Test User');
});

it('returns generic rows without Three Muses-specific shipping fields', async () => {
	mockSend.mockResolvedValueOnce({
		Items: [
			{
				domain: { S: 'palmetto-epoxy.com' },
				formName: { S: 'contact-form' },
				Date: { S: '6/16/2025' },
				subject: { S: 'Palmetto Epoxy Contact Us Submit' },
				from: { S: 'palmettoepoxy@gmail.com' },
				to: { S: 'palmettoepoxy@gmail.com' },
				email: { S: 'test@example.com' },
				domain: { S: 'palmetto-epoxy.com' },
				message: { S: 'Test inquiry' },
			},
		],
		LastEvaluatedKey: undefined,
	});

	const rows = await listPixelatedFormSubmissionReportRows({
		tableName: 'PixelatedFormSubmissionsTable',
		domain: 'palmetto-epoxy.com',
	});

	expect(rows).toHaveLength(1);
	expect(rows[0]).toMatchObject({
		created_at: '',
		domain: 'palmetto-epoxy.com',
		formName: 'contact-form',
	});
	expect(rows[0].orderData).toBeUndefined();
});

it('matches domain from nested orderData when top-level domain is missing', async () => {
	mockSend.mockResolvedValueOnce({
		Items: [
			{
				orderData: { S: JSON.stringify({
					checkoutData: {
						domain: 'palmetto-epoxy.com',
						items: [],
						shippingTo: { name: 'Nested Domain User' }
					},
					captureResponse: { payment: { created_at: '2026-06-01T08:00:00.000Z' } }
				}) },
			},
		],
		LastEvaluatedKey: undefined,
	});

	const rows = await listPixelatedFormSubmissionReportRows({
		tableName: 'PixelatedFormSubmissionsTable',
		domain: 'palmetto-epoxy.com',
	});

	expect(rows).toHaveLength(1);
	expect(rows[0].domain).toBe('palmetto-epoxy.com');
	expect(rows[0].orderData.checkoutData.shippingTo.name).toBe('Nested Domain User');
});

it('creates a Dynamo client without credentials when only region is configured', async () => {
	mockAwsConfig = { region: 'us-east-1' };
	mockSend.mockResolvedValueOnce({ Items: [], LastEvaluatedKey: undefined });

	await listPixelatedFormSubmissionReportRows({
		tableName: 'PixelatedFormSubmissionsTable',
		domain: 'thethreemusesofbluffton.com',
		formName: 'The Three Muses of Bluffton Order Form',
	});

	expect(lastClientConfig).toMatchObject({ region: 'us-east-1' });
	expect(lastClientConfig.credentials).toBeUndefined();
});

it('throws when the AWS region is missing', async () => {
	mockAwsConfig = {};

	await expect(listPixelatedFormSubmissionReportRows({
		tableName: 'PixelatedFormSubmissionsTable',
		domain: 'thethreemusesofbluffton.com',
		formName: 'The Three Muses of Bluffton Order Form',
	})).rejects.toThrow('AWS region is missing from pixelated.config.json.');
});

it('pages through scan results until LastEvaluatedKey is cleared', async () => {
	mockAwsConfig = { region: 'us-east-1' };
	mockSend
		.mockResolvedValueOnce({ Items: [{ domain: { S: 'thethreemusesofbluffton.com' }, formName: { S: 'The Three Muses of Bluffton Order Form' }, created_at: { S: '2026-05-05T10:00:00.000Z' } }], LastEvaluatedKey: { id: { S: 'next' } } })
		.mockResolvedValueOnce({ Items: [{ domain: { S: 'thethreemusesofbluffton.com' }, formName: { S: 'The Three Muses of Bluffton Order Form' }, created_at: { S: '2026-05-06T10:00:00.000Z' } }], LastEvaluatedKey: undefined });

	const rows = await listPixelatedFormSubmissionReportRows({
		tableName: 'PixelatedFormSubmissionsTable',
		domain: 'thethreemusesofbluffton.com',
		formName: 'The Three Muses of Bluffton Order Form',
	});

	expect(mockSend).toHaveBeenCalledTimes(2);
	expect(rows).toHaveLength(2);
});
it('normalizes DynamoDB attribute values into plain JavaScript values', async () => {
		mockSend.mockResolvedValueOnce({
			Items: [
				{
					domain: { S: 'thethreemusesofbluffton.com' },
					orderData: { S: JSON.stringify({
						checkoutData: {
							domain: 'thethreemusesofbluffton.com',
							items: [
								{
									itemID: 'legacy-1',
									itemTitle: 'Legacy Class',
									itemQuantity: 3,
									itemCategory: 'Adult',
								},
							],
							shippingTo: {
								name: 'Test User',
								street1: '123 Main St',
								city: 'Test City',
								state: 'SC',
								zip: '12345',
								country: 'US',
								phone: '1234567890',
								email: 'test@example.com',
							},
							captureResponse: {
								payment: {
									created_at: '2026-05-05T10:00:00.000Z',
								},
							},
						},
					}) },
					extra: { M: { nested: { S: 'value' } } },
					flags: { BOOL: true },
					list: { L: [{ S: 'a' }, { N: '2' }] },
					textSet: { SS: ['a', 'b'] },
					numSet: { NS: ['1', '2'] },
					bytes: { B: 'abc' },
				},
			],
			LastEvaluatedKey: undefined,
		});

		const rows = await listPixelatedFormSubmissionReportRows({
			tableName: 'PixelatedFormSubmissionsTable',
			domain: 'thethreemusesofbluffton.com',
		});

		expect(rows).toHaveLength(1);
		expect(rows[0].orderData.checkoutData.shippingTo.name).toBe('Test User');
		expect(rows[0].extra).toEqual({ nested: 'value' });
		expect(rows[0].flags).toBe(true);
		expect(rows[0].list).toEqual(['a', 2]);
		expect(rows[0].textSet).toEqual(['a', 'b']);
		expect(rows[0].numSet).toEqual([1, 2]);
		expect(rows[0].bytes).toBe('abc');
	});
});