"use client";

import React from "react";
import { PageSection, PageSectionHeader, PageTitleHeader } from "@pixelated-tech/components";

export default function TestimonialsPage() {
	return (
		<>
			<PageTitleHeader title="Testimonials" />
			<PageSection columns={1} maxWidth="1024px" padding="20px" id="customer-testimonial">
				<PageSectionHeader title="Care shown in the finished result" />
				<blockquote>
					<p>Marvelous Painting just completed a painting project and room expansion for me. They were clean and efficient from the start. The workers take pride in their work, everything was covered, and the end product was perfect. The estimate process was fast and replies were quick.</p>
					<cite> Dennis and Gina Tupper</cite>
				</blockquote>
			</PageSection>
			<PageSection columns={1} maxWidth="1024px" padding="20px" id="project-stories">
				<PageSectionHeader title="See more project stories" />
				<p>We are building a gallery of local projects and customer appreciation letters to make the work easier to explore. Visit the <a href="/gallery">gallery</a> or <a href="/contact">contact us</a> to discuss a project of your own.</p>
			</PageSection>
		</>
	);
}
