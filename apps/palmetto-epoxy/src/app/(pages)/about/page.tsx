"use client";

import React from "react";
import * as CalloutLibrary from "@/app/elements/calloutlibrary";
import { Callout } from "@pixelated-tech/components";
import { PageSection, PageGridItem } from "@pixelated-tech/components";

export default function About() {
	return (
		<>
			<CalloutLibrary.PageTitle title="About Us" />
		
			<PageSection columns={12} id="aboutus-section">
				<PageGridItem columnStart={3} columnEnd={11}>
					<Callout
						title="About Palmetto Epoxy" 
						img='/images/dennis-and-martha-aberle.jpg' 
						aboveFold={true}
						imgShape='bevel' 
						imgAlt="Dennis and Martha Aberle of Palmetto Epoxy" 
						subtitle='The Palmetto Epoxy team is made up of the dynamic duo of Dennis and Martha Aberle, 
									and together, we&#39;re committed to making sure our customers are always satisfied. 
									We believe that the key to great flooring is all about the details, 
									and we don&#39;t cut corners when it comes to our installations. 
									We&#39;re all about quality products, meticulous workmanship, 
									and unmatched customer service.'
						content=''
						layout='vertical' />
				</PageGridItem>
			</PageSection>

			<PageSection columns={1} id="lowcountrysbest-section">
				<CalloutLibrary.LowCountrysBest />
			</PageSection>



			<CalloutLibrary.AllPartners />



			<PageSection columns={1} className="section-bluechip" id="contact-section">
				<CalloutLibrary.ContactCTA />
			</PageSection>
		</>
	);
}
