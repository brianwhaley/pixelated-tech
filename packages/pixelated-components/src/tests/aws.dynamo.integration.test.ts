import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSend = vi.hoisted(() => vi.fn());

vi.mock('@aws-sdk/client-dynamodb', () => ({
	DynamoDBClient: class {
		send = mockSend;
	},
	ScanCommand: class {
		input: any;

		constructor(input: any) {
			this.input = input;
		}
	},
}));

vi.mock('../components/config/config', () => ({
	getFullPixelatedConfig: () => ({
		aws: {
			region: 'us-east-1',
			access_key_id: 'test-access-key',
			secret_access_key: 'test-secret-key',
		},
	}),
}));

import {
	buildPixelatedFormSubmissionReportRows,
	listPixelatedFormSubmissionReportRows,
} from '../components/integrations/aws.dynamo.integration';

describe('aws dynamo integration', () => {
	beforeEach(() => {
		mockSend.mockReset();
	});

	it('flattens orderData into report row fields', () => {
		const rows = buildPixelatedFormSubmissionReportRows([
			{
				orderData: JSON.stringify({
					checkoutData: {
							items: [
								{
									id: 'class-1',
									title: 'Sewing Class',
									quantity: 2,
									category: 'Adult',
								},
							],
							shippingTo: {
								name: 'Test User',
								street1: '123 Main St',
								city: 'Bluffton',
								state: 'SC',
								zip: '29910',
								country: 'US',
								phone: '1234567890',
								email: 'test@example.com',
								child_name: 'Grace Sturkie',
								child_birthdate: '2017-10-21',
								birthdate: '2026-05-01',
								emergency_contact_name: 'Test User',
								emergency_contact_telephone: '1234567890',
								full_payment: 'yes',
								cancellation_policy: 'yes',
								photo_consent: 'yes',
								closed_toe_shoes: 'yes',
								class_materials: 'yes',
								minimum_students: 'yes',
								food_allergies: 'cats',
								bleeding_disorder: 'no',
								injury_liability: 'Test Liability',
							},
						},
						captureResponse: {
							payment: {
								created_at: '2026-05-05T10:00:00.000Z',
							},
						},
				}),
			},
		]);

		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({
			created_at: new Date('2026-05-05T10:00:00.000Z').toLocaleString(),
			shipping_to: {
				name: 'Test User',
				street1: '123 Main St',
				city: 'Bluffton',
				state: 'SC',
				zip: '29910',
				country: 'US',
				phone: '1234567890',
				email: 'test@example.com',
			},
			registration_data: {
				child_name: 'Grace Sturkie',
				child_birthdate: '2017-10-21',
				birthdate: '2026-05-01',
				emergency_contact_name: 'Test User',
				emergency_contact_telephone: '1234567890',
				full_payment: 'yes',
				cancellation_policy: 'yes',
				photo_consent: 'yes',
				closed_toe_shoes: 'yes',
				class_materials: 'yes',
				minimum_students: 'yes',
				food_allergies: 'cats',
				bleeding_disorder: 'no',
				injury_liability: 'Test Liability',
			},
			items: [
				{
					id: 'class-1',
					title: 'Sewing Class',
					quantity: 2,
					category: 'Adult',
				},
			],
		});
	});

	it('keeps a single items object as a nested object', () => {
		const rows = buildPixelatedFormSubmissionReportRows([
			{
				orderData: JSON.stringify({
					checkoutData: {
						items: {
							id: 'solo-1',
							title: 'Solo Class',
							quantity: 1,
							category: 'Adult',
						},
					},
				}),
			},
		]);

		expect(rows).toHaveLength(1);
		expect(rows[0].items).toEqual({
			id: 'solo-1',
			title: 'Solo Class',
			quantity: 1,
			category: 'Adult',
		});
	});

	it('maps legacy item field names into the new item shape', () => {
		const rows = buildPixelatedFormSubmissionReportRows([
			{
				orderData: JSON.stringify({
					checkoutData: {
						items: [
							{
								itemID: 'legacy-1',
								itemTitle: 'Legacy Class',
								itemQuantity: 3,
								itemCategory: 'Adult',
							},
						],
					},
				}),
			},
		]);

		expect(rows).toHaveLength(1);
		expect(rows[0].items).toEqual([
			{
				id: 'legacy-1',
				title: 'Legacy Class',
				quantity: 3,
				category: 'Adult',
			},
		]);
	});

	it('scans the report table with domain and formName filters', async () => {
		mockSend.mockResolvedValueOnce({
			Items: [
				{
					domain: { S: 'thethreemusesofbluffton.com' },
					formName: { S: 'The Three Muses of Bluffton Order Form' },
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
		expect(rows[0].created_at).toBe(new Date('2026-05-05T10:00:00.000Z').toLocaleString());
		expect(rows[0].shipping_to).toHaveProperty('name');
	});
});