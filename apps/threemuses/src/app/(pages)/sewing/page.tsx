"use client"; 

import React from 'react';
import { PageTitleHeader, PageSection, PageSectionHeader, PageGridItem } from '@pixelated-tech/components';
import { Callout } from '@pixelated-tech/components';

export default function SewingPage() {
	return (
		<>
			<PageSection columns={1} maxWidth="100%" id="sewing-section">
				<PageTitleHeader title="Erato's Sewing Studio" />
				<div>
					<p>
						Erato's Sewing Studio is a vibrant creative hub where the foundational art of needlework is passed to a new generation. Our professional classroom is equipped with high-quality machines and tools to transform fabric into wearable art. We offer a diverse calendar of events for all skill levels, from absolute beginners to advanced sewists. Students can progress at their own pace under expert guidance through workshops focused on practical skills, upcycling, and home decor. More than just a place of instruction, our studio is a community space where the rhythmic hum of the machine inspires confidence and a lifelong passion for sewing.
					</p>
					<p>
						Beyond our standard curriculum, we offer custom-held events tailored to your group's specific interests and celebrations. From "sip and sew" bridal showers to creative birthday parties and team-building workshops, we design private events to suit your vision. We also provide essential in-house technical services, including professional alterations and precise body measurements. Our expert seamstresses handle everything from simple hems to complex formalwear with meticulous attention to detail. By offering these services in-house, we provide a level of craftsmanship and personalized care that mass-market tailors cannot match. Visit us to discuss your next project or join our dedicated community of makers.
					</p>
				</div>
			</PageSection>



			<PageSection columns={1} maxWidth="1024px" id="events-section">

				<PageGridItem columnSpan={3}>
					<PageSectionHeader title="Our Upcoming Events" />
				</PageGridItem>

				<Callout
					variant="boxedgrid"
					layout="horizontal"
					img="/images/logo/muse2-erato.png"
					url="/events"
					title="Erato's Upcoming Sewing Events"
					subtitle="Join Us for Sewing Workshops, Classes, and Summer Camps" 
					content="Whether you're a beginner eager to learn the basics or an experienced sewer looking to refine your skills, Erato's sewing events offer something for everyone. Our workshops and classes cover a range of topics, from mastering the fundamentals of sewing to exploring advanced techniques. Plus, our summer camps provide an immersive experience for young creatives to dive into the world of sewing in a fun and supportive environment. Join us and let Erato inspire your creativity with every stitch."
					buttonText="Upcoming Sewing Events"
				/>

			</PageSection>
		</>
	);
}
