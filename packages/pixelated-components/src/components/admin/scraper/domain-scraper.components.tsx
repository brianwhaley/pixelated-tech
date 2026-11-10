"use client";

import { InferProps } from "prop-types";
import React, { useEffect, useState, useTransition } from "react";
import { usePixelatedConfig } from "../../config/config.client";
import type { DomainScraperSiteConfig } from "../../config/config.types";
import { listAvailableDomainDiscoveryRuns, scrapeDomain, type DomainScrapeResult } from "./domain-scraper.server";
import type { DomainDiscoveryRun } from "./domain-extract-writer.server";

/**
 * Domain Scraper component.
 *
 * @param no props
 */
DomainScraper.propTypes = { /* no props */ };
export type DomainScraperType = InferProps<typeof DomainScraper.propTypes>;
export function DomainScraper() {
	const config = usePixelatedConfig();
	const configuredSites = Object.entries(config?.integrations?.domainScraper?.sites ?? {});
	const [result, setResult] = useState<DomainScrapeResult | null>(null);
	const [isPending, startTransition] = useTransition();
	const [selectedStartUrl, setSelectedStartUrl] = useState("");
	const [maxPages, setMaxPages] = useState("");
	const [maxDepth, setMaxDepth] = useState("");
	const [requestDelay, setRequestDelay] = useState("");
	const [recoveryMode, setRecoveryMode] = useState(false);
	const [recoveryRuns, setRecoveryRuns] = useState<DomainDiscoveryRun[]>([]);
	const [recoveryRunsLoading, setRecoveryRunsLoading] = useState(false);
	const selectedSite = configuredSites.find(([, site]) => site.startUrls[0] === selectedStartUrl)?.[1] as DomainScraperSiteConfig | undefined;

	useEffect(() => {
		if (selectedStartUrl && !configuredSites.some(([, site]) => site.startUrls[0] === selectedStartUrl)) setSelectedStartUrl("");
	}, [configuredSites, selectedStartUrl]);

	useEffect(() => {
		if (!selectedSite) return;
		setMaxPages(String(selectedSite.maxPages ?? ""));
		setMaxDepth(String(selectedSite.maxDepth ?? ""));
		setRequestDelay(String(selectedSite.requestDelay ?? ""));
	}, [selectedSite]);

	useEffect(() => {
		if (!recoveryMode) {
			setRecoveryRuns([]);
			return;
		}
		let active = true;
		setRecoveryRunsLoading(true);
		listAvailableDomainDiscoveryRuns()
			.then((runs) => {
				if (active) setRecoveryRuns(runs);
			})
			.catch(() => {
				if (active) setRecoveryRuns([]);
			})
			.finally(() => {
				if (active) setRecoveryRunsLoading(false);
			});
		return () => {
			active = false;
		};
	}, [recoveryMode]);

	function handleSubmit(formData: FormData) {
		startTransition(async () => {
			setResult(await scrapeDomain(formData));
		});
	}

	function downloadJson() {
		if (!result) return;
		const blob = new Blob([JSON.stringify(result.records, null, 2)], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = "domain-scrape-results.json";
		link.click();
		URL.revokeObjectURL(url);
	}

	return (
		<main className="domain-scraper">
			<p>Select a configured starting URL to crawl same-host pages and collect matched names and email addresses.</p>
			<form action={handleSubmit} className="domain-scraper-form">
				<label htmlFor="domain-url">Starting URL</label>
				<div className="domain-scraper-input-row">
					<select id="domain-url" name="url" value={selectedStartUrl} onChange={(event) => setSelectedStartUrl(event.target.value)} required>
						<option value="">Select a configured URL</option>
						{configuredSites.map(([siteName, site]) => <option key={siteName} value={site.startUrls[0]}>{site.startUrls[0]}</option>)}
					</select>
				</div>
				<div className="domain-scraper-controls">
					<label htmlFor="domain-max-pages">Maximum pages</label>
					<input id="domain-max-pages" name="maxPages" type="number" min="0" placeholder="Unlimited" value={maxPages} onChange={(event) => setMaxPages(event.target.value)} />
					<br />
					<label htmlFor="domain-max-depth">Maximum depth</label>
					<input id="domain-max-depth" name="maxDepth" type="number" min="0" placeholder="Unlimited" value={maxDepth} onChange={(event) => setMaxDepth(event.target.value)} />
					<br />
					<label htmlFor="domain-request-delay">Request delay (seconds)</label>
					<input id="domain-request-delay" name="requestDelay" type="number" min="0" step="0.1" placeholder="No delay" value={requestDelay} onChange={(event) => setRequestDelay(event.target.value)} />
					<br />
					<label htmlFor="domain-recovery-mode">
						<input id="domain-recovery-mode" name="recoveryMode" type="checkbox" value="true" checked={recoveryMode} onChange={(event) => setRecoveryMode(event.target.checked)} />
						Recovery Mode
					</label>
					{recoveryMode && (
						<>
							<br />
							<label htmlFor="domain-recovery-run">Recovery Run</label>
							<select id="domain-recovery-run" name="recoveryFileName" required disabled={recoveryRunsLoading}>
								<option value="">{recoveryRunsLoading ? "Loading discovery files..." : "Select a discovery file"}</option>
								{recoveryRuns.map((run) => (
									<option key={run.discoveryFileName} value={run.discoveryFileName}>
										{run.discoveryFileName}
									</option>
								))}
							</select>
						</>
					)}
				</div>
				<div className="domain-scraper-control-notes">Blank or 0 means no delay.</div>
				<br />
				<button type="submit" disabled={isPending}>{isPending ? "Crawling..." : "Start crawl"}</button>
			</form>

			{result?.error && <p className="domain-scraper-error">{result.error}</p>}
			{result && !result.error && (
				<section id="domain-scraper-results" className="domain-scraper-results" aria-live="polite">
					<div className="domain-scraper-results-header">
						<div>
							<h2>Results</h2>
							<p>{result.pagesCrawled} pages crawled, {result.records.length} email addresses found.</p>
						</div>
						<button type="button" onClick={downloadJson} disabled={result.records.length === 0}>Download JSON</button>
					</div>
					{result.records.length > 0 ? (
						<div className="domain-scraper-table-wrap">
							<table>
								<thead><tr><th>Name</th><th>Email</th><th>Source</th></tr></thead>
								<tbody>{result.records.map((record, index) => (
									<tr key={`${record.fullName?.join(" | ") || record.company || record.emails?.[0] || index}-${index}`}><td>{record.fullName?.join(" | ") || record.company}</td><td>{record.emails?.join(", ")}</td><td>{record.sourceUrl?.map((sourceUrl) => <a key={sourceUrl} href={sourceUrl} target="_blank" rel="noopener noreferrer">{sourceUrl}</a>)}</td></tr>
								))}</tbody>
							</table>
						</div>
					) : <p>No email addresses were found.</p>}
					<details><summary>Crawl log</summary><ul>{result.logs.map((log, index) => <li key={`${log}-${index}`}>{log}</li>)}</ul></details>
				</section>
			)}
		</main>
	);
}
