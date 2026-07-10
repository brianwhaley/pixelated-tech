import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { getFullPixelatedConfig } from '../config/config';

export const DEFAULT_PIXELATED_FORM_SUBMISSIONS_TABLE = 'PixelatedFormSubmissionsTable';

export interface PixelatedFormSubmissionQueryOptions {
	tableName?: string;
	domain?: string;
	formName?: string;
}

export interface PixelatedFormSubmissionReportRow {
	[key: string]: any;
}

const dynamoAttributeKeys = new Set(['S', 'N', 'BOOL', 'NULL', 'M', 'L', 'SS', 'NS', 'BS', 'B']);


function toPlainValue(value: any): any {
	if (value === null || value === undefined) { return value; }
	if (Array.isArray(value)) { return value.map((item) => toPlainValue(item)); }
	if (typeof value !== 'object') { return value; }
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

function normalizeDynamoItem(item: Record<string, any>) {
	const normalized = Object.fromEntries(Object.entries(item || {}).map(([key, value]) => [key, toPlainValue(value)]));
	const orderDataValue = normalized.orderData ?? normalized.order_data ?? normalized.data ?? normalized.payload ?? normalized.submissionData;
	const orderData = (() => {
		if (typeof orderDataValue !== 'string') { return orderDataValue; }
		try {
			return JSON.parse(orderDataValue);
		} catch {
			return orderDataValue;
		}
	})();
	const reportSource = orderData && typeof orderData === 'object' ? orderData : {};
	const checkoutData = reportSource.checkoutData ?? reportSource;
	const payment = reportSource.captureResponse?.payment ?? reportSource.payment ?? {};
	const shippingTo = checkoutData.shippingTo ?? {};
	const createdAtValue = normalized.timestamp ?? '';
	const createdAt = (() => {
		if (createdAtValue === undefined || createdAtValue === null || createdAtValue === '') {
			return '';
		}
		const raw = String(createdAtValue).trim();
		const parsed = new Date(raw);
		return Number.isNaN(parsed.getTime()) ? raw : parsed.toISOString();
	})();
	const contactEmail =
		normalized.email || normalized.from || normalized.to ||
		reportSource.email || reportSource.from || reportSource.to ||
		checkoutData.email || checkoutData.from || checkoutData.to ||
		'';

	const shippingToData = (() => {
		const source = shippingTo as Record<string, any>;
		const fields = ['name', 'street1', 'city', 'state', 'zip', 'country', 'phone', 'email'];
		const base = fields.reduce((result, field) => {
			if (source[field] !== undefined) {
				result[field] = source[field];
			}
			return result;
		}, {} as Record<string, any>);
		if (!base.email && contactEmail) {
			base.email = contactEmail;
		}
		return base;
	})();
	const registrationData = (() => {
		const source = shippingTo as Record<string, any>;
		const fields = [
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
		];
		return fields.reduce((result, field) => {
			if (source[field] !== undefined) {
				result[field] = source[field];
			}
			return result;
		}, {} as Record<string, any>);
	})();
	const itemsData = (() => {
		const normalizeItem = (item: Record<string, any>) => ({
			itemID: item.itemID ?? item.id ?? item.sku ?? item.itemSKU ?? '',
			itemTitle: item.itemTitle ?? item.title ?? '',
			itemQuantity: item.itemQuantity ?? item.quantity ?? 0,
			itemSKU: item.itemSKU ?? item.sku ?? undefined,
			itemCategory: item.itemCategory ?? item.category ?? undefined,
		});
		const items = checkoutData.items;
		if (Array.isArray(items)) {
			return items.map((item) => normalizeItem(item || {}));
		}
		if (items && typeof items === 'object') {
			return normalizeItem(items as Record<string, any>);
		}
		return [];
	})();
	if (!registrationData.email && contactEmail) {
		registrationData.email = contactEmail;
	}

	const row: PixelatedFormSubmissionReportRow = {
		created_at: createdAt,
		domain: normalized.domain || checkoutData.domain || reportSource.domain || '',
		formName: normalized.formName || reportSource.formName || reportSource.form_name || checkoutData.formName || checkoutData.form_name || normalized.form_name || '',
		shipping_to: shippingToData,
		registration_data: registrationData,
		items: itemsData,
	};
	return row;
}


function getDynamoConfig() {
	const config = getFullPixelatedConfig();
	const aws = config?.integrations?.aws;
	if (!aws?.region) {
		throw new Error('AWS region is missing from pixelated.config.json.');
	}
	const clientConfig: Record<string, any> = { region: aws.region };
	if (aws.access_key_id && aws.secret_access_key) {
		clientConfig.credentials = {
			accessKeyId: aws.access_key_id,
			secretAccessKey: aws.secret_access_key,
			sessionToken: aws.session_token,
		};
	}
	return clientConfig;
}

export async function listPixelatedFormSubmissionReportRows(options: PixelatedFormSubmissionQueryOptions) {
	const client = new DynamoDBClient(getDynamoConfig());
	const items: Array<Record<string, any>> = [];
	let exclusiveStartKey: Record<string, any> | undefined;
	do {
		const response = await client.send(new ScanCommand({
			TableName: options.tableName ?? DEFAULT_PIXELATED_FORM_SUBMISSIONS_TABLE,
			ExclusiveStartKey: exclusiveStartKey,
		}));
		items.push(...((response.Items || []) as Array<Record<string, any>>));
		exclusiveStartKey = response.LastEvaluatedKey;
	} while (exclusiveStartKey);

	const normalizedRows = items.map((item) => normalizeDynamoItem(item));
	return normalizedRows.filter((row) => {
		if (options.domain && String(row.domain || '').trim() !== String(options.domain || '').trim()) {
			return false;
		}
		if (options.formName && String(row.formName || '').trim() !== String(options.formName || '').trim()) {
			return false;
		}
		return true;
	});
}
