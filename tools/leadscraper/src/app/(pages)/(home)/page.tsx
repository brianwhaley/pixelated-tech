"use client";

import { PageTitleHeader, PageSection, PageSectionHeader, PageGridItem } from "@pixelated-tech/components";


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

				<PageGridItem>
					<PageSectionHeader title="Google Places Scraping" />
					<ul>
						<li>Step 1 - Run Scrape Google Places API route.  It uses business-categories.js and locations.js to merge and create queries and identify potentiial companies without web pages.  </li>
						<li>Step 2 - Run Scrape  Gemini Hydration API route, setting the new json file as the input.  This will verify the abseonce of a web site, and gather email and phone imformation</li>
						<li>Step 3 - use search-public.js script to search for companies in teh json output that has an email address but no web site.</li>
						<li>Step 4 - Use json2csv.js to convert the final JSON output into a CSV file for easier analysis and reporting.</li>
					</ul>
				</PageGridItem>
				
			</PageSection>

		</>
	);
}
