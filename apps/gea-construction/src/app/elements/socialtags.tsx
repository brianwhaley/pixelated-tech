"use client";

import React from "react";
import { PageSection, PageGridItem } from "@pixelated-tech/components";
import { Callout } from "@pixelated-tech/components";
import { PageSectionHeader } from "@pixelated-tech/components";


export default function SocialTags() {
	return (
		<>
			<PageSectionHeader url="" title="Follow us on Social Media" />
			<PageSection id="socialtag-section" columns={8} padding={"0px"}>
				<PageGridItem>
					<Callout variant="full" imgShape="square" layout="vertical" 
						url="http://blog.oaktree-landscaping.com" 
						img="/images/icons/blog-icon.jpg" imgAlt="Oaktree Landscaping Blog" />
				</PageGridItem>
				<PageGridItem>
					<Callout variant="full" imgShape="square" layout="vertical" 
						url="https://share.google/DQWYZ0XO8H2zXA7bh" 
						img="/images/logos/google-business.png" imgAlt="Google Business" />
				</PageGridItem>
				<PageGridItem>
					<Callout variant="full" imgShape="square" layout="vertical" 
						url="https://www.linkedin.com/in/oaktree-landscaping/" 
						img="/images/logos/linkedin-logo.png" imgAlt="LinkedIn" />
				</PageGridItem>
				<PageGridItem>
					<Callout variant="full" imgShape="square" layout="vertical" 
						url="https://www.facebook.com/profile.php?id=61563317225268" 
						img="/images/logos/facebook-logo.png" imgAlt="Facebook" />
				</PageGridItem>
				<PageGridItem>
					<Callout variant="full" imgShape="square" layout="vertical" 
						url="https://www.instagram.com/oaktreelandscaper" 
						img="/images/logos/instagram-logo.jpg" imgAlt="Instagram" />
				</PageGridItem>
				<PageGridItem>
					<Callout variant="full" imgShape="square" layout="vertical" 
						url="http://x.com/OaktreeLndscape" 
						img="/images/logos/twitter-logo.png" imgAlt="Twitter" />
				</PageGridItem>
				<PageGridItem>
					<Callout variant="full" imgShape="square" layout="vertical" 
						url="https://www.yelp.com/user_details?userid=andHa8MtqORJtmY9rHnxHg" 
						img="/images/logos/yelp-logo.png" imgAlt="Yelp" />
				</PageGridItem>
				<PageGridItem>
					<Callout variant="full" imgShape="square" layout="vertical" 
						url="https://nextdoor.com/page/oaktree-landscaping-1/" 
						img="/images/logos/nextdoor-logo.png" imgAlt="Nextdoor" />
				</PageGridItem>
			</PageSection>
        
		</>
	);
}