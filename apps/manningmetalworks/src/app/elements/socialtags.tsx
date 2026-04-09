"use client";

import React from "react";
import { PageSection, PageGridItem } from "@pixelated-tech/components";
import { Callout } from "@pixelated-tech/components";
import { PageSectionHeader } from "@pixelated-tech/components";


export default function SocialTags() {
	return (
		<>
			<PageSectionHeader url="" title="Follow us on Social Media" />
			<PageSection id="socialtag-section" maxWidth="512px" columns={8} padding={"0px"}>
				<PageGridItem>
					<Callout variant="full" imgShape="squircle" layout="vertical" 
						url="http://blog.manningmetalworks.com" 
						img="/images/icons/blog-icon.jpg" imgAlt="Manning Metalworks Blog" />
				</PageGridItem>
				<PageGridItem>
					<Callout variant="full" imgShape="squircle" layout="vertical" 
						url="https://share.google/pGMYPWPjF1E6KIsw3" 
						img="/images/logos/google-business.png" imgAlt="Google Business" />
				</PageGridItem>
				<PageGridItem>
					<Callout variant="full" imgShape="squircle" layout="vertical" 
						url="https://www.linkedin.com/in/tim-manning-89736430a/" 
						img="/images/logos/linkedin-logo.png" imgAlt="LinkedIn" />
				</PageGridItem>
				<PageGridItem>
					<Callout variant="full" imgShape="squircle" layout="vertical" 
						url="https://www.facebook.com/p/Manning-Metalworks-LLC-61572722814701/" 
						img="/images/logos/facebook-logo.png" imgAlt="Facebook" />
				</PageGridItem>
				<PageGridItem>
					<Callout variant="full" imgShape="squircle" layout="vertical" 
						url="https://www.instagram.com/manning.metalworks/" 
						img="/images/logos/instagram-logo.jpg" imgAlt="Instagram" />
				</PageGridItem>
				<PageGridItem>
					<Callout variant="full" imgShape="squircle" layout="vertical" 
						url="http://x.com/ManningMetalworks" 
						img="/images/logos/twitter-logo.png" imgAlt="Twitter" />
				</PageGridItem>
				<PageGridItem>
					<Callout variant="full" imgShape="squircle" layout="vertical" 
						url="https://www.yelp.com/user_details?userid=andHa8MtqORJtmY9rHnxHg" 
						img="/images/logos/yelp-logo.png" imgAlt="Yelp" />
				</PageGridItem>
				<PageGridItem>
					<Callout variant="full" imgShape="squircle" layout="vertical" 
						url="https://nextdoor.com/page/manning-metalworks/" 
						img="/images/logos/nextdoor-logo.png" imgAlt="Nextdoor" />
				</PageGridItem>
			</PageSection>
        
		</>
	);
}