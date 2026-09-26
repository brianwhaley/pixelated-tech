import { putDynamoStringItem, DEFAULT_PIXELATED_FORM_SUBMISSIONS_TABLE } from '../../integrations/aws.dynamo.integration';
import { sendSmtpMail } from '../../integrations/smtp.integration';
import { getSitesConfigDomains, loadSitesConfig } from '../../admin/sites/sites.integration';

const HONEYPOT_FIELDS = ['winnie', 'pooh', 'website'];
const DEFAULT_FORM_SENDER = 'brian@pixelated.tech';

export interface ProcessFormSubmissionOptions {
	allowedDomains: string[];
	tableName?: string;
	sender?: string;
	now?: Date;
	submissionId?: string;
}

export interface ProcessFormSubmissionResult {
	success: boolean;
	ignored?: boolean;
	submissionId?: string;
	errorCode?: 'invalid-payload' | 'invalid-domain';
}

export async function processFormSubmissionRequest(request: Request): Promise<Response> {
	let origin = request.headers.get('origin');
	const headers = new Headers({
		'Access-Control-Allow-Methods': 'POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type',
		Vary: 'Origin',
	});
	if (origin) headers.set('Access-Control-Allow-Origin', origin);

	try {
		const sites = await loadSitesConfig();

		const allowedDomains = getSitesConfigDomains(sites);
		const allowedOrigins = new Set(
			sites.flatMap((site) => {
				const origins: string[] = [];
				try {
					if (site.url) origins.push(new URL(site.url).origin);
				} catch {
					// Ignore malformed site URLs; domain validation remains authoritative.
				}
				const port = String(site.localPort ?? '').trim();
				if (port) origins.push(...[
					`http://localhost:${port}`,
					`https://localhost:${port}`,
					`http://127.0.0.1:${port}`,
					`https://127.0.0.1:${port}`,
				]);
				return origins;
			}),
		);
		if (origin && !allowedOrigins.has(origin)) {
			return Response.json({ success: false, message: 'Origin is not allowed.' }, { status: 403, headers });
		}

		if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });

		const body = await request.json();
		if (!body || Array.isArray(body) || typeof body !== 'object') {
			return Response.json({ success: false, message: 'Invalid submission.' }, { status: 400, headers });
		}

		const result = await processFormSubmission(body as Record<string, unknown>, { allowedDomains });
		if (!result.success) {
			return Response.json({ success: false, message: 'Invalid submission.' }, { status: 400, headers });
		}

		return Response.json({ success: true }, { status: 200, headers });
	} catch (error) {
		console.error('Form submission processing error:', error);
		return Response.json({ success: false, message: 'Unable to process submission.' }, { status: 500, headers });
	}
}

export async function processFormSubmission(
	payload: Record<string, unknown>,
	options: ProcessFormSubmissionOptions,
): Promise<ProcessFormSubmissionResult> {
	let domain = String(payload.domain ?? '').trim().toLowerCase();
	if (domain) {
		try {
			domain = new URL(domain.includes('://') ? domain : `https://${domain}`).hostname.replace(/^www\./, '');
		} catch {
			domain = '';
		}
	}
	const allowedDomains = new Set(options.allowedDomains);
	if (!domain || !allowedDomains.has(domain)) {
		return { success: false, errorCode: 'invalid-domain' };
	}

	if (HONEYPOT_FIELDS.some((field) => String(payload[field] ?? '').trim())) {
		return { success: true, ignored: true };
	}

	const to = String(payload.to ?? '').trim();
	if (!to) {
		return { success: false, errorCode: 'invalid-payload' };
	}

	const now = options.now ?? new Date();
	const submissionId = options.submissionId ?? crypto.randomUUID();
	const timestamp = now.toISOString();
	const sender = options.sender ?? DEFAULT_FORM_SENDER;
	const item: Record<string, string> = Object.fromEntries(
		Object.entries(payload).map(([key, value]) => {
			if (value === null || value === undefined) return [key, ''];
			if (typeof value === 'string') return [key, value];
			if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return [key, String(value)];

			try {
				return [key, JSON.stringify(value)];
			} catch {
				return [key, String(value)];
			}
		}),
	);
	item.from = sender;
	item.Date = now.toLocaleDateString();
	item.Status = 'Submitted';
	item.timestamp = timestamp;
	item.submissionId = submissionId;

	await putDynamoStringItem(options.tableName ?? DEFAULT_PIXELATED_FORM_SUBMISSIONS_TABLE, item);
	await sendSmtpMail({
		from: sender,
		to,
		subject: String(payload.subject ?? 'Website form submission'),
		text: Object.entries(item).map(([key, value]) => `${key}: ${value}`).join('\n'),
	});

	return { success: true, submissionId };
}