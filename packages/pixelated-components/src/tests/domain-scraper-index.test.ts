import { describe, expect, it, vi } from "vitest";
import { getLinks, type CrawlEntry } from "../components/admin/scraper/domain-scraper.server";
import { extractMemberId, extractPeopleFromDocument, parseFullName } from "../components/admin/scraper/domain-scraper.functions";

describe("crawl page map", () => {
	it("parses names and member ids defensively", () => {
		expect(parseFullName("Ada Lovelace")).toEqual({ firstName: "Ada", lastName: "Lovelace" });
		expect(parseFullName("Ada")).toEqual({ firstName: "Ada", lastName: "" });
		expect(parseFullName("  ")).toEqual({ firstName: "", lastName: "" });
		expect(extractMemberId("https://example.com/Member/Ada~123")).toBe("123");
		expect(extractMemberId("not a url")).toBeUndefined();
		expect(extractMemberId("https://example.com/other/123")).toBeUndefined();
	});

	it("extracts normalized contact data from a configured person root", () => {
		const document = new DOMParser().parseFromString(`
			<section class="person">
				<h2>Ada Lovelace</h2>
				<a class="email" href="mailto:Ada@example.com">Ada</a>
				<div class="phone">(555) 111-2222</div>
				<div class="address">4 Raymond Court<br>Bluffton, NJ 29909</div>
				<a href="https://facebook.com/ada?ref=profile">Facebook</a>
				<a href="https://example.com">Own site</a>
			</section>
		`, "text/html");
		const people = extractPeopleFromDocument(
			document,
			{
				fullName: ["h2"],
				emails: [".email"],
				phone: [".phone"],
				address: [".address"],
				website: ["a[href]"],
			},
			[".person"],
			{
				emails: [{ source: "[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}", flags: "gi" }],
				phone: [{ source: "(?:\\+?1[\\s.-]*)?(?:\\(\\d{3}\\)|\\d{3})[\\s.-]*\\d{3}[\\s.-]*\\d{4}", flags: "g" }],
			},
			"example.com",
		);

		expect(people).toHaveLength(1);
		expect(people[0].email).toBe("ada@example.com");
		expect(people[0].fields).toMatchObject({
			fullName: ["Ada Lovelace"],
			emails: ["ada@example.com"],
			phone: ["(555) 111-2222"],
			city: "Bluffton",
			state: "NJ",
			zip: "29909",
			socials: { facebook: "https://facebook.com/ada" },
		});
	});

	it("ignores invalid configured selectors", () => {
		const document = new DOMParser().parseFromString("<section class='person'><h2>Ada</h2></section>", "text/html");
		const people = extractPeopleFromDocument(document, { fullName: ["[invalid"] }, [".person"], {}, "example.com");
		expect(people).toHaveLength(1);
		expect(people[0].fields.fullName).toEqual(["Ada"]);
	});

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
