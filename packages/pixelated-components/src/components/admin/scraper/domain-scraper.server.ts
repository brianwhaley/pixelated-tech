"use server";

import type { Browser, Page } from "puppeteer";
import { getFullPixelatedConfig } from "../../config/config";
import type { DomainScraperCategoryRule, DomainScraperLoginConfig } from "../../config/config.types";
import { smartFetch } from "../../foundation/smartfetch";
import { closePuppeteerBrowser, launchPuppeteerBrowser, openPuppeteerPage } from "../../integrations/puppeteer.server";
import { extractMemberId, extractPeopleFromDocument, parseFullName, type ScopedPerson } from "./domain-scraper.functions";
import {
	appendPeopleToExtractFile,
	createDomainExtractFileName,
	createDomainExtractFileNameFromDiscoveryFile,
	hasDomainExtractFile,
	initializePeopleExtractFile,
	listDomainDiscoveryFiles,
	readDomainDiscoveryCheckpoint,
	readExtractedSourceUrls,
	readPeopleFromExtractFile,
	writeDomainDiscoveryCheckpoint,
	type DomainDiscoveryCheckpoint,
	type DomainDiscoveryCheckpointEntry,
	type DomainMenuPaginationCheckpoint,
	type DomainDiscoveryRun
} from "./domain-extract-writer.server";
import { PERSON_FIELD_PATTERNS, PERSON_FIELD_SELECTORS, type PersonSelectorValues, type PersonType } from "./person.functions";

const debug = false;
const NAVIGATION_TIMEOUT_MS = 60_000;
const DETAIL_SELECTOR_TIMEOUT_MS = 30_000;

const formatElapsed = (milliseconds: number): string => `${(milliseconds / 1000).toFixed(1)}s`;

export type DomainScrapeResult = {
	startUrl: string;
	pagesCrawled: number;
	records: PersonType[];
	logs: string[];
	error?: string;
};

export async function listAvailableDomainDiscoveryRuns(): Promise<DomainDiscoveryRun[]> {
	return listDomainDiscoveryFiles();
}

export type CrawlEntry = {
	url: string;
	depth: number;
	isDetail: boolean;
	status: "discovered" | "fetching" | "fetched" | "failed" | "extracted";
};

type LinkDiscovery = {
	links: string[];
	detailLinks: string[];
	skippedExternal: number;
	skippedExcluded: number;
	skippedInvalid: number;
	aliasHostLinks: number;
	rejectedHostnames: string[];
};

const DEFAULT_EXCLUDED_PATH_PATTERNS = [
	/\/(?:sign[-_]?(?:out|off))(?:\/|$)/i,
	/\/(?:log[-_]?(?:out|off))(?:\/|$)/i
];

function normalizeUrl(value: string): URL | null {
	try {
		const url = new URL(value);
		if (url.protocol !== "http:" && url.protocol !== "https:") return null;
		url.hash = "";
		return url;
	} catch {
		return null;
	}
}

function comparableHostname(hostname: string): string {
	return hostname.toLowerCase().replace(/^www\./, "");
}

export async function getLinks(page: Page, currentUrl: URL, hostname: string, detailPattern: RegExp, excludedPathPatterns: RegExp[]): Promise<LinkDiscovery> {
	const hrefs = await page.$$eval("a[href]", (elements) => elements.map((element) => element.getAttribute("href") || ""));
	const links: string[] = [];
	const detailLinks: string[] = [];
	let skippedExternal = 0;
	let skippedExcluded = 0;
	let skippedInvalid = 0;
	let aliasHostLinks = 0;
	const rejectedHostnames = new Set<string>();
	const expectedHostname = comparableHostname(hostname);
	const resolvedPageUrl = normalizeUrl(page.url()) ?? currentUrl;
	for (const href of hrefs) {
		try {
			if (!href || href === "#" || href.startsWith("#")) continue;
			const link = new URL(href, resolvedPageUrl);
			if (link.protocol !== "http:" && link.protocol !== "https:") {
				skippedExternal += 1;
				continue;
			}
			if (comparableHostname(link.hostname) !== expectedHostname) {
				skippedExternal += 1;
				rejectedHostnames.add(link.hostname);
				continue;
			}
			if (link.hostname !== hostname) aliasHostLinks += 1;
			link.hostname = hostname;
			if (excludedPathPatterns.some((pattern) => {
				pattern.lastIndex = 0;
				return pattern.test(link.pathname);
			})) {
				skippedExcluded += 1;
				continue;
			}
			link.hash = "";
			links.push(link.href);
			if (isDetailUrl(link, detailPattern)) detailLinks.push(link.href);
		} catch {
			skippedInvalid += 1;
			continue;
		}
	}
	return {
		links: Array.from(new Set(links)),
		detailLinks: Array.from(new Set(detailLinks)),
		skippedExternal,
		skippedExcluded,
		skippedInvalid,
		aliasHostLinks,
		rejectedHostnames: Array.from(rejectedHostnames).slice(0, 10)
	};
}

function recordLog(logs: string[], message: string): void {
	logs.push(message);
	console.log(`[domain-scraper] ${message}`);
}

function recordDebugLog(logs: string[], message: string): void {
	if (debug) recordLog(logs, `DEBUG: ${message}`);
}

function classifyFailure(message: string): string {
	if (message.includes("HTTP 404")) return "HTTP_404";
	if (message.includes("HTTP 431")) return "HTTP_431";
	if (message.includes("HTTP 429")) return "HTTP_429";
	if (message.includes("HTTP 5")) return "HTTP_5XX";
	if (message.includes("timeout") || message.includes("Timeout")) return "TIMEOUT";
	if (message.includes("detached Frame") || message.includes("detached frame")) return "DETACHED_FRAME";
	if (message.includes("net::") || message.includes("Network")) return "NETWORK";
	return "BROWSER_OR_UNKNOWN";
}

function parseNumberOrDefault(formData: FormData, key: string, defaultValue: number): number {
	const rawValue = String(formData.get(key) ?? "").trim();
	if (!rawValue) return defaultValue;
	const value = Number(rawValue);
	return Number.isFinite(value) && value >= 0 ? value : defaultValue;
}

async function findSelector(page: Page, selectors: string[]): Promise<string | null> {
	for (const selector of selectors) {
		if (await page.$(selector)) return selector;
	}
	return null;
}

async function loginToDomain(page: Page, login: DomainScraperLoginConfig, startUrl: URL, logs: string[]): Promise<void> {
	const usernameSelectors = login.usernameSelectors ?? ["input[type=\"email\"]", "input[name=\"email\"]", "input[name=\"username\"]", "input[name=\"user\"]"];
	const passwordSelectors = login.passwordSelectors ?? ["input[type=\"password\"]", "input[name=\"password\"]"];
	const submitSelectors = login.submitSelectors ?? ["button[type=\"submit\"]", "input[type=\"submit\"]"];
	const loginButtonSelectors = login.loginButtonSelectors ?? [];

	logs.push(`LOGIN START: ${login.url}`);
	await page.goto(login.url, { waitUntil: "domcontentloaded", timeout: NAVIGATION_TIMEOUT_MS });
	let usernameSelector = await findSelector(page, usernameSelectors);
	let passwordSelector = await findSelector(page, passwordSelectors);
	let submitSelector = await findSelector(page, submitSelectors);
	if ((!usernameSelector || !passwordSelector || !submitSelector) && loginButtonSelectors.length > 0) {
		const loginButtonSelector = await findSelector(page, loginButtonSelectors);
		if (loginButtonSelector) {
			await page.click(loginButtonSelector);
			await page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: NAVIGATION_TIMEOUT_MS }).catch(() => undefined);
			usernameSelector = await findSelector(page, usernameSelectors);
			passwordSelector = await findSelector(page, passwordSelectors);
			submitSelector = await findSelector(page, submitSelectors);
		}
	}
	if (!usernameSelector || !passwordSelector || !submitSelector) throw new Error("Login form did not contain recognizable username, password, and submit controls");

	await page.type(usernameSelector, login.username);
	await page.type(passwordSelector, login.password);
	await page.click(submitSelector);
	await page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: NAVIGATION_TIMEOUT_MS }).catch(() => undefined);
	await page.goto(startUrl.href, { waitUntil: "domcontentloaded", timeout: NAVIGATION_TIMEOUT_MS });

	const finalUrl = normalizeUrl(page.url());
	const loginUrl = normalizeUrl(login.url);
	const isLoginPath = finalUrl?.pathname.toLowerCase().includes("/account/login") ?? true;
	const reachedStartHost = finalUrl?.host === startUrl.host;
	const isIdentityProvider = Boolean(finalUrl && loginUrl && finalUrl.host === loginUrl.host && finalUrl.host !== startUrl.host);
	if (!finalUrl || isLoginPath || isIdentityProvider || !reachedStartHost) throw new Error("Login did not grant access to the configured start URL");
	logs.push(`LOGIN COMPLETE: reached ${finalUrl.href}`);
}

function isDetailUrl(url: URL, pattern: RegExp): boolean {
	pattern.lastIndex = 0;
	return pattern.test(url.pathname);
}

function normalizeFieldValues(value: unknown): string[] {
	if (value === undefined || value === null) return [];
	if (Array.isArray(value)) return value.flatMap(normalizeFieldValues);
	if (value instanceof Set) return Array.from(value).flatMap(normalizeFieldValues);
	if (typeof value === "object") return Object.values(value).flatMap(normalizeFieldValues);
	const normalized = String(value).trim();
	return normalized ? [normalized] : [];
}

function mergeScopedPeople(people: ScopedPerson[]): ScopedPerson | null {
	if (people.length === 0) return null;
	const fields: PersonSelectorValues = {};
	const emails = new Set<string>();
	const phones = new Set<string>();
	const categories = new Set<string>();
	const addresses = new Set<string>();
	const countries = new Set<string>();
	const fullNames = new Set<string>();
	const socials: Record<string, string> = {};
	for (const person of people) {
		for (const email of normalizeFieldValues(person.fields.emails)) emails.add(email);
		for (const phone of normalizeFieldValues(person.fields.phone)) phones.add(phone);
		for (const category of normalizeFieldValues(person.fields.category)) categories.add(category);
		for (const address of normalizeFieldValues(person.fields.address)) addresses.add(address);
		for (const country of normalizeFieldValues(person.fields.country)) countries.add(country);
		for (const fullName of normalizeFieldValues(person.fields.fullName)) fullNames.add(fullName);
		for (const [platform, value] of Object.entries(person.fields.socials ?? {})) {
			const normalized = normalizeFieldValues(value)[0];
			if (normalized) socials[platform] = normalized;
		}
		for (const [field, value] of Object.entries(person.fields)) {
			if (field === "emails" || field === "phone" || field === "category" || field === "address" || field === "fullName" || field === "socials" || field === "country") continue;
			if ((fields as Record<string, unknown>)[field] === undefined) {
				const normalized = normalizeFieldValues(value);
				if (normalized.length > 0) (fields as Record<string, unknown>)[field] = normalized.join(" | ");
			}
		}
	}
	if (emails.size > 0) fields.emails = Array.from(emails);
	if (phones.size > 0) fields.phone = Array.from(phones);
	if (categories.size > 0) fields.category = Array.from(categories);
	if (addresses.size > 0) fields.address = Array.from(addresses);
	if (countries.size > 0) fields.country = Array.from(countries).join(" | ");
	if (fullNames.size > 0) {
		(fields as Record<string, unknown>).fullName = Array.from(fullNames);
		const parsedName = parseFullName(Array.from(fullNames)[0]);
		if (parsedName.firstName) fields.firstName = parsedName.firstName;
		if (parsedName.lastName) fields.lastName = parsedName.lastName;
	}
	if (Object.keys(socials).length > 0) fields.socials = socials;
	const firstEmail = fields.emails?.[0];
	return { ...(firstEmail ? { email: firstEmail } : {}), fields };
}

function applyCategoryRules(fields: PersonSelectorValues, rules: readonly DomainScraperCategoryRule[] | undefined): void {
	if (!rules || rules.length === 0) return;
	const categories = new Set(normalizeFieldValues(fields.category));
	const matchesAny = (values: string[], needles: string[]): boolean => needles.some((needle) => {
		const normalizedNeedle = needle.trim().toLowerCase();
		return normalizedNeedle && values.some((value) => value.toLowerCase().includes(normalizedNeedle));
	});
	const addresses = normalizeFieldValues(fields.address);
	const emails = normalizeFieldValues(fields.emails);
	const websites = normalizeFieldValues(fields.website);
	for (const rule of rules) {
		const matchesAddress = matchesAny(addresses, rule.addressContains ?? []);
		const matchesEmail = matchesAny(emails, rule.emailContains ?? []);
		const matchesWebsite = matchesAny(websites, rule.websiteContains ?? []);
		if (matchesAddress || matchesEmail || matchesWebsite) categories.add(rule.category);
	}
	if (categories.size > 0) fields.category = Array.from(categories);
}

export async function scrapeDomain(formData: FormData): Promise<DomainScrapeResult> {
	const startedAt = Date.now();
	const startedAtIso = new Date(startedAt).toISOString();
	const domainScraperConfig = getFullPixelatedConfig().integrations?.domainScraper;
	const input = String(formData.get("url") ?? domainScraperConfig?.startUrl ?? "").trim();
	const start = normalizeUrl(input);
	if (!start) return { startUrl: input, pagesCrawled: 0, records: [], logs: [], error: "Enter a valid http or https URL." };
	const configuredSiteEntry = Object.entries(domainScraperConfig?.sites ?? {}).find(([, site]) => site.startUrls.some((siteStartUrl) => normalizeUrl(siteStartUrl)?.href === start.href));
	const configuredSiteName = configuredSiteEntry?.[0];
	const configuredSite = configuredSiteEntry?.[1];
	if (!configuredSiteName || !configuredSite) return { startUrl: start.href, pagesCrawled: 0, records: [], logs: [], error: "The URL must match a configured domain scraper site." };
	const discoveryType = configuredSite.discoveryType ?? "crawler";
	const menuPaginationType = configuredSite.menuPaginationType;
	if (discoveryType === "menu" && menuPaginationType !== "kendo") return { startUrl: start.href, pagesCrawled: 0, records: [], logs: [], error: "Menu discovery requires a supported menuPaginationType." };
	let detailPattern: RegExp | null = null;
	if (configuredSite.detailUrlPattern) {
		try {
			detailPattern = new RegExp(configuredSite.detailUrlPattern);
		} catch {
			detailPattern = null;
		}
	}
	if (!detailPattern) return { startUrl: start.href, pagesCrawled: 0, records: [], logs: [], error: "The configured site must have a valid detailUrlPattern." };
	const detailSelector = configuredSite.detailPersonIdentifier?.trim();
	if (!detailSelector) return { startUrl: start.href, pagesCrawled: 0, records: [], logs: [], error: "The configured site must have a detailPersonIdentifier." };
	const configuredStartUrls = configuredSite.startUrls.flatMap((siteStartUrl) => {
		const normalized = normalizeUrl(siteStartUrl);
		return normalized ? [normalized] : [];
	});
	if (configuredStartUrls.length === 0) return { startUrl: start.href, pagesCrawled: 0, records: [], logs: [], error: "The configured site must have at least one valid start URL." };
	const recoveryMode = String(formData.get("recoveryMode") ?? "") === "true";
	const requestedRecoveryFileName = String(formData.get("recoveryFileName") ?? "").trim();
	let extractFileName: string;
	if (recoveryMode) {
		if (!requestedRecoveryFileName) return { startUrl: start.href, pagesCrawled: 0, records: [], logs: [], error: "Select a discovery file for Recovery Mode." };
		try {
			extractFileName = createDomainExtractFileNameFromDiscoveryFile(requestedRecoveryFileName);
		} catch {
			return { startUrl: start.href, pagesCrawled: 0, records: [], logs: [], error: "The selected recovery file is invalid." };
		}
		if (!hasDomainExtractFile(extractFileName)) return { startUrl: start.href, pagesCrawled: 0, records: [], logs: [], error: "The selected recovery extract is missing." };
	} else {
		extractFileName = createDomainExtractFileName(configuredSiteName);
	}
	const checkpoint = recoveryMode ? readDomainDiscoveryCheckpoint(extractFileName) : null;
	if (recoveryMode && !checkpoint) return { startUrl: start.href, pagesCrawled: 0, records: [], logs: [], error: "The selected discovery checkpoint is missing." };
	const configuredExcludedPathPatterns = (configuredSite.excludedUrlPatterns ?? []).flatMap((source) => {
		try {
			return [new RegExp(source)];
		} catch {
			return [];
		}
	});
	const excludedPathPatterns = [...DEFAULT_EXCLUDED_PATH_PATTERNS, ...configuredExcludedPathPatterns];
	const maxPages = recoveryMode && checkpoint ? checkpoint.maxPages : Math.floor(parseNumberOrDefault(formData, "maxPages", configuredSite.maxPages ?? domainScraperConfig?.maxPages ?? 0));
	const maxDepth = recoveryMode && checkpoint ? checkpoint.maxDepth : Math.floor(parseNumberOrDefault(formData, "maxDepth", configuredSite.maxDepth ?? domainScraperConfig?.maxDepth ?? 0));
	const requestDelayMs = recoveryMode && checkpoint ? checkpoint.requestDelayMs : parseNumberOrDefault(formData, "requestDelay", configuredSite.requestDelay ?? domainScraperConfig?.requestDelay ?? 0) * 1000;
	const crawlPages = new Map<string, CrawlEntry>();
	const detailUrls = new Set<string>();
	const extractedDetailUrls = new Set<string>();
	const logs: string[] = [];
	let recordCount = 0;
	recordLog(logs, `JOB START: started=${startedAtIso}`);
	if (checkpoint) {
		const matchesJob = checkpoint.startUrl === start.href && checkpoint.siteName === configuredSiteName;
		if (!matchesJob) return { startUrl: start.href, pagesCrawled: 0, records: [], logs, error: "The discovery checkpoint does not match the requested crawl configuration." };
		for (const entry of checkpoint.crawlPages) {
			crawlPages.set(entry.url, { ...entry, status: entry.status === "fetching" ? "discovered" : entry.status });
		}
		for (const detailUrl of checkpoint.detailUrls) detailUrls.add(detailUrl);
		for (const detailUrl of checkpoint.extractedDetailUrls) extractedDetailUrls.add(detailUrl);
		for (const detailUrl of extractedDetailUrls) detailUrls.delete(detailUrl);
		for (const detailUrl of readExtractedSourceUrls(extractFileName)) {
			extractedDetailUrls.add(detailUrl);
			detailUrls.delete(detailUrl);
		}
	} else {
		initializePeopleExtractFile(extractFileName);
		for (const configuredStartUrl of configuredStartUrls) {
			if (isDetailUrl(configuredStartUrl, detailPattern)) detailUrls.add(configuredStartUrl.href);
			else if (discoveryType === "crawler") crawlPages.set(configuredStartUrl.href, { url: configuredStartUrl.href, depth: 0, isDetail: false, status: "discovered" });
		}
	}
	let lastRequestAt = 0;
	let fetchAttempts = 0;
	let pagesFetched = 0;
	let discoveryPagesFetched = 0;
	let pagesFailed = 0;
	let rateLimitResponses = 0;
	let rateLimitedPages = 0;
	let menuPagination: DomainMenuPaginationCheckpoint | undefined = checkpoint?.menuPagination ? { ...checkpoint.menuPagination } : discoveryType === "menu" ? { type: "kendo", page: 1, status: "discovered" } : undefined;
	if (checkpoint) {
		fetchAttempts = checkpoint.counters.fetchAttempts;
		pagesFetched = checkpoint.counters.pagesFetched;
		discoveryPagesFetched = checkpoint.counters.discoveryPagesFetched;
		pagesFailed = checkpoint.counters.pagesFailed;
		rateLimitResponses = checkpoint.counters.rateLimitResponses;
		rateLimitedPages = checkpoint.counters.rateLimitedPages;
		recordCount = readPeopleFromExtractFile(extractFileName).length;
	}
	const browser: Browser = await launchPuppeteerBrowser({ headless: false, defaultViewport: { width: 1900, height: 1200 } });
	const browserPage: Page = await openPuppeteerPage(browser, { bringToFront: true, navigationTimeout: 0, timeout: 0 });
	recordLog(logs, "BROWSER START: opened one visible browser page for the crawl");
	const logProgress = (phase: string, url: string): void => {
		const discovered = Array.from(crawlPages.values()).filter((entry) => entry.status === "discovered").length;
		recordLog(logs, `PROGRESS: phase=${phase} url=${url} started=${startedAtIso} elapsed=${formatElapsed(Date.now() - startedAt)} pages=${crawlPages.size} discovered=${discovered} detailUrls=${detailUrls.size} attempts=${fetchAttempts} fetched=${pagesFetched} failed=${pagesFailed} rateLimited=${rateLimitedPages} rateLimitResponses=${rateLimitResponses} records=${recordCount}`);
	};
	const persistCheckpoint = (phase: DomainDiscoveryCheckpoint["phase"]): void => {
		const entries: DomainDiscoveryCheckpointEntry[] = Array.from(crawlPages.values()).map((entry) => ({ ...entry }));
		writeDomainDiscoveryCheckpoint({
			version: 1,
			extractFileName,
			startUrl: start.href,
			siteName: configuredSiteName,
			maxPages,
			maxDepth,
			requestDelayMs,
			discoveryType,
			menuPaginationType: discoveryType === "menu" ? menuPaginationType : undefined,
			menuPagination,
			crawlPages: entries,
			detailUrls: Array.from(detailUrls),
			extractedDetailUrls: Array.from(extractedDetailUrls),
			counters: { fetchAttempts, pagesFetched, discoveryPagesFetched, pagesFailed, rateLimitResponses, rateLimitedPages },
			phase,
			updatedAt: new Date().toISOString()
		});
	};
	const readResultRecords = (): PersonType[] => readPeopleFromExtractFile(extractFileName);
	const addLinks = async (currentUrl: URL, depth: number): Promise<void> => {
		const discovery = await getLinks(browserPage, currentUrl, start.hostname, detailPattern, excludedPathPatterns);
		const links = discovery.links;
		let added = 0;
		let detailAdded = 0;
		for (const link of links) {
			const nextUrl = new URL(link);
			if (maxDepth > 0 && depth >= maxDepth) continue;
			const isDetail = isDetailUrl(nextUrl, detailPattern);
			if (isDetail) {
				if (extractedDetailUrls.has(nextUrl.href)) continue;
				if (!detailUrls.has(nextUrl.href)) {
					detailUrls.add(nextUrl.href);
					detailAdded += 1;
				}
				continue;
			}
			if (crawlPages.has(nextUrl.href)) continue;
			crawlPages.set(nextUrl.href, { url: nextUrl.href, depth: depth + 1, isDetail: false, status: "discovered" });
			added += 1;
		}
		recordLog(logs, `DISCOVERY LINKS: ${currentUrl.href} found=${links.length} added=${added}`);
		recordDebugLog(logs, `URL CHECK current=${currentUrl.href} raw=${links.length + discovery.skippedExternal + discovery.skippedExcluded + discovery.skippedInvalid} accepted=${links.length} externalOrDifferentHost=${discovery.skippedExternal} excluded=${discovery.skippedExcluded} invalid=${discovery.skippedInvalid} wwwAlias=${discovery.aliasHostLinks} rejectedHosts=${discovery.rejectedHostnames.join(",") || "none"}`);
		recordDebugLog(logs, `DETAIL MATCHES current=${currentUrl.href} matched=${discovery.detailLinks.length} added=${detailAdded} depth=${depth} pattern=${detailPattern.source} urls=${discovery.detailLinks.join(",") || "none"}`);
	};
	const fetchPage = async (url: URL): Promise<void> => {
		let rateLimitRetries = 0;
		while (true) {
			if (requestDelayMs > 0 && lastRequestAt > 0) {
				const remainingDelayMs = requestDelayMs - (Date.now() - lastRequestAt);
				if (remainingDelayMs > 0) await new Promise((resolve) => setTimeout(resolve, remainingDelayMs));
			}
			lastRequestAt = Date.now();
			fetchAttempts += 1;
			const response = await browserPage.goto(url.href, { waitUntil: "domcontentloaded", timeout: NAVIGATION_TIMEOUT_MS });
			const status = response?.status() ?? 0;
			const retryAfter = response?.headers()["retry-after"] || "none";
			recordLog(logs, `HTTP RESPONSE: status=${status} url=${url.href} retryAfter=${retryAfter}`);
			if (status === 429) {
				rateLimitResponses += 1;
				rateLimitRetries += 1;
				if (rateLimitRetries > 3) throw new Error(`RATE_LIMIT_EXHAUSTED: ${url.href}`);
				const retryAfterSeconds = Number(retryAfter);
				const retryDelayMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0 ? retryAfterSeconds * 1000 : Math.max(requestDelayMs, 5000) * (2 ** (rateLimitRetries - 1));
				await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
				continue;
			}
			if (status >= 400) throw new Error(`Browser fetch returned HTTP ${status}`);
			await browserPage.waitForNetworkIdle({ idleTime: 500, timeout: 5000 }).catch(() => undefined);
			pagesFetched += 1;
			return;
		}
	};
	const fetchKendoPage = async (pageNumber: number): Promise<void> => {
		if (requestDelayMs > 0 && lastRequestAt > 0) {
			const remainingDelayMs = requestDelayMs - (Date.now() - lastRequestAt);
			if (remainingDelayMs > 0) await new Promise((resolve) => setTimeout(resolve, remainingDelayMs));
		}
		lastRequestAt = Date.now();
		fetchAttempts += 1;
		const pageSize = 10;
		const cookies = await browserPage.cookies(start.href);
		const cookieHeader = cookies.map(({ name, value }) => `${name}=${value}`).join("; ");
		const payload = await smartFetch(new URL("/Member/SearchData", start.origin).href, {
			responseType: "json",
			cacheStrategy: "none",
			retries: 0,
			timeout: NAVIGATION_TIMEOUT_MS,
			requestInit: {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...(cookieHeader ? { Cookie: cookieHeader } : {}),
					Referer: start.href,
					Origin: start.origin
				},
				body: JSON.stringify({ g_search: "", search_letter: "", search_all: "0", page: pageNumber, pageSize })
			}
		}) as { Directory?: { member?: Array<{ assn_id?: unknown; member_id?: unknown }>; total_count?: unknown } };
		const members = Array.isArray(payload.Directory?.member) ? payload.Directory.member : [];
		const totalCount = Number(payload.Directory?.total_count);
		if (!Number.isFinite(totalCount)) throw new Error("Kendo response did not include a valid total_count");
		const result = {
			totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
			members: members.flatMap((member) => {
				const assnId = typeof member.assn_id === "string" ? member.assn_id : "";
				const memberId = typeof member.member_id === "string" ? member.member_id : "";
				return assnId && memberId ? [{ assnId, memberId }] : [];
			})
		};
		for (const member of result.members) {
			const detailUrl = new URL(`/Member/${encodeURIComponent(member.assnId)}~${encodeURIComponent(member.memberId)}`, start.origin);
			if (isDetailUrl(detailUrl, detailPattern) && !extractedDetailUrls.has(detailUrl.href)) detailUrls.add(detailUrl.href);
		}
		pagesFetched += 1;
		discoveryPagesFetched += 1;
		if (menuPagination) menuPagination.totalPages = result.totalPages;
	};
	try {
		if (configuredSite.login) {
			try {
				await loginToDomain(browserPage, configuredSite.login, start, logs);
			} catch (error) {
				const message = error instanceof Error ? error.message : "Unknown login error";
				recordLog(logs, `LOGIN FAILED: ${message}`);
				return { startUrl: start.href, pagesCrawled: 0, records: [], logs, error: message };
			}
		}
		logProgress("DISCOVERY START", start.href);
		persistCheckpoint("discovery");
		if (discoveryType === "menu") {
			const pagination = menuPagination;
			if (!pagination || menuPaginationType !== "kendo") throw new Error("Kendo menu pagination is not configured.");
			let pageNumber = pagination.status === "fetched" ? pagination.page + 1 : pagination.page;
			while (pageNumber <= (pagination.totalPages ?? Number.MAX_SAFE_INTEGER)) {
				if (maxPages > 0 && discoveryPagesFetched >= maxPages) break;
				pagination.page = pageNumber;
				pagination.status = "fetching";
				persistCheckpoint("discovery");
				try {
					await fetchKendoPage(pageNumber);
					pagination.status = "fetched";
					persistCheckpoint("discovery");
					logProgress("DISCOVERED", `${start.href} page=${pageNumber}`);
					pageNumber += 1;
				} catch (error) {
					pagination.status = "failed";
					pagesFailed += 1;
					persistCheckpoint("discovery");
					const message = error instanceof Error ? error.message : "Unknown Kendo pagination error";
					recordLog(logs, `FETCH FAILED: class=${classifyFailure(message)} url=${start.href} page=${pageNumber} - ${message}`);
					break;
				}
			}
		} else {
			while (true) {
				const entry = Array.from(crawlPages.values()).find((candidate) => candidate.status === "discovered");
				if (!entry) break;
				if (maxPages > 0 && discoveryPagesFetched >= maxPages) {
					recordLog(logs, `LIMIT: discovery stopped at maximum pages ${maxPages}`);
					break;
				}
				entry.status = "fetching";
				persistCheckpoint("discovery");
				const currentUrl = new URL(entry.url);
				try {
					await fetchPage(currentUrl);
					discoveryPagesFetched += 1;
					await addLinks(currentUrl, entry.depth);
					entry.status = "fetched";
					persistCheckpoint("discovery");
					logProgress("DISCOVERED", currentUrl.href);
				} catch (error) {
					entry.status = "failed";
					const message = error instanceof Error ? error.message : "Unknown fetch error";
					if (message.startsWith("RATE_LIMIT_EXHAUSTED:")) {
						rateLimitedPages += 1;
						recordLog(logs, `RATE LIMIT: discovery stopped at ${currentUrl.href}`);
						break;
					}
					pagesFailed += 1;
					persistCheckpoint("discovery");
					recordLog(logs, `FETCH FAILED: class=${classifyFailure(message)} url=${currentUrl.href} - ${message}`);
				}
			}
		}
		logProgress("DISCOVERY COMPLETE", start.href);
		persistCheckpoint("extraction");
		const detailEntries = Array.from(detailUrls);
		recordLog(logs, `EXTRACTION START: ${detailEntries.length} detail page(s)`);
		for (const detailEntry of detailEntries) {
			if (!detailUrls.has(detailEntry)) continue;
			const detailUrl = new URL(detailEntry);
			try {
				await fetchPage(detailUrl);
				await browserPage.waitForSelector(detailSelector, { timeout: DETAIL_SELECTOR_TIMEOUT_MS });
				const patternSources = Object.fromEntries(Object.entries(PERSON_FIELD_PATTERNS).map(([field, patterns]) => [field, patterns.map((pattern) => ({ source: pattern.source, flags: pattern.flags }))]));
				const extractorSource = extractPeopleFromDocument.toString().replace(/\b__name\d*\b/g, "__name");
				const evaluationSource = `(() => { const __name = function(target) { return target; }; const extractor = (${extractorSource}); return extractor(document, ${JSON.stringify(PERSON_FIELD_SELECTORS)}, ${JSON.stringify([detailSelector])}, ${JSON.stringify(patternSources)}, location.hostname); })()`;
				const scopedPeople = await browserPage.evaluate(evaluationSource) as unknown as ScopedPerson[];
				const candidate = mergeScopedPeople(scopedPeople);
				if (!candidate) throw new Error(`Detail selector matched no data on ${detailEntry}`);
				const personFields = candidate.fields;
				applyCategoryRules(personFields, configuredSite.categoryRules);
				const memberId = extractMemberId(detailEntry);
				if (memberId) personFields.id = memberId;
				const selectorName = Array.isArray(personFields.fullName) ? personFields.fullName.join(" | ") : typeof personFields.company === "string" ? personFields.company : "";
				const record: PersonType = { ...personFields, sourceUrl: [detailEntry] };
				appendPeopleToExtractFile(extractFileName, [record]);
				recordCount += 1;
				detailUrls.delete(detailEntry);
				extractedDetailUrls.add(detailEntry);
				persistCheckpoint("extraction");
				recordLog(logs, `EXTRACTED: ${detailEntry}`);
				recordLog(logs, `EXTRACT WRITE: ${recordCount} record(s)`);
				logProgress("EXTRACTED", detailEntry);
			} catch (error) {
				const message = error instanceof Error ? error.message : "Unknown extraction error";
				persistCheckpoint("extraction");
				recordLog(logs, `EXTRACTION FAILED: ${detailEntry} - ${message}`);
			}
		}
		persistCheckpoint("complete");
		recordLog(logs, `EXTRACT WRITE COMPLETE: ${recordCount} record(s)`);
		logProgress("COMPLETE", start.href);
		const records = readResultRecords().sort((left, right) => (left.fullName?.join(" | ") || left.company || left.emails?.[0] || "").localeCompare(right.fullName?.join(" | ") || right.company || right.emails?.[0] || ""));
		return { startUrl: start.href, pagesCrawled: pagesFetched, records, logs };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown scraper error";
		recordLog(logs, `SCRAPE FAILED: ${message}`);
		return { startUrl: start.href, pagesCrawled: pagesFetched, records: readResultRecords(), logs, error: message };
	} finally {
		recordLog(logs, "BROWSER CLOSE: closing browser");
		await closePuppeteerBrowser(browser);
		recordLog(logs, `JOB END: ended=${new Date().toISOString()} duration=${formatElapsed(Date.now() - startedAt)}`);
	}
}
