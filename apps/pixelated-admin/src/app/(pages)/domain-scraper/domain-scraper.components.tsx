"use client";

import { InferProps } from "prop-types";
import { useState, useTransition } from "react";
import { scrapeDomain, type DomainScrapeResult } from "./actions.server";
import "./domain-scraper.css";

/**
 * @param props DomainScraper intentionally has no configurable props in the first pass.
 */
DomainScraper.propTypes = {};
export type DomainScraperType = InferProps<typeof DomainScraper.propTypes>;
export function DomainScraper() {
	const [result, setResult] = useState<DomainScrapeResult | null>(null);
	const [isPending, startTransition] = useTransition();

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
			<p>Enter a starting URL to crawl same-host pages and collect matched names and email addresses.</p>

			<form action={handleSubmit} className="domain-scraper-form">
				<label htmlFor="domain-url">Starting URL</label>
				<div className="domain-scraper-input-row">
					<input id="domain-url" name="url" type="url" placeholder="https://example.com/contact" required />
				</div>
				<div className="domain-scraper-controls">
					<label htmlFor="domain-max-pages">Maximum pages</label>
					<input id="domain-max-pages" name="maxPages" type="number" min="0" placeholder="Unlimited" />
					<br />
					<label htmlFor="domain-max-depth">Maximum depth</label>
					<input id="domain-max-depth" name="maxDepth" type="number" min="0" placeholder="Unlimited" />
					<br />
					<label htmlFor="domain-request-delay">Request delay (seconds)</label>
					<input id="domain-request-delay" name="requestDelay" type="number" min="0" step="0.1" placeholder="No delay" />
				</div>
				<div className="domain-scraper-control-notes">
					Blank or 0 means no delay.
				</div>
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
								<tbody>{result.records.map((record) => (
									<tr key={record.email}><td>{record.name}</td><td>{record.email}</td><td><a href={record.sourceUrl} target="_blank" rel="noopener noreferrer">{record.sourceUrl}</a></td></tr>
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