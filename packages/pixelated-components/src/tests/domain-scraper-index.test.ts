import { describe, expect, it, vi } from "vitest";
import { getLinks, type CrawlEntry } from "../components/admin/scraper/domain-scraper.server";

describe("crawl page map", () => {
	it("stores one entry per canonical URL", () => {
		const pages = new Map<string, CrawlEntry>();
		const entry: CrawlEntry = { url: "https://example.com/contact", depth: 0, isDetail: false, status: "discovered" };
		pages.set(entry.url, entry);
		pages.set(entry.url, { ...entry, status: "fetched" });

		expect(pages).toHaveLength(1);
		expect(pages.get(entry.url)?.status).toBe("fetched");
	});

	it("tracks detail classification independently from crawl status", () => {
		const listing: CrawlEntry = { url: "https://example.com/directory", depth: 0, isDetail: false, status: "fetched" };
		const detail: CrawlEntry = { url: "https://example.com/member/1", depth: 1, isDetail: true, status: "fetched" };

		expect(listing.isDetail).toBe(false);
		expect(detail.isDetail).toBe(true);
	});

	it("uses explicit lifecycle statuses", () => {
		const statuses: CrawlEntry["status"][] = ["discovered", "fetching", "fetched", "extracted", "failed"];
		expect(statuses).toEqual(expect.arrayContaining(statuses));
	});

	it("resolves relative links from the final page URL and collapses host aliases", async () => {
		const page = {
			url: vi.fn(() => "https://www.example.com/directory"),
			$$eval: vi.fn().mockResolvedValue([
				"/member/1",
				"/member/1",
				"https://example.com/member/2"
			])
		} as never;

		const discovery = await getLinks(
			page,
			new URL("https://example.com/directory"),
			"www.example.com",
			/^\/member\//,
			[]
		);

		expect(discovery.detailLinks).toEqual([
			"https://www.example.com/member/1",
			"https://www.example.com/member/2"
		]);
		expect(discovery.aliasHostLinks).toBe(1);
	});
});
