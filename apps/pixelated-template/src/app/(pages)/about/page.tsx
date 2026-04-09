"use client";

import React, { useEffect, useState } from "react";
import { PageTitleHeader, PageSection, PageGridItem, PageSectionHeader } from "@pixelated-tech/components";
import { GravatarCard } from '@pixelated-tech/components';
import { getGravatarProfile, type GravatarProfile } from '@pixelated-tech/components';
import { Carousel } from "@pixelated-tech/components";

export default function About() {
	const email1 = "brian@pixelated.tech"; 

	const [ profile1, setProfile1 ] = useState<GravatarProfile | null>(null);

	useEffect(() => {
		if (email1) {
			getGravatarProfile(email1)
				.then((data) => {
					setProfile1(data);
				})
				.catch(() => {
					// Silently handle CORS or network errors
					setProfile1(null);
				});
		}
	}, [ email1 ]); 

	const mycards = [
		{
			headerText: "Awesome Job",
			subHeaderText: "\"We recently hired this company to work for us, and their service exceeded our expectations!  I would highly recommend them to anyone looking for quality company with great customer service.\"",
			bodyText: " - David Chen",
			index: 0, cardIndex: 0, cardLength: 3, image: "",
		} , {
			headerText: "Top-Notch Service",
			subHeaderText: "\"As someone who knows this industry, I can confidently say this company stands out for their professionalism and dedication. They followed through all the way to the end of the project and beyond to make sure i was satisfied.\"",
			bodyText: " - Sarah Jenkins",
			index: 1, cardIndex: 1, cardLength: 3, image: "",
		} , {
			headerText: "Reliable, Detail-Oriented & Friendly",
			subHeaderText: "\"If you don't hire this company, you're already making a big mistake on your project.  Be sure to call them out, meet with you, and discuss how they can solve all your problems.  Their work is like magic!\"",
			bodyText: " - Michael O'Connell",
			index: 2, cardIndex: 2, cardLength: 3, image: "",
		}];

    
	return (
		<>

			<PageTitleHeader title="About __SITE_NAME__" />

			<PageSection columns={1} maxWidth="1024px" padding="20px" id="team-section">

				<PageSectionHeader title="Our Team" />

				<PageGridItem >
					<GravatarCard 
						profile={profile1}
						layout="horizontal"
						avatarSize={300}

					/>
				</PageGridItem>

			</PageSection>

			<PageSection columns={1} maxWidth="1024px" padding="20px" id="history-section">
				
				<PageSectionHeader title="Our History" />

				<p>In the heart of the South Carolina Lowcountry, __SITE_NAME__ began 
					its journey with little more than an idea and a dedication 
					to quality. Founded in 1492, the company built 
					its reputation one project at a time. They focused on mastering the unique 
					challenges of the Lowcountry, offering personalized services 
					that transformed things that were not-so-good into things tat are spectacular.
					Their hands-on approach and commitment to individual 
					satisfaction quickly fostered a loyal clientele, establishing 
					a strong foundation rooted in trust and meticulous attention to detail.</p>
				
				<p>As their reputation flourished through word-of-mouth, __SITE_NAME__ 
					strategically expanded its operations to meet the demands of the areas 
					booming growth. The small, family-owned business gradually 
					scaled up moving to more complex projects.  
					Yet, despite taking on bigger challenges, 
					the company remained true to its founding principles of reliability 
					and aesthetic excellence, adapting its bespoke service model to 
					suit its expanding clientele.</p>
				
				<p>At __SITE_NAME__, the philosophy remains simple: every project 
					is a testament to the art of superior service. The goal is 
					to exceed expectations not just through the beauty of the finished work, 
					but through exceptional service and a profound respect for the 
					region. We are dedicated to delivering unparalleled 
					quality using sustainable practices that enhance the community 
					of the Lowcountry, ensuring that every project we take on — whether 
					a small fix or a major undertaking — flourishes in harmony 
					with the community it serves. The commitment is unwavering: 
					creating lasting beauty, one project at a time.</p>

			</PageSection>

			<PageSection columns={1} maxWidth="1024px" padding="20px" id="feedback-section">
				<PageSectionHeader title="Testimonials" />
				<Carousel cards={mycards} />
			</PageSection>

		</>
	);
}
