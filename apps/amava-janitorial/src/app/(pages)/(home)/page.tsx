"use client"; 

import React from 'react';
import { PageSection, PageTitleHeader, PageSectionHeader, PageGridItem } from '@pixelated-tech/components';
import { buildServiceUrl, usePixelatedConfig } from '@pixelated-tech/components';
import { Callout } from '@pixelated-tech/components';
import { PageHero } from '../../elements/page-hero';
import { BlogPostList } from '@pixelated-tech/components';


export default function Home() {
	const pixelatedConfig = usePixelatedConfig();
	const services = pixelatedConfig?.siteInfo?.services ?? [];
	return (
		<>

			<PageHero />

			<PageSection columns={1} maxWidth="1024px" padding="20px" id="header-section">
				<PageTitleHeader title="AMAVA Janitorial" />
				<PageSectionHeader>Welcome to AMAVA Janitorial</PageSectionHeader>
				<p>For over three decades, AMAVA Janitorial has served as a trusted partner in commercial facility maintenance across New Jersey, New York, Connecticut, South Carolina, and Florida. Holding an A+ rating from the Better Business Bureau, our team takes the complete burden of daily sanitation off your shoulders so you can focus on running your business. AMAVA Janitorial delivers custom cleaning programs for corporate offices, medical clinics, educational campuses, industrial sites, and hospitality venues. Utilizing our proven 7-step cleaning methodology, we guarantee that no operational detail is ever overlooked during scheduled service visits. Our flexible seven-service ecosystem covers nightly janitorial work, day porter care, commercial floor restoration, specialty cleaning, post-construction cleanup, consumable supply management, and handyman repairs. Operating 24 hours a day, 7 days a week, our dedicated account supervisors conduct regular quality audits to ensure complete compliance across every square foot of your building. Partnering with AMAVA Janitorial gives you total operational peace of mind and an immaculate facility that reflects the high standards of your organization.</p>
			</PageSection>

			<PageSection columns={4} maxWidth="1024px" gap="20px" id="home-services-section">
				<PageGridItem columnStart={1} columnEnd={-1} >
					<PageSectionHeader title="Our Services" />
				</PageGridItem>
            
				{services.map((service: any, index: number) => (
					<PageGridItem key={service.name ?? index}>
						<Callout
							layout="vertical"
							subtitle={service.name}
							img={service.image}
							imgAlt={service.name}
							imgShape="bevel"
							url={buildServiceUrl(service, "/services")}
						/>
					</PageGridItem>
				))}
			</PageSection>



                        
			<PageSection id="recent-blog-section" columns={1} >
				<PageSectionHeader title="Read Our Most Recent Blog Post" />
				<BlogPostList count={1} showCategories={false}  />
			</PageSection>
            


			<PageSection columns={1} maxWidth="1024px" gap="20px" id="home-quality-section">
				<PageSectionHeader title="Our Quality Commitment" />
				<p>
					At AMAVA, we pride ourselves on our ability to take the burden of cleaning and general building maintenance off the shoulders of our clients so that they can focus completely on their businesses. Our mission is to provide our clients with cleaning and building maintenance solutions of the highest quality.	And that is exactly what we are promising you. We are totally committed to providing you with 100% customer satisfaction; we strive to surpass even your own high standard. We are “Your Partner in Custodial Maintenance.” 
				</p>
			</PageSection>

			<PageSection columns={1} maxWidth="1024px" id="home-assessment-section" background="var(--accent1-color)">
				<Callout
					variant='boxed grid'
					layout='horizontal'
					url='/contact' 
					boxShape="square"
					img="https://images.ctfassets.net/syybqad2lwuh/3T2nZHFEm9GmhkUFfb9ar7/08aadced1ef23c4298dcd5c7ce12ab1a/schedule-assessment.jpg?fm=webp"
					imgShape="square"
					title='Schedule Your Free Assessment'
					content="Contact our team today to schedule your comprehensive, no-obligation facility assessment tailored specifically to your building's footprint and operational schedule. We will walk your space, identify your exact operational requirements, and deliver a custom, cost-effective service proposal with zero commitment required.  We make evaluating your commercial property needs completely simple, seamless, and stress-free."
				/>
			</PageSection>
            
		</>
	);
}
 