"use client";

// import React, { useEffect, useState } from "react";
import { PageTitleHeader, PageSection, /* PageGridItem, */ PageSectionHeader } from "@pixelated-tech/components";
// import { /* , getGravatarProfile, type GravatarProfile } from '@pixelated-tech/components';
import { Carousel } from "@pixelated-tech/components";

export default function AboutPage() {
	/* const email1 = "brian@pixelated.tech"; 
	const [ profile1, setProfile1 ] = useState<GravatarProfile | null>(null);
	useEffect(() => {
		if (email1) {
			getGravatarProfile(email1).then((data) => {
				setProfile1(data);
			});
		}
	}, [ email1 ]); */

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

			<PageTitleHeader title="About JZ Home Improvement" />

			{ /* <PageSection columns={1} maxWidth="1024px" padding="20px" id="team-section">

				<PageSectionHeader title="Our Team" />

				<PageGridItem >
					<GravatarCard 
						profile={profile1}
						layout="horizontal"
						avatarSize={300}

					/>
				</PageGridItem>

			</PageSection> */ }

			<PageSection columns={1} maxWidth="1024px" padding="20px" id="history-section">
				
				<PageSectionHeader title="Our History" />

				<p>Jacek Machnik, the founder and owner of JZ Home Improvement, began his professional journey long before arriving on American soil. Back in Poland, he underwent rigorous technical training to become a skilled electrician, establishing a strong foundation in the trades. This specialized background provided him with the technical precision and work ethic that would eventually define his career in the United States. In 1995, Jacek made the life-changing decision to emigrate from Poland alongside his wife and their 18-month-old son. Seeking new opportunities, he utilized his expertise to launch his own business and build a legacy for his family.
				</p>

				<p>Since his arrival, Jacek has called Union, New Jersey, his home and the primary hub for his professional operations. Over the past 30 years, he has focused on growing JZ Home Improvement through a steadfast commitment to high-quality craftsmanship and fair, reasonable pricing. His business model relies heavily on his stellar reputation and the power of word-of-mouth recommendations from satisfied clients. Customers frequently return for new projects because they trust his ability to deliver exceptional results without overcharging. By consistently making his clients happy, he has turned a small family venture into a local staple in the home improvement industry.
				</p>

				<p>Beyond his technical skills, Jacek is deeply rooted in the social fabric of his community and the surrounding areas. He maintains strong cultural ties to the Polish, German, and Ukrainian communities, fostering a sense of trust and shared heritage. Known for his personable demeanor, he is a well-connected figure who regularly recommends other local businesses and complementary services to his clients. This commitment to the local economy ensures that his success also benefits the neighbors and colleagues he interacts with daily. Jacek’s dedication to his craft and his community has made him a respected leader and a go-to professional for families across the region.
				</p>
				
			</PageSection>


			<PageSection columns={1} maxWidth="1024px" padding="20px" id="history-section">
				<PageSectionHeader title="Our Service Area" />
				<p>
					JZ Home Improvement proudly serves homeowners throughout Union, New Jersey and the surrounding communities. Our service area includes but is not limited to the following locations:
				</p>
				<ul>
					<li>Sussex County, NJ</li>
					<li>Passaic County, NJ</li>
					<li>Bergen County, NJ</li>
					<li>Warren County, NJ</li>
					<li>Morris County, NJ</li>
					<li>Essex County, NJ</li>
					<li>Hudson County, NJ</li>
					<li>Hunterdon County, NJ</li>
					<li>Somerset County, NJ</li>
					<li>Union County, NJ</li>
					<li>Middlesex County, NJ</li>
					<li>Mercer County, NJ</li>
					<li>Monmouth County, NJ</li>
					<li>Ocean County, NJ</li>
				</ul>
				<p>
					We have been known to take on projects in more distant areas as well, depending on the scope and nature of the work. If you are located outside of these primary service zones, please do not hesitate to contact us to discuss your specific needs and see if we can accommodate your project.
				</p>
				<p>
					We are committed to providing expert craftsmanship, honest pricing, and beautiful results to families across these regions. Whether you are located in a bustling urban area or a quiet suburban neighborhood, JZ Home Improvement is here to help you enhance your home with quality renovations and improvements. Our local roots and strong community ties allow us to understand the unique needs of homeowners in this area and deliver personalized solutions that exceed expectations.
				</p>
			</PageSection>


			<PageSection columns={1} maxWidth="1024px" padding="20px" id="feedback-section">
				<PageSectionHeader title="Testimonials" />
				<Carousel cards={mycards} />
			</PageSection>

		</>
	);
}
