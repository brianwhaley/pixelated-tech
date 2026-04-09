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
						url="http://blog.thethreemusesofbluffton.com" 
						img="/images/icons/blog-icon.jpg" imgAlt="The Three Muses Blog" />
				</PageGridItem>
				<PageGridItem>
					<Callout variant="full" imgShape="squircle" layout="vertical" 
						url="https://share.google/9lFACNtB6CpmrpO29" 
						img="/images/logos/google-business.png" imgAlt="Google Business" />
				</PageGridItem>
				<PageGridItem>
					<Callout variant="full" imgShape="squircle" layout="vertical" 
						url="https://www.linkedin.com/in/katie-coupland-013044212/" 
						img="/images/logos/linkedin-logo.png" imgAlt="LinkedIn" />
				</PageGridItem>
				<PageGridItem>
					<Callout variant="full" imgShape="squircle" layout="vertical" 
						url="https://www.facebook.com/p/The-Three-Muses-of-Bluffton-61585497461529/" 
						img="/images/logos/facebook-logo.png" imgAlt="Facebook" />
				</PageGridItem>
				<PageGridItem>
					<Callout variant="full" imgShape="squircle" layout="vertical" 
						url="https://www.instagram.com/thethreemusesofbluffton/" 
						img="/images/logos/instagram-logo.jpg" imgAlt="Instagram" />
				</PageGridItem>
				<PageGridItem>
					<Callout variant="full" imgShape="squircle" layout="vertical" 
						url="http://x.com/" 
						img="/images/logos/twitter-logo.png" imgAlt="Twitter" />
				</PageGridItem>
				<PageGridItem>
					<Callout variant="full" imgShape="squircle" layout="vertical" 
						url="https://www.yelp.com/" 
						img="/images/logos/yelp-logo.png" imgAlt="Yelp" />
				</PageGridItem>
				<PageGridItem>
					<Callout variant="full" imgShape="squircle" layout="vertical" 
						url="https://nextdoor.com/" 
						img="/images/logos/nextdoor-logo.png" imgAlt="Nextdoor" />
				</PageGridItem>
			</PageSection>
        
		</>
	);
}