"use client";

import React from "react";
import { PageTitleHeader, PageSection, PageSectionHeader, PageGridItem } from "@pixelated-tech/components";
import { usePixelatedConfig } from "@pixelated-tech/components";
import { SchemaBook } from "@pixelated-tech/components";
import { Callout } from "@pixelated-tech/components";
import { PartnerTags } from "@pixelated-tech/components";

const book = {
	name: "Supermarket Shenanigans - True Tales from Behind the Courtesy Desk",
	image: "/images/supermarket-shenanigans-cover.jpg",
	copyrightYear: 2026,
	datePublished: "2026-07-08",
	description: "Take an unfiltered, hilarious, and insightful look at what it really takes to keep the heartbeat of a major supermarket steady.  More than just a collection of workplace comedy, this memoir is a tribute to the tight-knit community of part-timers and lifers who conquered the chaos together.  It's a story about the lessons corporate manuals can't teach - resilience, the true meaning of customer satisfaction, and taking immense pride in your work - even in the smallest things. Perfect for fans of workplace memoirs, retail veterans who have served their time, and anyone who has ever wondered what really happens on the other side of the register.",
	genre: [ "Memoir", "Humor", "Business Humor" ],
	inLanguage: "en-US",
	isFamilyFriendly: true,
	lccn: "2026918151",
	sameAs: [""],
	variants: [
		{
			bookFormat: "EBook",
			asin: "B0H8FT29ZT",
			isbn: "9798184024486",
			numberOfPages: 162,
			offerURL: "https://www.amazon.com/dp/B0H8FT29ZT",
			price: "4.99",
		},
		{
			bookFormat: "Paperback",
			asin: "B0H8FN5T71",
			isbn: "9798184024486",
			numberOfPages: 219,
			offerURL: "https://www.amazon.com/dp/B0H8FN5T71",
			price: "14.99",
		},
		{
			bookFormat: "Hardcover",
			asin: "B0H8FK9MJM",
			isbn: "9798186215172",
			numberOfPages: 219,
			offerURL: "https://www.amazon.com/dp/B0H8FK9MJM",
			price: "24.99",
		}
	]
};




export default function SupermarketShenanigansPage() {

	const partners = usePixelatedConfig()?.siteInfo?.partners;
	book.sameAs = partners ? partners.map((partner) => partner.url) : [];

	return (
		<>
			<PageSection columns={3} maxWidth="1024px" id="supermarket-shenanigans-container">
				<PageGridItem columnStart={1} columnEnd={4}>
					<PageTitleHeader title="Supermarket Shenanigans: True Tales from Behind the Courtesy Desk" />
					<PageSectionHeader title="by Brian T. Whaley" />
					<p>{book.description}</p>
				</PageGridItem>
				<SchemaBook book={book} />

				<style>{`
				.callout .callout-body .callout-content {
					text-align: center;
				}
			`}</style>

				<Callout
					layout='vertical'
					variant="grid"
					url='https://www.amazon.com/dp/B0H8FT29ZT'
					img='/images/supermarket-shenanigans-cover.jpg'
					imgShape='bevel'
					title='Kindle Edition'
					subtitle='162 pages'
					content="Published July 10, 2026"
					buttonText='$4.99' />

				<Callout
					layout='vertical'
					url='https://www.amazon.com/dp/B0H8FN5T71'
					img='/images/supermarket-shenanigans-cover.jpg'
					imgShape='bevel'
					title='Paperback'
					subtitle='219 pages'
					content="Published July 8, 2026"
					buttonText="$14.99" />

				<Callout
					layout='vertical'
					url='https://www.amazon.com/dp/B0H8FK9MJM'
					img='/images/supermarket-shenanigans-cover.jpg'
					imgShape='bevel'
					title='Hardcover'
					subtitle='219 pages'
					content="Published July 8, 2026"
					buttonText="$24.99" />

				<br />

				<PageGridItem columnStart={1} columnEnd={-1}>
					<PageSectionHeader title="Supermarket Shenanigans - News and Events" />

					{/* <p><a href="https://www.eventbrite.com/e/the-great-big-book-swap-november-2026-tickets-1996103206424">Nov 7, 2026 11am - 2pm - The Great Big Book Swap</a></p>

    <p><a href="https://www.eventbrite.com/e/the-great-big-book-swap-after-dark-october-2026-tickets-1996101999815">Oct 10, 2026 6:30pm - 9:30pm - The Great Big Book Swap After Dark</a></p> */}

					<p><a href="https://rblibrary.org/monthly-events">Sept 26, 2026 1pm - 2pm - Rockaway Borough Free Public Library</a> - <a href="https://engagedpatrons.org/EventsExtended.cfm?SiteID=2550&EventID=596650&PK=">Register Now</a></p>

					<p><a href="https://www.bargainbooksy.com/read/genre/non-fiction/">August 20, 2026 - Featured book on Bargain Booksy - Non-Fiction</a></p>

					<p><a href="https://patch.com/new-jersey/denville-nj/denville-resident-releases-comedic-memoir-frontline-supermarket-life-nodx">Aug 7, 2026 - Denville Resident Releases Comedic Memoir on Frontline Supermarket Life</a></p>
				</PageGridItem>


			</PageSection>
        
			<PartnerTags title="Supermarket Shenanigans Links" columns={8}/>
        
		</>
	);
}
