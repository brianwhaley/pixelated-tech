"use client";

import React from "react";
import { PageSection } from "@pixelated-tech/components";
import { SchemaBook } from "@pixelated-tech/components";
import { SmartImage } from "@pixelated-tech/components";

const book = {
	name: "Supermarket Shenanigans - True Tales from Behind the Courtesy Desk",
	image: "/images/supermarket-shenanigans-cover.jpg",
	copyrightYear: 2026,
	datePublished: "2024-06-10",
	description: "Take an unfiltered, hilarious, and insightful look at what it really takes to keep the heartbeat of a major supermarket steady.  More than just a collection of workplace comedy, this memoir is a tribute to the tight-knit community of part-timers and lifers who conquered the chaos together.  It's a story about the lessons corporate manuals can't teach - resilience, the true meaning of customer satisfaction, and taking immense pride in your work - even in the smallest things. Perfect for fans of workplace memoirs, retail veterans who have served their time, and anyone who has ever wondered what really happens on the other side of the register.",
	genre: [ "Memoir", "Humor", "Business Humor" ],
	inLanguage: "en-US",
	isFamilyFriendly: true,
	variants: [
		{
			bookFormat: "Hardcover",
			isbn: "9780030426599",
			numberOfPages: 598,
			offerURL: "https://amazon.com/supermarket-shenanigans-hardcover",
			price: "29.95",
		},
		{
			bookFormat: "Paperback",
			isbn: "9780030426605",
			numberOfPages: 598,
			offerURL: "https://amazon.com/supermarket-shenanigans-paperback",
			price: "19.95",
		},
		{
			bookFormat: "Digital",
			isbn: "9780030426612",
			numberOfPages: 598,
			offerURL: "https://amazon.com/supermarket-shenanigans-digital",
			price: "9.95",
		}
	]
};

export default function SupermarketShenanigansPage() {
	return (
		<PageSection columns={1} maxWidth="768px" id="supermarket-shenanigans-container">
			<SchemaBook book={book} />
			<SmartImage
				src="/images/supermarket-shenanigans-cover.jpg"
				alt="Supermarket Shenanigans"
				aboveFold={true}
				width={800}
				height={600}
			/>
		</PageSection>
	);
}
