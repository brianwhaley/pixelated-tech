"use client";

import { PageTitleHeader, PageSection, PageSectionHeader } from "@pixelated-tech/components";
import { Tiles } from "@pixelated-tech/components";

export default function About() {

	const project1 = [
		{
			index: 0, cardIndex: 0, cardLength: 9,
			image: "/images/placeholder.png",
			imageAlt: "Project Photo 1",
		},
		{
			index: 1, cardIndex: 1, cardLength: 9,
			image: "/images/placeholder.png",
			imageAlt: "Project Photo 2",
		},
		{
			index: 2, cardIndex: 2, cardLength: 9,
			image: "/images/placeholder.png",
			imageAlt: "Project Photo 3",
		}, 
		{
			index: 3, cardIndex: 3, cardLength: 9,
			image: "/images/placeholder.png",
			imageAlt: "Project Photo 4",
		},
		{
			index: 4, cardIndex: 4, cardLength: 9,
			image: "/images/placeholder.png",
			imageAlt: "Project Photo 5",
		},
		{
			index: 5, cardIndex: 5, cardLength: 9,
			image: "/images/placeholder.png",
			imageAlt: "Project Photo 6",
		}];

	const project2 = [
		{
			index: 0, cardIndex: 0, cardLength: 3,
			image: "/images/placeholder.png",
			imageAlt: "Project Photo 7",
		},
		{
			index: 1, cardIndex: 1, cardLength: 3,
			image: "/images/placeholder.png",
			imageAlt: "Project Photo 8",
		},
		{
			index: 2, cardIndex: 2, cardLength: 3,
			image: "/images/placeholder.png",
			imageAlt: "Project Photo 9",
		}];

	const project3 = [
		{
			index: 0, cardIndex: 0, cardLength: 6,
			image: "/images/placeholder.png",
			imageAlt: "Project Photo 10",
		},
		{
			index: 1, cardIndex: 1, cardLength: 6,
			image: "/images/placeholder.png",
			imageAlt: "Project Photo 11",
		},
		{
			index: 2, cardIndex: 2, cardLength: 6,
			image: "/images/placeholder.png",
			imageAlt: "Project Photo 12",
		},
		{
			index: 3, cardIndex: 3, cardLength: 6,
			image: "/images/placeholder.png",
			imageAlt: "Project Photo 13",
		},
		{
			index: 4, cardIndex: 4, cardLength: 6,
			image: "/images/placeholder.png",
			imageAlt: "Project Photo 14",
		},
		{
			index: 5, cardIndex: 5, cardLength: 6,
			image: "/images/placeholder.png",
			imageAlt: "Project Photo 15",
		}];

    
	return (
		<>

			<PageTitleHeader title="__SITE_NAME__ Projects" />

			<PageSection columns={1} maxWidth="1024px" padding="20px" id="colors-section">
				<PageSectionHeader title="Our Projects" />

				<h3>Project 1</h3>
				<p>Project 1 was a really great project. Lots of people worked on it,
					and it turned out to be a beautiful.  It was the most beautiful
					project anyone had ever seen.</p>
				<Tiles cards={project1} rowCount={3}/>

				<h3>Project 2</h3>
				<p>Project 2 was even better than project 1.  It had all the same
					features as project 1, but it was bigger and better in every way.
					Everyone who saw it said it was the best project they had ever seen.</p>
				<Tiles cards={project2} rowCount={3}/>

				<h3>Project 3</h3>
				<p>If you thought Project 2 was good, wait until you see Project 3.
					Project 3 took everything that was great about Project 2 and made
					it even better.  It was the pinnacle of all projects, and everyone
					who saw it was blown away by its beauty and grandeur.</p>
				<Tiles cards={project3} rowCount={3}/>
			</PageSection>

		</>
	);
}
