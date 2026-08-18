"use client";

import React from 'react';
import { PageTitleHeader, PageSectionHeader, PageSection } from '@pixelated-tech/components';
import { Timeline } from '@pixelated-tech/components';
import { Callout } from '@pixelated-tech/components';
import { FormEngine } from "@pixelated-tech/components";
import formData from "@/app/data/partnerform.json";

export default function RealtorPartnerProgramPage() {

	const timelinedata = [ 
		{
			"title": "Step 1: Submit a Request",
			"content": "Connect Us With Your Client: Send us an inspection report or introduce your buyers prior to closing.",
			"image": "https://images.ctfassets.net/6ewno74sai9a/57HS2y1ykJkYyQ2oIYBPkj/08bb7c0f62b146416783795c7cfbb6fe/building-inspector-real-estate-agent-with-clipboard-front-new-home-concept-home-inspection-real-estate-property-appraisal-co.jpg?fm=webp",
			"direction": "left"
		},{
			"title": "Step 2: Rapid Estimate & Work",
			"content": "We Handle the Scope: We conduct a fast property walkthrough, deliver an itemized quote, and lock in the schedule.",
			"image": "https://images.ctfassets.net/6ewno74sai9a/2NBOF9W9oENpx9IAhhykla/d59b3809418a3d78ddd01cc58102ebb7/close-up-repairman-uniform-standing-home-kitchen-holding-his-tool-bag.jpg?fm=webp",
			"direction": "right"
		},{
			"title": "Step 3: Smooth Transition to Closing",
			"content": "We complete the work on time, protect the space, and leave the property ready for keys or final walkthroughs.",
			"image": "https://images.ctfassets.net/6ewno74sai9a/XeXBPYBVCho5s247sKuQt/54e647e8d4e5e8ff06d56d146e10cd20/sold-home-sale-sign-front-new-house.jpg?fm=webp",
			"direction": "left"
		}
	];

	return (
		<>
			<PageTitleHeader title="Partner with GEA Construction" />
			<br />
			<PageSection columns={1} maxWidth="1024px" id="partners-section">

				<PageSectionHeader title="Keep Your Closings on Track & Deliver More Value to Your Clients" />
				<p>As a Lowcountry real estate professional, your business relies on speed, trust, and flawless execution. When inspection reports highlight repair items days before a closing—or when a buyer wants to personalize a home before moving in—you need a general contractor who responds fast, works cleanly, and gets the job done right the first time.  GEA Construction is proud to partner with top-producing real estate agents across Beaufort and Jasper counties. We serve as an extension of your team, providing priority service, fast turnaround times, and clear communication so you can close deals with total confidence.</p>

				<PageSectionHeader title="Why Local Realtors Partner with GEA Construction" />
				<ul>
					<li>Priority Response & Fast Estimates: We prioritize agent requests, turning around clear, line-item repair quotes within 24–48 hours to keep your closing timeline intact.</li>
					<li>10% Pre-Move-In Client Discount: Give your buyers an exclusive 10% discount on labor for any remodeling or repair project contracted prior to move-in.</li>
					<li>One Single Point of Contact: Instead of calling four different subcontractors, rely on one licensed and insured general contractor to handle everything from minor repairs to major overhauls.</li>
					<li>Job Site Care & Transparency: We treat every property with total respect, using dust containment barriers and floor protection to keep homes pristine for walkthroughs.</li>
				</ul>

				<PageSectionHeader title="How We Support Your Listings & Buyers" />
				<p>Whether you are helping a seller navigate an inspection response or guiding a buyer through pre-move-in updates, GEA Construction delivers expert trade solutions across our four core service pillars.</p>

				<PageSection columns={2} maxWidth="100%" id="partners-services-section">

					<Callout
						subtitle="Handyman & Inspection Punch List Repairs" >
						<p>Fast, reliable repair execution engineered specifically to save real estate transactions.</p>
						<br />
						<p>When a home inspection report threatens to stall a closing, our handyman and repair branch moves fast. We specialize in resolving real estate punch lists accurately and efficiently so your property passes re-inspection without delay.</p>
					</Callout>

					<Callout subtitle="Kitchen & Bathroom Remodeling" >
						<p>Transform dark, outdated spaces into high-ROI selling points.</p>
						<br />
						<p>Help your clients unlock maximum equity or customize their dream space. We handle complete kitchen transformations, including open-concept wall removals, custom cabinetry, quartz and granite countertops, tile backsplashes, and modern task lighting—executed on strict 3-to-5-week construction timelines.</p>
					</Callout>

					<Callout subtitle="Bathroom Remodeling">
						<p>Turn tired powder rooms and master baths into luxury spa retreats.</p>
						<br />
						<p>From quick guest bath face-lifts to complete master suite modernizations, we deliver fully waterproofed custom tile showers, tub-to-shower conversions, frameless glass enclosures, and vanity upgrades that add instant market value to any Lowcountry property.</p>
					</Callout>

					<Callout subtitle="Doors & Windows Replacement">
						<p>Boost energy efficiency, coastal storm resilience, and curb appeal.</p>
						<br />
						<p>A critical upgrade for older homes facing high energy bills or coastal weather. We install high-performance, impact-rated replacement windows and exterior doors, complete with rot-resistant composite frames, custom interior casing, and leak-proof flashing.</p>
					</Callout>
                    
				</PageSection>

				<PageSectionHeader>How the Program Works</PageSectionHeader>

				<p>The GEA Construction Realtor Partner three-step process ensures a seamless experience for both realtors and their clients.  Our objective is to provide top-notch remodeling services while maintaining clear communication and timely project completion.  The GEA Construction Team is committed to delivering exceptional results at every stage.</p>
               
				<Timeline timelineData={timelinedata} />

				<PageSectionHeader>Join Our Preferred Realtor Network Today</PageSectionHeader>

				<p>Ready to give your clients a reliable contractor advantage? Fill out the brief form below to register as a GEA Construction Realtor Partner and start offering your clients priority scheduling and exclusive pre-move-in savings.</p>

				<PageSectionHeader>Realtor Partner Registration Form</PageSectionHeader>
				<FormEngine formData={formData as any} />

			</PageSection>
		</>
	);
}
