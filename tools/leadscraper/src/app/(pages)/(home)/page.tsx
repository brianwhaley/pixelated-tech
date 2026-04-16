"use client";

import { PageTitleHeader, PageSection, PageGridItem } from "@pixelated-tech/components";


export default function Home() {
    
	return (
		<> 
			<PageTitleHeader title="Lead Scraper" />
			<PageSection columns={1}id="links-section">
				<PageGridItem>
					<ul>
						<li><a href="/api/scrape-emails">Scrape List for Emails</a></li>
						<li><a href="/api/scrape-websites">Scrape List for Websites</a></li>
						<li><a href="/api/scrape-google-places">Scrape Google Places</a></li>
						<li><a href="/api/scrape-gemini-hydration">Scrape Gemini - Hydrate</a></li>
						<li><a href="/api/scrape-hhi">Scrape Hilton Head Chamber Site</a></li>
						<li><a href="/api/scrape-morris">Scrape Morris County Chamber Site</a></li>
					</ul>
				</PageGridItem>
				
			</PageSection>

		</>
	);
}
