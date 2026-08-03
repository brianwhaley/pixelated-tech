import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { getFullPixelatedConfig } from '../config/config';

export const DEFAULT_PIXELATED_FORM_SUBMISSIONS_TABLE = 'PixelatedFormSubmissionsTable';

export interface PixelatedFormSubmissionQueryOptions {
	tableName?: string;
	domain?: string;
	formName?: string;
	submissionId?: string;
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

function parsePossibleJson(value: any): any {
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
	const orderDataValue = normalized.orderData ?? normalized.order_data ?? normalized.data ?? normalized.payload ?? normalized.submissionData;
	const orderData = parsePossibleJson(orderDataValue);
	const reportSource = orderData && typeof orderData === 'object' ? orderData : {};
	const checkoutData = reportSource.checkoutData && typeof reportSource.checkoutData === 'object'
		? reportSource.checkoutData
		: reportSource;
	const timestampValue = normalized.timestamp;
	const rawTimestamp = timestampValue === undefined || timestampValue === null || timestampValue === ''
		? ''
		: String(timestampValue).trim();
	const parsedTimestamp = new Date(rawTimestamp);
	const timestamp = rawTimestamp && !Number.isNaN(parsedTimestamp.getTime())
		? parsedTimestamp.toISOString()
		: rawTimestamp;
	const row: PixelatedFormSubmissionReportRow = {
		...normalized,
		orderData,
		domain: normalized.domain || reportSource.domain || checkoutData.domain || '',
		formName: normalized.formName || normalized.form_name || reportSource.formName || reportSource.form_name || checkoutData.formName || checkoutData.form_name || '',
		submissionId: normalized.submissionId || normalized.submission_id || reportSource.submissionId || reportSource.submission_id || checkoutData.submissionId || checkoutData.submission_id || '',
		timestamp,
		created_at: timestamp,
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
		if (options.submissionId && String(row.submissionId || '').trim() !== String(options.submissionId || '').trim()) {
			return false;
		}
		return true;
	});
}
