"use client";

import React from 'react';
import { PageSection, PageTitleHeader, PageSectionHeader, PageGridItem } from '@pixelated-tech/components';
import { Callout, buildServiceUrl, usePixelatedConfig } from '@pixelated-tech/components';
import { BlogPostList } from '@pixelated-tech/components';

export default function Home() {
	const pixelatedConfig = usePixelatedConfig();
	const services = pixelatedConfig?.siteInfo?.services ?? [];
	return (
		<>

			<PageSection columns={1} maxWidth="1024px" id="header-section">
				<PageTitleHeader title="GEA Construction" />
			</PageSection>


			<PageSection columns={1} maxWidth="1024px" id="home-promise-section">
				<PageSectionHeader>The GEA Construction Commitment:<br />Quality Craftsmanship Built to Last, Built Around You.</PageSectionHeader>

				<p>Welcome to GEA Construction. </p>

				<p>Your home is your biggest investment, and GEA Construction treats it that way. Whether we are remodeling a kitchen, updating a bath, or updating all your windows, our focus is simple: deliver clean, durable work without the hassle or headaches. GEA Construction takes the time up front to understand your goals, walk through every detail of the scope, and ensure you feel completely confident in the plan before a single tool hits the job site.</p>

				<p>We show up on time, keep our job sites spotless, and communicate clearly from the initial estimate to the final inspection. The GEA Construction team takes care of all the behind-the-scenes logistics—including local building permits and HOA review board approvals—so you never have to worry about administrative delays. No shortcuts, no guesswork—just solid construction, honest trade practices, and reliable results you can count on for years to come.</p>
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


			<PageSection id="home-blog-section" columns={1} >
				<PageSectionHeader title="Read Our Most Recent Blog Post" />
				<BlogPostList count={1} showCategories={false} />
			</PageSection>
            

			<PageSection columns={1} maxWidth="1024px" id="realtor-partner-section">
				<PageGridItem columnStart={1} columnEnd={-1} >
					<PageSectionHeader title="Welcome Realtors & New Homeowners" />
				</PageGridItem>

				<p>A real estate transaction shouldn't get stalled by a demanding inspection punch list or delayed closing repairs. GEA Construction partners directly with local real estate agents, buyers, and sellers across the Lowcountry to clear out inspection items, tackle larger repairs, and execute full home updates on strict timelines. Whether your deal requires targeted wood rot repair, bathroom updates, or window installations, we deliver rapid, itemized estimates that keep negotiations moving and keep your closing date firmly on track.</p>

				<p>For buyers, completing renovations before moving furniture inside an empty home is the easiest, cleanest way to remodel. GEA Construction conducts pre-closing walkthroughs to lock in scope, secure municipal building permits, and pre-order materials early so our crew can hit the ground running the moment you get the keys. From managing daily job site dust to maintaining clear communication with both agents and owners, we take the friction out of real estate repairs — giving agents a trusted trade partner and buyers a seamless transition into their new home.</p>
			</PageSection>


			<PageSection columns={1} maxWidth="1024px" id="realtor-partner-section">
				<Callout
					variant='boxed grid'
					layout='horizontal'
					url='/contact' 
					boxShape="square"
					img='https://images.ctfassets.net/6ewno74sai9a/57HS2y1ykJkYyQ2oIYBPkj/08bb7c0f62b146416783795c7cfbb6fe/building-inspector-real-estate-agent-with-clipboard-front-new-home-concept-home-inspection-real-estate-property-appraisal-co.jpg?fm=webp'
					imgShape="square"
					title='Schedule Your Free Assessment'
					content='GEA Construction provides free, no-obligation assessments for all your home improvement needs. Schedule a time to meet with our team and discuss your project goals, budget, and timeline. Our team from GEA Construction will provide a detailed estimate, focused on your requirements and top notch quality, and answer any questions you may have about the process.' 
				/>
			</PageSection>

			

		</>
	);
}
