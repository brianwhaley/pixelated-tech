"use client";

import React from 'react';
import { PageTitleHeader, PageSectionHeader } from "@pixelated-tech/components";
import { PageSection, PageGridItem } from "@pixelated-tech/components";
import { Timeline } from "@pixelated-tech/components";
import * as CalloutLibrary from "@/app/elements/calloutlibrary";

export default function Process() {
    
	const timelineData = [
		{ 
			title: "Gather Information",
			content: `Connect directly with you, find out what is working, what is not.
				What do you wish you could spend less time doing? 
				What would make your company more efficient?
				What would make your customers happier with your service?
				Once we identify these, we can put together a Strategy tailored just for you.`,
			image: "https://images.ctfassets.net/ank9sh265hdu/5XgHOMu72QUfFMAhkOLfU1/f16cdeabc17c469abc069e53a46a41c1/gatherinfo.jpg",
			direction: "left"
		},{ 
			title: "Build our Strategy",
			content: `Document and share a plan that includes all the information we gathered.
				It will also include an ananlysis of your competitors, 
				technology recommendations for search engine optimization, 
				review metrics of success and how they will be gathered, 
				how to manage advertising and marketing (digital and traditional media)
				and a social media analysis and plan. `,
			image: "https://images.ctfassets.net/ank9sh265hdu/1gWegHALiGvQH7NFTMJINr/fa72bf8c2c2c2c2794873b92edaf0d60/strategy.jpg",
			direction: "right"
		},{ 
			title: "Implement",
			content: `This is where the action happens.
				We will break down the details of the strategy to implement the plan.
				Out objective here is to improve the results for the customer and 
				make the health of your company and its colleagues a better place to work.`,
			image: "https://images.ctfassets.net/ank9sh265hdu/3DaUlxH944SaV9eKc4Rczz/1da7074d3128b742220aadf81f9aaf47/implement.jpg",
			direction: "left"
		},{ 
			title: "Measure Outcomes",
			content: `It is important to know where you are, and where you want to be, 
			to come up with a plan on how to get there. The right measurements will show how 
			Pixelated Technologies is helping your customers and you achieve the right outcomes.  `,
			image: "https://images.ctfassets.net/ank9sh265hdu/2apidqKAlX0zqOi4rjWF6B/ff5fd0ccedc4f4e2c9a9c297613e6cc9/measure.jpg",
			direction: "right"
		},{ 
			title: "Refine Results",
			content: `Once the results start coming in, we may need to make adjustments.  
			Advertise in different social media outlets, target a different geographic area, 
			measure different outcomes, or change the strategy.  Small and simple changes
			will put you right back on course.`,
			image: "https://images.ctfassets.net/ank9sh265hdu/6DAZzOPVsjhmOgPlVsDf2M/fc7fdacc019cc6323f7d7aea975f6e9e/refine.jpg",
			direction: "left"
		},{ 
			title: "Support",
			content: `Once the Digital and Social Media Machine is working for you, 
				we will continue to support you and your customers with the latest technology and
				updates to keep you on course.  We can help you expand your content, 
				create posts for social media, and help you expand your marketing into new areas. `,
			image: "https://images.ctfassets.net/ank9sh265hdu/6DUJ0EgW0h0eTdf2WCP4l/227ae1da08f42a96752834453869352a/support.jpg",
			direction: "right"
		}
	];

	return (
		<>
			<PageTitleHeader title="The Pixelated Technologies Process" />
			<PageSection columns={1} maxWidth="1024px" id="process-overview-section">
				<PageGridItem>
					<p>
					Pixelated Technologies offers a proven process
					to get results for you and your customers - gather information,
					build a strategy, implement, measure outcomes,
					refine results, and support.
					</p>
					<p>
					Our process is designed to ensure that every step is tailored to your unique needs.  We start by understanding your business challenges and goals, then craft a strategy that aligns with your vision. By implementing this strategy with precision and measuring the outcomes, we ensure that you see tangible results. Finally, we refine and support your journey to ensure long-term success.
					</p>
					<p>
					Whether you are looking to optimize your operations, enhance customer satisfaction, or stay ahead of the competition, our proven process will guide you every step of the way. Let us help you transform your business and achieve your goals with confidence.
					</p>
				</PageGridItem>
			</PageSection>



			<PageSection columns={1} maxWidth="100%" id="process-timeline-section">
				<Timeline timelineData={timelineData} />
			</PageSection>


			<PageSectionHeader title="Let's Get Started!" />
			<PageSection columns={12} id="process-schedule-section">
				<PageGridItem columnStart={2} columnEnd={12}>
					<CalloutLibrary.scheduleAppointment
						variant='boxed grid'
						gridColumns={{ left: 1, right: 2 }}
						layout='horizontal' />
				</PageGridItem>
			</PageSection>
		</>
	);
}
