import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { getFullPixelatedConfig } from '../config/config';

export const DEFAULT_PIXELATED_FORM_SUBMISSIONS_TABLE = 'PixelatedFormSubmissionsTable';
export const DEFAULT_PIXELATED_FORM_SUBMISSION_DOMAIN = 'thethreemusesofbluffton.com';
export const DEFAULT_PIXELATED_FORM_NAME = 'The Three Muses of Bluffton Order Form';

export interface PixelatedFormSubmissionQueryOptions {
	tableName?: string;
	domain: string;
	formName: string;
}

export interface PixelatedFormSubmissionReportRow {
	[key: string]: any;
}

const dynamoAttributeKeys = new Set(['S', 'N', 'BOOL', 'NULL', 'M', 'L', 'SS', 'NS', 'BS', 'B']);

export const PIXELATED_FORM_SUBMISSION_REPORT_FIELDS = [
	'created_at',
	'shipping_to',
	'registration_data',
	'items',
] as const;

function asArray(value: any) {
	return Array.isArray(value) ? value : [];
}

function selectObjectFields(source: Record<string, any>, fields: Array<string>) {
	return fields.reduce((result, field) => {
		if (source[field] !== undefined) {
			result[field] = source[field];
		}
		return result;
	}, {} as Record<string, any>);
}

function selectRegistrationData(source: Record<string, any>) {
	return selectObjectFields(source, [
		'child_name',
		'child_birthdate',
		'birthdate',
		'emergency_contact_name',
		'emergency_contact_telephone',
		'full_payment',
		'cancellation_policy',
		'photo_consent',
		'closed_toe_shoes',
		'class_materials',
		'minimum_students',
		'food_allergies',
		'bleeding_disorder',
		'injury_liability',
	]);
}

function selectShippingTo(source: Record<string, any>) {
	return selectObjectFields(source, ['name', 'street1', 'city', 'state', 'zip', 'country', 'phone', 'email']);
}

function selectItems(items: any) {
	const normalizeItem = (item: Record<string, any>) => ({
		id: item.id ?? item.itemID,
		title: item.title ?? item.itemTitle,
		quantity: item.quantity ?? item.itemQuantity,
		category: item.category ?? (Array.isArray(item.itemCategory) ? item.itemCategory.join(', ') : item.itemCategory),
	});

	if (Array.isArray(items)) {
		return items.map((item) => normalizeItem(item || {}));
	}

	if (items && typeof items === 'object') {
		return normalizeItem(items);
	}

	return [];
}

function toPlainValue(value: any): any {
	if (value === null || value === undefined) {
		return value;
	}

	if (Array.isArray(value)) {
		return value.map((item) => toPlainValue(item));
	}

	if (typeof value !== 'object') {
		return value;
	}

	const keys = Object.keys(value);
	if (keys.length > 0 && keys.every((key) => dynamoAttributeKeys.has(key))) {
		if ('S' in value) return value.S;
		if ('N' in value) return Number(value.N);
		if ('BOOL' in value) return Boolean(value.BOOL);
		if ('NULL' in value) return null;
		if ('M' in value) return Object.fromEntries(Object.entries(value.M || {}).map(([key, nestedValue]) => [key, toPlainValue(nestedValue)]));
		if ('L' in value) return (value.L || []).map((nestedValue: any) => toPlainValue(nestedValue));
		if ('SS' in value) return [...(value.SS || [])];
		if ('NS' in value) return (value.NS || []).map((entry: any) => Number(entry));
		if ('BS' in value) return [...(value.BS || [])];
		if ('B' in value) return value.B;
	}

	return Object.fromEntries(Object.entries(value).map(([key, nestedValue]) => [key, toPlainValue(nestedValue)]));
}

function parsePossibleJson(value: any) {
	if (typeof value !== 'string') {
		return value;
	}

	try {
		return JSON.parse(value);
	} catch {
		return value;
	}
}

function normalizeDynamoItem(item: Record<string, any>) {
	const normalized = Object.fromEntries(Object.entries(item || {}).map(([key, value]) => [key, toPlainValue(value)]));
	const orderData = parsePossibleJson(normalized.orderData ?? normalized.order_data ?? normalized.data ?? normalized.payload ?? normalized.submissionData);
	const reportSource = orderData && typeof orderData === 'object' ? orderData : {};
	const checkoutData = reportSource.checkoutData ?? reportSource;
	const payment = reportSource.captureResponse?.payment ?? reportSource.payment ?? {};
	const shippingTo = checkoutData.shippingTo ?? {};
	const registrationDataSource = shippingTo;
	const createdAt = payment.created_at ? new Date(payment.created_at).toLocaleString() : '';

	const row: PixelatedFormSubmissionReportRow = {
		created_at: createdAt,
		shipping_to: selectShippingTo(shippingTo),
		registration_data: selectRegistrationData(registrationDataSource),
		items: selectItems(checkoutData.items),
	};

	return row;
}

function getDynamoConfig() {
	const config = getFullPixelatedConfig();
	const aws = config.aws;
	if (!aws?.region) {
		throw new Error('AWS region is missing from pixelated.config.json.');
	}

	const clientConfig: Record<string, any> = {
		region: aws.region,
	};

	if (aws.access_key_id && aws.secret_access_key) {
		clientConfig.credentials = {
			accessKeyId: aws.access_key_id,
			secretAccessKey: aws.secret_access_key,
			sessionToken: aws.session_token,
		};
	}

	return clientConfig;
}

function createDynamoClient() {
	return new DynamoDBClient(getDynamoConfig());
}

export function buildPixelatedFormSubmissionReportRows(items: Array<Record<string, any>>) {
	return items.map((item) => normalizeDynamoItem(item));
}

export async function listPixelatedFormSubmissionReportRows(options: PixelatedFormSubmissionQueryOptions) {
	const client = createDynamoClient();
	const items: Array<Record<string, any>> = [];
	let exclusiveStartKey: Record<string, any> | undefined;

	do {
		const response = await client.send(new ScanCommand({
			TableName: options.tableName ?? DEFAULT_PIXELATED_FORM_SUBMISSIONS_TABLE,
			FilterExpression: '#domain = :domain AND #formName = :formName',
			ExpressionAttributeNames: {
				'#domain': 'domain',
				'#formName': 'formName',
			},
			ExpressionAttributeValues: {
				':domain': { S: options.domain },
				':formName': { S: options.formName },
			},
			ExclusiveStartKey: exclusiveStartKey,
		}));

		items.push(...((response.Items || []) as Array<Record<string, any>>));
		exclusiveStartKey = response.LastEvaluatedKey;
	} while (exclusiveStartKey);

	return buildPixelatedFormSubmissionReportRows(items);
}
