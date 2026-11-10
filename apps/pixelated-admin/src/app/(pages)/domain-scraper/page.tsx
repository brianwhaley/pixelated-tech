import { PageTitleHeader } from "@pixelated-tech/components";
import { DomainScraper } from "@pixelated-tech/components/adminclient";
import "./domain-scraper.css";

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