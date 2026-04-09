"use client"; 

import React from 'react';
import { PageSection, PageTitleHeader } from '@pixelated-tech/components';

export default function SewingPage() {
	return (
		<>
			<PageSection columns={1} maxWidth="100%" id="header-section">
				<PageTitleHeader title="Erato's Sewing Studio" />
				<div>
					<p>
					Erato's Sewing Studio serves as a vibrant creative hub where the foundational art of needlework is preserved and passed on to a new generation of makers. When you step into our light-filled classroom, you encounter a professional environment equipped with high-quality machines and all the technical tools necessary to transform raw fabric into wearable art. Our studio features a robust and diverse calendar of events designed to accommodate every skill level, from absolute beginners learning to thread their first bobbin to advanced sewists mastering complex garment construction. By browsing our monthly schedule, you will find a variety of workshops focusing on practical skills, creative upcycling, and seasonal home decor projects. We take immense pride in providing a structured yet supportive educational atmosphere where students can progress at their own pace under the patient guidance of expert instructors. The studio is not merely a place of instruction, but a community space where the rhythmic hum of the machine inspires confidence and fosters a lifelong passion for the tactile joy of sewing.
					</p>
				
					<p>
In addition to our scheduled curriculum, Erato's Sewing Studio offers the unique opportunity to host custom-held events tailored specifically to your group’s interests and celebrations. Whether you are looking to organize a memorable "sip and sew" bridal shower, a creative birthday party for a young aspiring designer, or a specialized team-building workshop for your organization, we can design a private event that perfectly suits your vision. Beyond education and celebration, we provide essential in-house technical services including professional alterations and precise body measurements. Our expert seamstresses handle everything from simple hems to complex formalwear adjustments with the meticulous attention to detail that ensures your wardrobe fits exactly as it was intended. By providing these services in-house, we offer a level of craftsmanship and personalized care that mass-market tailors simply cannot match. We invite you to visit the studio to discuss your next custom project, book a private fitting, or join a community of makers who believe that every stitch tells a story of skill and dedication.
					</p>
				</div>
			</PageSection>
		</>
	);
}
