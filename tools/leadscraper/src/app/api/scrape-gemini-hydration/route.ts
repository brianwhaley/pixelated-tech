import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { buildUrl, getFullPixelatedConfig, smartFetch } from '@pixelated-tech/components/server';

const DEFAULT_FILE_NAME = 'companies-googleplaces-20260413.json';
const DEFAULT_START = 0;
const DEFAULT_BATCH_SIZE = 20;
const DEFAULT_MAX_CALLS = 0;
const GEMINI_MODEL = 'gemini-2.5-flash';
const DEBUG = false;  

function safeWriteSync(filePath: string, data: any) {
	const tmp = filePath + '.tmp';
	fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
	fs.renameSync(tmp, filePath);
}

function makeHydratedFileName(fileName: string): string {
	const extension = path.extname(fileName) || '.json';
	const baseName = path.basename(fileName, extension);
	return `${baseName}-hydrated${extension}`;
}

function extractJsonFromText(text: string): string {
	let trimmed = String(text).trim();
	if (trimmed.startsWith('```')) {
		trimmed = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
	}

	const startIndex = Math.min(
		...['{', '[']
			.map((char) => trimmed.indexOf(char))
			.filter((index) => index >= 0)
	);

	if (startIndex === Infinity) {
		throw new Error('No JSON object or array found in Gemini response');
	}

	const stack: string[] = [];
	let inString = false;
	let escaped = false;

	for (let i = startIndex; i < trimmed.length; i++) {
		const char = trimmed[i];

		if (escaped) {
			escaped = false;
			continue;
		}

		if (char === '\\') {
			escaped = true;
			continue;
		}

		if (char === '"') {
			inString = !inString;
			continue;
		}

		if (inString) {
			continue;
		}

		if (char === '{' || char === '[') {
			stack.push(char);
			continue;
		}

		if (char === '}' || char === ']') {
			const open = stack.pop();
			if (!open || (open === '{' && char !== '}') || (open === '[' && char !== ']')) {
				throw new Error('Mismatched JSON brackets in Gemini response');
			}
			if (stack.length === 0) {
				return trimmed.slice(startIndex, i + 1);
			}
		}
	}

	throw new Error('Unable to extract complete JSON from Gemini response');
}

function parseJsonFromText(text: string): any {
	return JSON.parse(extractJsonFromText(text));
}

function normalizeEmail(raw: string): string {
	return String(raw || '').trim().toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g, '');
}

function normalizeEmails(value: any): string[] {
	if (!value) return [];
	if (Array.isArray(value)) {
		return value.map(normalizeEmail).filter(Boolean);
	}
	return String(value)
		.split(/[;,|\n]+/)
		.map(normalizeEmail)
		.filter(Boolean);
}

function normalizePhone(value: any): string {
	if (!value) return '';
	return String(value).trim();
}

function buildAddressFromComponents(lead: any): string {
	const street = String(lead['address'] || lead.formattedAddress || lead['street address'] || lead['streetAddress'] || lead['street_address'] || '').trim();
	const city = String(lead.city || '').trim();
	const state = String(lead.state || '').trim();
	const zip = String(lead.zip || lead.postalCode || lead.postal_code || '').trim();

	const parts = [street, city, state, zip].filter(Boolean);
	return parts.join(', ');
}

function getLeadsArray(payload: any): any[] {
	if (Array.isArray(payload.leads)) {
		return payload.leads;
	}
	if (Array.isArray(payload.results)) {
		return payload.results;
	}
	return [];
}

interface GeminiBatchLead {
	index: number;
	company: string;
	address: string;
	website: string;
	emails: string[];
	phone: string;
}

function buildGeminiPrompt(leads: GeminiBatchLead[]): string {
	return `You are a data verifier. You are given a JSON array of lead records. Each record includes company, address, website, emails, and phone. Some website/emails/phone fields may be empty. For each record, verify the information and fill in only the website, emails, and phone fields if you can confirm them. Do not invent any information, and do not change the company or address fields. If you cannot verify a field, return an empty string or empty array. Return only valid JSON: the same array of lead objects in the same order.` +
		`\n\nInput:\n` + JSON.stringify(leads, null, 2);
}

async function requestGemini(prompt: string, apiKey: string) {
	const url = buildUrl({
		baseUrl: 'https://generativelanguage.googleapis.com',
		pathSegments: ['v1beta', 'models', `${GEMINI_MODEL}:generateContent`],
		params: { key: apiKey }
	});

	if (DEBUG) {
		console.log('[scrape-gemini-hydration] Gemini request URL:', url);
		console.log('[scrape-gemini-hydration] Gemini prompt:', prompt.replace(/\s+/g, ' ').slice(0, 500));
	}

	const response = await smartFetch(url, {
		responseType: 'json',
		retries: 0,
		timeout: 60000,
		debug: DEBUG,
		requestInit: {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				contents: [{ parts: [{ text: prompt }] }],
				generationConfig: {
					temperature: 0.0,
					maxOutputTokens: 16384, // Gemini 2.5 Flash	max supported tokens is 65,535 tokens
					topP: 0.6,
					topK: 40
				}
			})
		}
	});

	const raw = response.candidates?.[0]?.content?.parts?.[0]?.text;
	if (!raw) {
		throw new Error('Gemini returned no text content');
	}

	if (DEBUG) {
		console.log('[scrape-gemini-hydration] Gemini raw response:', String(raw).slice(0, 1000));
	}

	const parsed = parseJsonFromText(raw);
	if (Array.isArray(parsed)) {
		return parsed;
	}
	if (parsed && Array.isArray(parsed.results)) {
		return parsed.results;
	}
	if (parsed && Array.isArray(parsed.leads)) {
		return parsed.leads;
	}

	throw new Error('Gemini returned unexpected JSON format; expected an array.');
}

export async function GET(req: NextRequest) {
	const fileName = req.nextUrl.searchParams.get('file') || DEFAULT_FILE_NAME;
	const start = Number(req.nextUrl.searchParams.get('start') || String(DEFAULT_START));
	const batchSize = Number(req.nextUrl.searchParams.get('batchSize') || String(DEFAULT_BATCH_SIZE));
	const maxCalls = Number(req.nextUrl.searchParams.get('maxCalls') || String(DEFAULT_MAX_CALLS));
	const filePath = path.join(process.cwd(), 'public', fileName);
	const hydratedFileName = makeHydratedFileName(fileName);
	const hydratedFilePath = path.join(process.cwd(), 'public', hydratedFileName);

	if (!fs.existsSync(filePath)) {
		return NextResponse.json({ error: 'File not found', file: filePath }, { status: 400 });
	}

	const config = getFullPixelatedConfig();
	const apiKey = config?.googleGemini?.api_key || config?.google?.api_key;
	if (!apiKey) {
		return NextResponse.json({ error: 'Google Gemini API key not configured' }, { status: 500 });
	}

	let hydratedPayload: any = { sourceFile: fileName, file: hydratedFileName, processed: [] };
	if (fs.existsSync(hydratedFilePath)) {
		try {
			hydratedPayload = JSON.parse(fs.readFileSync(hydratedFilePath, 'utf8'));
		} catch (err) {
			return NextResponse.json({ error: 'Failed to parse existing hydrated file', details: String(err), file: hydratedFilePath }, { status: 500 });
		}
	}

	let payload: any;
	try {
		payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
	} catch (err) {
		return NextResponse.json({ error: 'Failed to parse JSON file', details: String(err) }, { status: 500 });
	}

	const leads = getLeadsArray(payload);
	if (!Array.isArray(leads) || leads.length === 0) {
		return NextResponse.json({ error: 'Input JSON does not contain a leads or results array' }, { status: 400 });
	}

	const processed: Array<{ index: number; company: string; website: string; emails: string[]; phone: string; error?: string; }> = [];

	console.log('[scrape-gemini-hydration] starting full-run from', start, 'batchSize=', batchSize, 'maxCalls=', maxCalls, 'leadsLength=', leads.length, 'file=', fileName);

	const runStart = Date.now();
	let updatedCount = 0;
	let failedCount = 0;
	let callsMade = 0;
	let batchIndex = 0;
	let current = Math.max(0, start);

	while (current < leads.length) {
		const batchEnd = Math.min(leads.length, current + batchSize);
		batchIndex++;
		
		console.log('[scrape-gemini-hydration] processing batch', batchIndex, 'start =', current, 'end =', batchEnd, 'callsMade =', callsMade);
		
		const batchLeads: GeminiBatchLead[] = [];
		for (let idx = current; idx < batchEnd; idx++) {
			const lead = leads[idx];
			if (!lead || typeof lead !== 'object') continue;

			const company = String(
				lead.name ||
				lead.company ||
				lead?.displayName?.text ||
				lead['displayName']?.text ||
				''
			).trim();
			const address = buildAddressFromComponents(lead);

			batchLeads.push({
				index: idx,
				company,
				address,
				website: String(lead.website || ''),
				emails: normalizeEmails(lead.emails),
				phone: normalizePhone(lead.phone)
			});
		}

		if (batchLeads.length === 0) {
			current = batchEnd;
			continue;
		}

		if (maxCalls > 0 && callsMade >= maxCalls) {
			if (DEBUG) {
				console.log('[scrape-gemini-hydration] maxCalls reached', callsMade, 'maxCalls=', maxCalls);
			}
			break;
		}

		let prompt: string;
		try {
			prompt = buildGeminiPrompt(batchLeads);
			callsMade++;
			const results = await requestGemini(prompt, apiKey);

			if (!Array.isArray(results)) {
				throw new Error('Gemini batch response was not an array');
			}
			if (results.length !== batchLeads.length) {
				throw new Error(`Gemini returned ${results.length} results for ${batchLeads.length} leads`);
			}

			const hydratedEntries: Array<any> = [];
			for (let i = 0; i < results.length; i++) {
				const result = results[i] as any;
				const original = batchLeads[i];
				const idx = typeof result.index === 'number' ? result.index : original.index;
				const company = original.company;

				const website = typeof result.website === 'string' ? result.website.trim() : '';
				const emails = normalizeEmails(result.emails);
				const phone = normalizePhone(result.phone);

				const lead = leads[idx];
				const mergedWebsite = website || String(lead?.website || original.website || '').trim();
				const mergedEmails = emails.length ? emails : normalizeEmails(lead?.emails || original.emails);
				const mergedPhone = phone || normalizePhone(lead?.phone || original.phone);

				const hydratedLead = {
					index: idx,
					...((lead && typeof lead === 'object') ? lead : original),
					website: mergedWebsite,
					emails: mergedEmails,
					phone: mergedPhone
				};

				if (lead && typeof lead === 'object') {
					lead.website = mergedWebsite;
					lead.emails = mergedEmails;
					lead.phone = mergedPhone;
				}

				const changed = Boolean(website || emails.length || phone);
				if (changed) updatedCount++;
				processed.push({
					index: idx,
					company,
					website: mergedWebsite,
					emails: mergedEmails,
					phone: mergedPhone
				});

				hydratedEntries.push(hydratedLead);
			}

			const existingByIndex = new Map<number, any>();
			if (Array.isArray(hydratedPayload.processed)) {
				hydratedPayload.processed.forEach((entry: any) => {
					if (typeof entry.index === 'number') {
						existingByIndex.set(entry.index, entry);
					}
				});
			}
			for (const entry of hydratedEntries) {
				existingByIndex.set(entry.index, entry);
			}
			hydratedPayload.processed = Array.from(existingByIndex.values()).sort((a, b) => a.index - b.index);
			hydratedPayload.file = hydratedFileName;
			hydratedPayload.sourceFile = fileName;
			hydratedPayload.updatedAt = new Date().toISOString();
			safeWriteSync(hydratedFilePath, hydratedPayload);
			if (DEBUG) {
				console.log('[scrape-gemini-hydration] hydrated batch saved', {
					batch: batchIndex,
					nextStart: batchEnd,
					hydratedFilePath
				});
			}
		} catch (error: unknown) {
			failedCount += batchLeads.length;
			const errMessage = error instanceof Error ? error.message : String(error);
			if (DEBUG) console.error('[scrape-gemini-hydration] error for batch', current, batchEnd, errMessage);
			for (const original of batchLeads) {
				processed.push({
					index: original.index,
					company: original.company,
					website: original.website,
					emails: original.emails,
					phone: original.phone,
					error: errMessage
				});
			}
		}

		if (maxCalls > 0 && callsMade >= maxCalls) {
			current = batchEnd;
			if (DEBUG) console.log('[scrape-gemini-hydration] ending run early because maxCalls limit reached');
			break;
		}

		current = batchEnd;
	}

	const durationMs = Date.now() - runStart;
	
	console.log('[scrape-gemini-hydration] finished full-run', { start, leadsLength: leads.length, totalProcessed: processed.length, updatedCount, failedCount, durationMs, batchCount: batchIndex, callsMade, maxCalls });

	return NextResponse.json({
		file: fileName,
		start,
		batchSize,
		maxCalls,
		callsMade,
		totalLeads: leads.length,
		totalProcessed: processed.length,
		updatedCount,
		failedCount,
		completed: current >= leads.length,
		nextStart: current >= leads.length ? null : current,
		durationMs,
		batchCount: batchIndex,
		processed
	});
}
