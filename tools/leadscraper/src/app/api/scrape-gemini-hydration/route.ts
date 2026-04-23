import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { buildUrl, getDomain, getFullPixelatedConfig, smartFetch } from '@pixelated-tech/components/server';

const DEFAULT_FILE_NAME = 'companies-googleplaces-20260413.json';
const DEFAULT_START = 0;
const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_MAX_CALLS = 0;
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_MAXOUTPUTTOKENS = 32768; // Gemini 2.5 Flash max supported tokens is 65,535 tokens
const fetchTimeoutMs = 	120000; // 2 mins timeout, max localhost to gemini api can be 5 mins

const debug = false;

function safeWriteSync(filePath: string, data: any) {
	const tmp = filePath + '.tmp';
	fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
	fs.renameSync(tmp, filePath);
}

function makeHydratedFileName(fileName: string): string {
	const extension = path.extname(fileName) || '.json';
	const baseName = path.basename(fileName, extension);
	const dateSuffix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
	return `${baseName}-${dateSuffix}-hydrated${extension}`;
}

function extractJsonFromText(text: string): string {
	let trimmed = String(text).trim();
	if (trimmed.startsWith('```')) {
		trimmed = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
	}

	const candidateStarts = [] as number[];
	for (let i = 0; i < trimmed.length; i++) {
		if (trimmed[i] === '{' || trimmed[i] === '[') {
			candidateStarts.push(i);
		}
	}

	if (!candidateStarts.length) {
		throw new Error('No JSON object or array found in Gemini response');
	}

	for (const startIndex of candidateStarts) {
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
					break;
				}
				if (stack.length === 0) {
					const candidate = trimmed.slice(startIndex, i + 1);
					try {
						JSON.parse(candidate);
						return candidate;
					} catch {
						break;
					}
				}
			}
		}
	}

	throw new Error('Unable to extract valid JSON from Gemini response');
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
	website: string | string[];
	emails: string[];
	phone: string;
	'full name'?: string;
	'first name'?: string;
	'last name'?: string;
}

function websiteToArray(value: any): string[] {
	if (Array.isArray(value)) {
		return value.map((v) => String(v || '').trim()).filter(Boolean);
	}
	if (value == null) {
		return [];
	}
	return String(value)
		.split(/[\n,|]+/)
		.map((v) => v.trim())
		.filter(Boolean);
}

function normalizeWebsiteValue(value: any): string | string[] {
	const arr = websiteToArray(value);
	if (arr.length === 0) return '';
	if (arr.length === 1) return arr[0];
	return arr;
}

function mergeWebsiteValues(original: any, incoming: any): string | string[] {
	const originalArr = websiteToArray(original);
	const incomingArr = websiteToArray(incoming);
	if (incomingArr.length === 0) {
		return originalArr.length === 1 ? originalArr[0] : originalArr;
	}
	if (originalArr.length === 0) {
		return incomingArr.length === 1 ? incomingArr[0] : incomingArr;
	}
	const combined = Array.from(new Set([...originalArr, ...incomingArr]));
	if (combined.length === 1) return combined[0];
	const originalDomain = getDomain(originalArr[0]);
	const incomingDomain = getDomain(incomingArr[0]);
	if (originalArr.length === 1 && incomingArr.length === 1 && originalDomain && incomingDomain && originalDomain === incomingDomain) {
		return originalArr[0];
	}
	return combined;
}

function normalizeAddressValue(value: any, originalAddress: string): string {
	if (!value) return originalAddress;
	if (typeof value === 'string') {
		return value.trim() || originalAddress;
	}
	if (typeof value === 'object') {
		const parts = [
			value.address,
			value['street address'],
			value.streetAddress,
			value['street_address'],
			value.city,
			value.state,
			value.zip,
			value.postalCode,
			value.postal_code
		]
			.map((v) => String(v || '').trim())
			.filter(Boolean);
		return parts.join(', ') || originalAddress;
	}
	return originalAddress;
}

function buildGeminiPrompt(leads: GeminiBatchLead[]): string {
	return `You are a data verifier. You are given a JSON array of lead records. Each record includes company, address, website, emails, phone, and optionally full name, first name, and last name. Some fields may be empty. For each record, verify the information and fill in only the website, emails, phone, and address fields if you can confirm them. If the address is blank or only partial, return the best available address information. If a person name is provided, return any emails associated with that person, company, or address; more emails are better. If the original website field is empty, return what you can find. If the returned website is the same domain as the original, keep the original value. If a different valid domain is found, include both values. The website field may be a string or an array of strings. Do not invent any information. Return only valid JSON: the same array of lead objects in the same order.` +
		`\n\nInput:\n` + JSON.stringify(leads, null, 2);
}

async function requestGemini(prompt: string, apiKey: string) {
	const url = buildUrl({
		baseUrl: 'https://generativelanguage.googleapis.com',
		pathSegments: ['v1beta', 'models', `${GEMINI_MODEL}:generateContent`],
		params: { key: apiKey }
	});

	if (debug) {
		// console.log('[scrape-gemini-hydration] Gemini request URL:', url);
		// console.log('[scrape-gemini-hydration] Gemini prompt:', prompt.replace(/\s+/g, ' ').slice(0, 500));
	}

	const requestStart = Date.now();
	let response;
	try {
		response = await smartFetch(url, {
			responseType: 'json',
			retries: 0,
			timeout: fetchTimeoutMs,
			debug: false,
			requestInit: {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					contents: [{ parts: [{ text: prompt }] }],
					generationConfig: {
						temperature: 0.0,
						maxOutputTokens: GEMINI_MAXOUTPUTTOKENS, // Gemini 2.5 Flash	max supported tokens is 65,535 tokens
						topP: 0.6,
						topK: 40
					}
				})
			}
		});
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		const errorStack = error instanceof Error ? error.stack : undefined;
		console.error('[scrape-gemini-hydration] smartFetch error', {
			error: errorMessage,
			stack: errorStack
		});
		throw error;
	}

	const durationMs = Date.now() - requestStart;

	if (debug) {
		console.log('[scrape-gemini-hydration] Gemini usageMetadata totalTokenCount:', (response as any)?.usageMetadata?.totalTokenCount, ' maxOutputTokens=', GEMINI_MAXOUTPUTTOKENS);
		console.log('[scrape-gemini-hydration] Gemini candidate finishReason:', (response as any)?.candidates?.[0]?.finishReason);
		console.log('[scrape-gemini-hydration] Gemini request durationMs:', durationMs, ' maxTimeout=', fetchTimeoutMs);
	}

	const raw = response.candidates?.[0]?.content?.parts?.[0]?.text;
	if (!raw) {
		if (debug) {
			console.log('[scrape-gemini-hydration] Gemini response had no text content', {
				responseSummary: {
					candidates: Array.isArray(response.candidates) ? response.candidates.length : 0
				}
			});
		}
		return [];
	}

	if (debug) {
		// console.log('[scrape-gemini-hydration] Gemini raw response:', String(raw).slice(0, 1000));
	}

	let parsed;
	try {
		parsed = parseJsonFromText(raw);
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		const errorStack = error instanceof Error ? error.stack : undefined;
		console.error('[scrape-gemini-hydration] failed to parse Gemini JSON response', {
			error: errorMessage,
			stack: errorStack,
			raw: String(raw).slice(0, 2000),
			candidateCount: Array.isArray(response.candidates) ? response.candidates.length : 0
		});
		throw error;
	}

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
	const filePath = path.join(process.cwd(), 'public', 'data', fileName);
	const hydratedFileName = makeHydratedFileName(fileName);
	const hydratedFilePath = path.join(process.cwd(), 'public', 'data', hydratedFileName);

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

	const processed: Array<{ index: number; company: string; website: string | string[]; emails: string[]; phone: string; address?: string; error?: string; }> = [];

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
		
		console.log('[scrape-gemini-hydration] processing batch', batchIndex, 'start =', current, 'end =', batchEnd, 'callsMade =', callsMade, 'failedCount =', failedCount);
		
		const batchLeads: GeminiBatchLead[] = [];
		for (let idx = current; idx < batchEnd; idx++) {
			const lead = leads[idx];
			if (!lead || typeof lead !== 'object') continue;

			const company = String(
				lead.company ||
				lead?.displayName?.text ||
				lead['displayName']?.text ||
				''
			).trim();
			const address = buildAddressFromComponents(lead);
			const fullName = String(lead['full name'] || '').trim();
			const firstName = String(lead['first name'] || '').trim();
			const lastName = String(lead['last name'] || '').trim();

			batchLeads.push({
				index: idx,
				company,
				address,
				website: normalizeWebsiteValue(lead.website),
				emails: normalizeEmails(lead.emails),
				phone: normalizePhone(lead.phone),
				...(fullName ? { 'full name': fullName } : {}),
				...(firstName ? { 'first name': firstName } : {}),
				...(lastName ? { 'last name': lastName } : {})
			});
		}

		if (batchLeads.length === 0) {
			current = batchEnd;
			continue;
		}

		if (maxCalls > 0 && callsMade >= maxCalls) {
			if (debug) {
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
			if (results.length === 0) {
				if (debug) {
					console.log('[scrape-gemini-hydration] Gemini returned 0 results for batch', batchIndex, 'start=', current, 'end=', batchEnd);
				}
			} else if (debug && results.length !== batchLeads.length) {
				console.log('[scrape-gemini-hydration] Gemini returned unexpected result count', {
					batchIndex,
					expected: batchLeads.length,
					actual: results.length
				});
			}

			const hydratedEntries: Array<any> = [];
			const resultsByIndex = new Map<number, any[]>();
			const extraResults: any[] = [];

			for (let i = 0; i < results.length; i++) {
				const result = results[i] as any;
				let targetIndex: number | undefined = typeof result.index === 'number' ? result.index : undefined;

				if (targetIndex === undefined && typeof result.company === 'string') {
					const normalizedCompany = result.company.trim().toLowerCase();
					const match = batchLeads.find((lead) => lead.company.trim().toLowerCase() === normalizedCompany);
					if (match) {
						targetIndex = match.index;
					}
				}

				if (targetIndex === undefined && i < batchLeads.length) {
					targetIndex = batchLeads[i].index;
				}

				if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex < leads.length) {
					const entryList = resultsByIndex.get(targetIndex) ?? [];
					entryList.push(result);
					resultsByIndex.set(targetIndex, entryList);
				} else {
					extraResults.push(result);
				}
			}

			for (const original of batchLeads) {
				const matchingResults = resultsByIndex.get(original.index) ?? [];
				if (matchingResults.length === 0) {
					hydratedEntries.push({
						index: original.index,
						company: original.company,
						website: original.website,
						emails: original.emails,
						phone: original.phone,
						address: original.address
					});
					continue;
				}

				for (const result of matchingResults) {
					const idx = typeof result.index === 'number' ? result.index : original.index;
					const lead = typeof idx === 'number' && idx >= 0 && idx < leads.length ? leads[idx] : original;
					const incomingWebsite = normalizeWebsiteValue(result.website);
					const emails = normalizeEmails(result.emails);
					const phone = normalizePhone(result.phone);
					const address = normalizeAddressValue(result.address, String(lead?.address || original.address || ''));
					const mergedWebsite = mergeWebsiteValues(lead?.website ?? original.website, incomingWebsite);
					const mergedEmails = Array.from(new Set([...(normalizeEmails(lead?.emails || original.emails) || []), ...emails]));
					const mergedPhone = phone || normalizePhone(lead?.phone || original.phone);

					const hydratedLead = {
						index: idx,
						...((lead && typeof lead === 'object') ? lead : original),
						website: mergedWebsite,
						emails: mergedEmails,
						phone: mergedPhone,
						address
					};

					if (lead && typeof lead === 'object' && typeof idx === 'number' && idx >= 0 && idx < leads.length) {
						lead.website = mergedWebsite;
						lead.emails = mergedEmails;
						lead.phone = mergedPhone;
						lead.address = address;
					}

					hydratedEntries.push(hydratedLead);
				}
			}

			for (const result of extraResults) {
				const company = String(result.company || '').trim();
				const incomingWebsite = normalizeWebsiteValue(result.website);
				const emails = normalizeEmails(result.emails);
				const phone = normalizePhone(result.phone);
				const address = normalizeAddressValue(result.address, '');
				hydratedEntries.push({
					index: typeof result.index === 'number' ? result.index : -1,
					company,
					website: incomingWebsite,
					emails,
					phone,
					address
				});
			}

			for (const hydratedLead of hydratedEntries) {
				const company = String(hydratedLead.company || '').trim();
				const website = hydratedLead.website;
				const emails = Array.isArray(hydratedLead.emails) ? hydratedLead.emails : normalizeEmails(hydratedLead.emails);
				const phone = normalizePhone(hydratedLead.phone);
				const address = String(hydratedLead.address || '').trim();

				const changed = Boolean(
					(Array.isArray(emails) ? emails.length : 0) ||
					(website && website !== '') ||
					phone
				);
				if (changed) updatedCount++;
				processed.push({
					index: typeof hydratedLead.index === 'number' ? hydratedLead.index : -1,
					company,
					website,
					emails,
					phone,
					address
				});
			}

			const existingByIndex = new Map<number, any[]>();
			const existingExtras: any[] = [];
			if (Array.isArray(hydratedPayload.processed)) {
				hydratedPayload.processed.forEach((entry: any) => {
					if (typeof entry.index === 'number') {
						const list = existingByIndex.get(entry.index) ?? [];
						list.push(entry);
						existingByIndex.set(entry.index, list);
					} else {
						existingExtras.push(entry);
					}
				});
			}
			for (const entry of hydratedEntries) {
				if (typeof entry.index === 'number') {
					const list = existingByIndex.get(entry.index) ?? [];
					list.push(entry);
					existingByIndex.set(entry.index, list);
				} else {
					existingExtras.push(entry);
				}
			}
			hydratedPayload.processed = [
				...Array.from(existingByIndex.values()).flatMap((entries) => entries),
				...existingExtras
			].sort((a, b) => (typeof a.index === 'number' ? a.index : 0) - (typeof b.index === 'number' ? b.index : 0));
			hydratedPayload.file = hydratedFileName;
			hydratedPayload.sourceFile = fileName;
			hydratedPayload.updatedAt = new Date().toISOString();
			safeWriteSync(hydratedFilePath, hydratedPayload);
			if (debug) {
				console.log('[scrape-gemini-hydration] hydrated batch saved', {
					batch: batchIndex,
					nextStart: batchEnd,
					failedCount,
					hydratedFilePath
				});
			}
		} catch (error: unknown) {
			failedCount += batchLeads.length;
			const errMessage = error instanceof Error ? error.message : String(error);
			console.error('[scrape-gemini-hydration] batch error', {
				batch: batchIndex,
				start: current,
				end: batchEnd,
				failedCount,
				error: errMessage
			});
			console.error('[scrape-gemini-hydration] batch error stack', error instanceof Error ? error.stack : undefined);
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
			if (debug) console.log('[scrape-gemini-hydration] ending run early because maxCalls limit reached');
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
