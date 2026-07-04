"use client"; 

import React from 'react';
import { PageTitleHeader, PageSection, PageSectionHeader, PageGridItem } from '@pixelated-tech/components';
import *  as componentLibrary from '../../elements/componentlibrary';
import { Callout } from '@pixelated-tech/components';

export default function SewingPage() {
	return (
		<>
			<PageSection columns={1} maxWidth="100%" id="sewing-section">
				<PageTitleHeader title="The Three Muses of Bluffton Sewing Studio" />
				<div>
					<p>
						Our Sewing Studio is a vibrant creative hub where the foundational art of needlework is passed to a new generation. Our professional classroom is equipped with high-quality machines and tools to transform fabric into wearable art. We offer a diverse calendar of events for all skill levels, from absolute beginners to advanced sewists. Students can progress at their own pace under expert guidance through workshops focused on practical skills, upcycling, and home decor. More than just a place of instruction, our studio is a community space where the rhythmic hum of the machine inspires confidence and a lifelong passion for sewing.
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
				<componentLibrary.UpcomingSewingEvents />
			</PageSection>


			<PageSection columns={1} maxWidth="1024px" id="events-section">
				<PageGridItem columnSpan={3}>
					<PageSectionHeader title="FLASH SALE" />
				</PageGridItem>
				
				<Callout    
					variant="boxed grid"
					layout="horizontal"
					direction="left"
					gridColumns={{ left: 1, right: 3 }}
					img="https://images.ctfassets.net/luf8eony1687/15pvidpP6Jw3bbpvbD5uIB/f33972e0a6f4acff439c3cda70119318/bernette_b38_front_yaya_han_dd9fa5d7-919b-4639-baad-420adaaba4fa.webp"
					url="/events"
					title="Bernette b38 Yaya Han Special Edition Sewing Machines"
					content="This limited-edition machine, a collaboration between Bernette and legendary cosplayer Yaya Han, was designed as the ultimate enabling partner, balancing functional power with high-end creative inspiration. Each of these nine (9) lightly-used machines arrives packed with its core premium features, including Premium Stitches, Automatic Conveniences, and Essential Accessories.  These machines are available for a limited time only, and we expect them to sell out quickly."
					buttonText="Shop Now"
				/>
			</PageSection>

		</>
	);
}
