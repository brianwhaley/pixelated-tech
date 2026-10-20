"use server";

import type { Browser, Page } from "puppeteer";
import { closeBrowser, launchBrowser, openNewPage } from "../../../lib/puppeteer";

export type DomainScrapeRecord = {
	name: string;
	email: string;
	sourceUrl: string;
};

export type DomainScrapeResult = {
	startUrl: string;
	pagesCrawled: number;
	records: DomainScrapeRecord[];
	logs: string[];
	error?: string;
};

const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const namePattern = "([A-Z][A-Za-z'’-]+(?:\\s+[A-Z][A-Za-z'’-]+){1,3})";

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

function decodeHtml(value: string): string {
	return value
		.replace(/&amp;/gi, "&")
		.replace(/&lt;/gi, "<")
		.replace(/&gt;/gi, ">")
		.replace(/&quot;/gi, '"')
		.replace(/&#39;|&apos;/gi, "'")
		.replace(/&#x40;|&#64;|&commat;/gi, "@");
}

function getVisibleText(html: string): string {
	return decodeHtml(html
		.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
		.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
		.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
		.replace(/<template\b[^>]*>[\s\S]*?<\/template>/gi, " ")
		.replace(/<[^>]+>/g, " ")
		.replace(/\s+/g, " ")
		.trim());
}

function findNameForEmail(text: string, email: string): string {
	const emailIndex = text.toLowerCase().indexOf(email.toLowerCase());
	if (emailIndex < 0) return "";

	const before = text.slice(Math.max(0, emailIndex - 140), emailIndex);
	const after = text.slice(emailIndex + email.length, emailIndex + email.length + 140);
	const beforeMatch = before.match(new RegExp(`${namePattern}\\s*(?:<|[-:|,])?\\s*$`));
	if (beforeMatch) return beforeMatch[1].trim();

	const afterMatch = after.match(new RegExp(`^\\s*(?:[-:|,]|is)\\s*${namePattern}`));
	return afterMatch ? afterMatch[1].trim() : "";
}

function getLinks(html: string, currentUrl: URL, hostname: string): string[] {
	const links: string[] = [];
	for (const match of html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["']/gi)) {
		try {
			const link = new URL(decodeHtml(match[1]), currentUrl);
			if ((link.protocol !== "http:" && link.protocol !== "https:") || link.hostname !== hostname) continue;
			link.hash = "";
			links.push(link.href);
		} catch {
			continue;
		}
	}
	return Array.from(new Set(links));
}

function getAllowedPathPrefixes(start: URL): string[] {
	const prefixes = [start.pathname];
	if (!start.pathname.endsWith("/")) prefixes.push(`${start.pathname}/`);
	const pathSegments = start.pathname.split("/").filter(Boolean);
	if (pathSegments.length > 1 && /^[a-z]{2}(?:-[a-z]{2})?$/i.test(pathSegments[0])) {
		const unlocalizedPath = `/${pathSegments.slice(1).join("/")}`;
		prefixes.push(unlocalizedPath);
		if (!unlocalizedPath.endsWith("/")) prefixes.push(`${unlocalizedPath}/`);
	}
	const lastSegment = start.pathname.split("/").filter(Boolean).pop() ?? "";
	const extensionIndex = lastSegment.lastIndexOf(".");
	const baseName = extensionIndex > 0 ? lastSegment.slice(0, extensionIndex) : "";
	if (baseName.length > 1 && baseName.endsWith("s")) {
		prefixes.push(`/${baseName.slice(0, -1)}/`);
	}
	return prefixes;
}

function recordLog(logs: string[], message: string): void {
	logs.push(message);
	console.log(`[domain-scraper] ${message}`);
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

export async function scrapeDomain(formData: FormData): Promise<DomainScrapeResult> {
	const input = String(formData.get("url") ?? "").trim();
	const maxPagesValue = Number(formData.get("maxPages") ?? "");
	const maxDepthValue = Number(formData.get("maxDepth") ?? "");
	const requestDelayValue = Number(formData.get("requestDelay") ?? "");
	const maxPages = Number.isFinite(maxPagesValue) && maxPagesValue > 0 ? Math.floor(maxPagesValue) : 0;
	const maxDepth = Number.isFinite(maxDepthValue) && maxDepthValue > 0 ? Math.floor(maxDepthValue) : 0;
	const requestDelayMs = Number.isFinite(requestDelayValue) && requestDelayValue > 0 ? requestDelayValue * 1000 : 0;
	const start = normalizeUrl(input);
	if (!start) {
		return { startUrl: input, pagesCrawled: 0, records: [], logs: [], error: "Enter a valid http or https URL." };
	}

	const queue: Array<{ url: URL; depth: number }> = [{ url: start, depth: 0 }];
	const queued = new Set([start.href]);
	const visited = new Set<string>();
	const records = new Map<string, DomainScrapeRecord>();
	const logs: string[] = [];
	const allowedPathPrefixes = getAllowedPathPrefixes(start);
	let activeRequests = 0;
	let lastRequestAt = 0;
	let fetchAttempts = 0;
	let pagesFetched = 0;
	let pagesEvaluated = 0;
	let pagesFailed = 0;
	let rateLimitResponses = 0;
	let rateLimitedPages = 0;
	let duplicateLinks = 0;
	const browser: Browser = await launchBrowser({ headless: false, defaultViewport: null });
	const browserPage: Page = await openNewPage(browser);
	recordLog(logs, "BROWSER START: opened one visible browser page for the crawl");
	const logProgress = (phase: string, url: string): void => {
		recordLog(logs, `PROGRESS: phase=${phase} url=${url} discovered=${queued.size} pending=${queue.length} attempts=${fetchAttempts} fetched=${pagesFetched} evaluated=${pagesEvaluated} failed=${pagesFailed} rateLimited=${rateLimitedPages} rateLimitResponses=${rateLimitResponses} duplicateLinks=${duplicateLinks} emails=${records.size}`);
	};
	logProgress("START", start.href);

	while (queue.length > 0) {
		if (maxPages > 0 && visited.size >= maxPages) {
			recordLog(logs, `LIMIT: stopped before fetching another page because maximum pages is ${maxPages}`);
			break;
		}

		const current = queue.shift();
		if (!current || visited.has(current.url.href)) continue;
		const currentUrl = current.url;

		visited.add(currentUrl.href);
		recordLog(logs, `QUEUE: selected ${currentUrl.href} at depth ${current.depth}`);
		logProgress("SELECTED", currentUrl.href);
		activeRequests += 1;
		recordLog(logs, `FETCH START: ${currentUrl.href} (active requests: ${activeRequests})`);

		try {
			let html: string | null = null;
			let rateLimitRetries = 0;
			while (html === null) {
				if (requestDelayMs > 0 && lastRequestAt > 0) {
					const remainingDelayMs = requestDelayMs - (Date.now() - lastRequestAt);
					if (remainingDelayMs > 0) {
						recordLog(logs, `RATE LIMIT: waiting ${(remainingDelayMs / 1000).toFixed(1)} second(s) before ${currentUrl.href}`);
						await new Promise((resolve) => setTimeout(resolve, remainingDelayMs));
					}
				}
				lastRequestAt = Date.now();
				fetchAttempts += 1;
				recordLog(logs, `FETCH ATTEMPT: ${currentUrl.href} attempt=${fetchAttempts}`);
				recordLog(logs, `BROWSER FETCH START: ${currentUrl.href}`);
				const response = await browserPage.goto(currentUrl.href, { waitUntil: "domcontentloaded", timeout: 10000 });
				const status = response?.status() ?? 0;
				const responseUrl = response?.url() || browserPage.url() || currentUrl.href;
				const responseHost = new URL(responseUrl).host;
				const retryAfter = response?.headers()["retry-after"] || "none";
				recordLog(logs, `HTTP RESPONSE: status=${status} requestUrl=${currentUrl.href} finalUrl=${responseUrl} responseHost=${responseHost} retryAfter=${retryAfter}`);
				if (status >= 400) {
					const title = await browserPage.title().catch(() => "");
					const bodySummary = await browserPage.$eval("body", (body) => body.textContent?.replace(/\s+/g, " ").trim().slice(0, 160) || "").catch(() => "");
					recordLog(logs, `HTTP ERROR EVIDENCE: status=${status} title=${JSON.stringify(title.slice(0, 120))} body=${JSON.stringify(bodySummary)}`);
				}
				if (status === 429) {
					rateLimitResponses += 1;
					rateLimitRetries += 1;
					if (rateLimitRetries > 3) {
						throw new Error(`RATE_LIMIT_EXHAUSTED: ${currentUrl.href} remained unavailable after ${rateLimitRetries - 1} retries`);
					}
					const retryAfterSeconds = Number(retryAfter);
					const retryAfterDateMs = retryAfter && Number.isNaN(retryAfterSeconds) ? Date.parse(retryAfter) - Date.now() : 0;
					const exponentialDelayMs = Math.max(requestDelayMs, 5000) * (2 ** (rateLimitRetries - 1));
					const retryDelayMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0
						? retryAfterSeconds * 1000
						: retryAfterDateMs > 0 ? retryAfterDateMs : exponentialDelayMs;
					recordLog(logs, `RATE LIMIT: ${currentUrl.href} returned 429; retry ${rateLimitRetries}/3 in ${(retryDelayMs / 1000).toFixed(1)} second(s)`);
					await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
					continue;
				}
				if (status >= 400) throw new Error(`Browser fetch returned HTTP ${status}`);
				if (currentUrl.pathname === start.pathname) {
					recordLog(logs, `BROWSER WAIT: waiting for advisor profile links on ${currentUrl.href}`);
					await browserPage.waitForSelector('a[href*="/our-advisors/"]', { timeout: 10000 }).catch(() => null);
				}
				if (currentUrl.pathname.split("/").includes("our-advisors") && currentUrl.pathname !== start.pathname) {
					recordLog(logs, `BROWSER WAIT: waiting for profile email link on ${currentUrl.href}`);
					await browserPage.waitForSelector('a[href^="mailto:"]', { timeout: 10000 }).catch(() => null);
				}
				html = await browserPage.content();
				pagesFetched += 1;
			}
			recordLog(logs, `BROWSER FETCH COMPLETE: ${currentUrl.href}`);
			activeRequests -= 1;
			recordLog(logs, `FETCH COMPLETE: ${currentUrl.href} (active requests: ${activeRequests})`);
			logProgress("FETCHED", currentUrl.href);
			recordLog(logs, `EVALUATION START: extracting emails and matching names on ${currentUrl.href}`);
			const visibleText = getVisibleText(html);
			const mailtoMatches = html.matchAll(/href\s*=\s*["']mailto:([^"']+)["']/gi) as Iterable<RegExpMatchArray>;
			const mailtoEmails = Array.from(mailtoMatches)
				.map((match) => decodeURIComponent(match[1].split("?")[0]).trim().toLowerCase());
			const textEmails = visibleText.match(emailPattern) ?? [];
			const emails = Array.from(new Set([...mailtoEmails, ...textEmails.map((email: string) => email.toLowerCase())]));
			for (const email of emails) {
				const existing = records.get(email);
				const name = existing?.name || findNameForEmail(visibleText, email);
				records.set(email, { name, email, sourceUrl: existing?.sourceUrl || currentUrl.href });
			}
			recordLog(logs, `EVALUATION EMAILS: ${currentUrl.href} produced ${emails.length} email(s): ${emails.join(", ") || "none"}`);
			pagesEvaluated += 1;
			logProgress("EVALUATED", currentUrl.href);

			const links = getLinks(html, currentUrl, start.hostname);
			let queuedLinks = 0;
			for (const link of links) {
				const nextUrl = new URL(link);
				const isAllowed = allowedPathPrefixes.some((prefix) => prefix === "/agent/"
					? /^\/agent\/[^/]+\/?$/.test(nextUrl.pathname)
					: prefix.endsWith("/")
						? nextUrl.pathname.startsWith(prefix)
						: nextUrl.pathname === prefix);
				if (!isAllowed || (maxDepth > 0 && current.depth >= maxDepth)) continue;
				if (!queued.has(link) && !visited.has(link)) {
					queued.add(link);
					queue.push({ url: nextUrl, depth: current.depth + 1 });
					queuedLinks += 1;
				} else if (isAllowed) {
					duplicateLinks += 1;
				}
			}
			recordLog(logs, `EVALUATION LINKS: ${currentUrl.href} found ${links.length} same-host link(s), queued ${queuedLinks} allowed link(s)`);
			logProgress("QUEUED", currentUrl.href);
			recordLog(logs, `EVALUATION COMPLETE: ${currentUrl.href}`);
		} catch (error) {
			activeRequests -= 1;
			const message = error instanceof Error ? error.message : "Unknown fetch error";
			if (message.startsWith("RATE_LIMIT_EXHAUSTED:")) {
				rateLimitedPages += 1;
				recordLog(logs, `RATE LIMIT: stopping crawl because ${currentUrl.href} did not become available after retries`);
				logProgress("RATE_LIMIT_STOP", currentUrl.href);
				break;
			}
			pagesFailed += 1;
			recordLog(logs, `FETCH FAILED: class=${classifyFailure(message)} url=${currentUrl.href} (active requests: ${activeRequests}) - ${message}`);
			logProgress("FAILED", currentUrl.href);
		}
	}

	recordLog(logs, "BROWSER CLOSE: closing browser");
	logProgress("COMPLETE", start.href);
	await closeBrowser(browser);

	return {
		startUrl: start.href,
		pagesCrawled: visited.size,
		records: Array.from(records.values()).sort((left, right) => left.email.localeCompare(right.email)),
		logs,
	};
}