import { PageTitleHeader } from "@pixelated-tech/components";
import { DomainScraper } from "./domain-scraper.components";

export const metadata = {
	title: "Domain Scraper | Pixelated Admin",
};

export default function DomainScraperPage() {
	return (
		<>
			<PageTitleHeader title="Domain Scraper" />
			<DomainScraper />
		</>
	);
}