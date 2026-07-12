"use client";

import React from "react";
import { PageTitleHeader, PageSection, PageSectionHeader, PageGridItem } from "@pixelated-tech/components";
import { SchemaBook } from "@pixelated-tech/components";
import { Callout } from "@pixelated-tech/components";

const book = {
	name: "Supermarket Shenanigans - True Tales from Behind the Courtesy Desk",
	image: "/images/supermarket-shenanigans-cover.jpg",
	copyrightYear: 2026,
	datePublished: "2026-07-08",
	description: "Take an unfiltered, hilarious, and insightful look at what it really takes to keep the heartbeat of a major supermarket steady.  More than just a collection of workplace comedy, this memoir is a tribute to the tight-knit community of part-timers and lifers who conquered the chaos together.  It's a story about the lessons corporate manuals can't teach - resilience, the true meaning of customer satisfaction, and taking immense pride in your work - even in the smallest things. Perfect for fans of workplace memoirs, retail veterans who have served their time, and anyone who has ever wondered what really happens on the other side of the register.",
	genre: [ "Memoir", "Humor", "Business Humor" ],
	inLanguage: "en-US",
	isFamilyFriendly: true,
	sameAs: [
		"https://www.amazon.com/dp/B0H8FT29ZT", // kindle
		"https://www.amazon.com/dp/B0H8FN5T71", // paperback
		"https://www.amazon.com/dp/B0H8FK9MJM",  // hardcover
		"https://www.goodreads.com/book/show/255240043-supermarket-shenanigans", // kindle
		"https://www.goodreads.com/book/show/255240108-supermarket-shenanigans", // paperback
		"https://www.goodreads.com/book/show/255241965-supermarket-shenanigans" // hardcover
	],
	variants: [
		{
			bookFormat: "EBook",
			isbn: "9798184024486",
			numberOfPages: 162,
			offerURL: "https://www.amazon.com/dp/B0H8FT29ZT",
			price: "4.99",
		},
		{
			bookFormat: "Paperback",
			isbn: "9798184024486",
			numberOfPages: 219,
			offerURL: "https://www.amazon.com/dp/B0H8FN5T71",
			price: "14.99",
		},
		{
			bookFormat: "Hardcover",
			isbn: "9798186215172",
			numberOfPages: 219,
			offerURL: "https://www.amazon.com/dp/B0H8FK9MJM",
			price: "24.99",
		}
	]
};

export default function SupermarketShenanigansPage() {
	return (
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
				buttonText='$4.99'
			/>

			<Callout
				layout='vertical' 
				url='https://www.amazon.com/dp/B0H8FN5T71' 
				img='/images/supermarket-shenanigans-cover.jpg'
				imgShape='bevel'
				title='Paperback'
				subtitle='219 pages'
				content="Published July 8, 2026"
				buttonText="$14.99"
			/>

			<Callout
				layout='vertical' 
				url='https://www.amazon.com/dp/B0H8FK9MJM' 
				img='/images/supermarket-shenanigans-cover.jpg'
				imgShape='bevel'
				title='Hardcover'
				subtitle='219 pages'
				content="Published July 8, 2026"
				buttonText="$24.99"
			/>
					
				
		</PageSection>
	);
}
