"use client";

import React from "react";
import { PageTitleHeader, PageSection, PageSectionHeader, PageGridItem } from "@pixelated-tech/components";
import { Callout } from "@pixelated-tech/components";

export default function PricingPage() {
	
    
	return (
		<>

			<PageTitleHeader title="Simple Day Concierge Pricing" />


			<PageSection columns={2} maxWidth="1024px" padding="20px" id="services-pricing-section">
				<PageGridItem columnStart={1} columnEnd={-1} >
					<PageSectionHeader title="Services" />
				</PageGridItem>
				<Callout
					layout="vertical"
					subtitle="Standard Services"
					img="https://images.ctfassets.net/jc3fkpb2sdyr/6INOdbNGSacFzQz2CU2cQQ/c18d9924a57d603700ba4bbcafd66722/young-woman-buys-groceries-supermarket-with-phone-her-hands.jpg?fm=webp"
					imgAlt="Simple Day Concierge Standard Services"
					imgShape="bevel">
					<p>Our Standard Services focus on the essential administrative, logistical, and daily tasks that keep your personal life moving smoothly. These tasks are typically transactional or task-oriented, relying on streamlined execution, scheduling, and standard routine management. They are priced competitively to offer everyday efficiency and time relief.</p>
					<ul>
						<li>Companion and Wellness Care</li>
						<li>Errand Running and Logistics</li>
						<li>Personal Shopping and Grocery Provisioning</li>
						<li>Appointment Scheduling and Calendar Management</li>
						<li>Family and Moms Helper Support</li>
					</ul>
					<PageSectionHeader>$55/hr</PageSectionHeader>
					<p style={{fontSize: 'var(--font-size5)'}}>Our Standard Services require a 2 hour minimum.  Call us for a personalized quote.</p>
				</Callout>
				<Callout
					layout="vertical"
					subtitle="Premium Services"
					img="https://images.ctfassets.net/jc3fkpb2sdyr/3vPKTDxLW6FjpOmkogtp8I/100fbc603f459bea86f5b5ac210feae7/grandma-is-my-best-friend.jpg?fm=webp"
					imgAlt="Simple Day Concierge Premium Services"
					imgShape="bevel">
					<p>Our Premium Services involve a higher level of dedicated, on-site presence, specialized coordination, or prolonged estate-level oversight. These offerings are categorized as premium because they require extended time commitments, meticulous attention to high-value details, customized care, or the handling of complex residential systems (such as utilities and electronics) that demand the absolute highest trust.</p>
					<ul>
						<li>Home Wait Services and Delivery Sitting</li>
						<li>Meal Preparation and Kitchen Support</li>
						<li>Home and Closet Organization</li>
						<li>Vacation Return Provisioning & Prep</li>
						<li>Private Event Planning & Administration</li>
					</ul>
					<PageSectionHeader>$75/hr</PageSectionHeader>
					<p style={{fontSize: 'var(--font-size5)'}}>Our Premium Services require a 2 hour minimum.  Call us for a personalized quote.</p>
				</Callout>
			</PageSection>


			<PageSection columns={2} maxWidth="1024px" padding="20px" id="packages-pricing-section">
				<PageGridItem columnStart={1} columnEnd={-1} >
					<PageSectionHeader title="Packages" />
				</PageGridItem>
				<Callout
					layout="vertical"
					subtitle="Starter Package"
					img="https://images.ctfassets.net/jc3fkpb2sdyr/5zKFSzRKz7gdl1ObdNpJsg/027a572670e61936fcd941eb58a6fef9/black-entrepreneur-walking-into-living-room-with-laptop.jpg?fm=webp"
					imgAlt="Simple Day Concierge Starter Package"
					imgShape="bevel">
					<p>Our Starter Package is designed for clients who want to experience the benefits of our services with a smaller time commitment. This package is ideal for those who have occasional needs or want to try out our offerings before committing to a larger package. It provides access to our Standard Services at a discounted rate, allowing you to enjoy the convenience and support of Simple Day Concierge without a long-term commitment.</p>
					<ul>
						<li>8 hours of Standard Services</li>
						<li>2 hours per week, or 4 hours every other week</li>
						<li>Discounted rate for Standard Services</li>
					</ul>
					<PageSectionHeader>$399</PageSectionHeader>
					<p style={{fontSize: 'var(--font-size5)'}}>Call us for a personalized quote.</p>
				</Callout>
				<Callout
					layout="vertical"
					subtitle="Premium Package"
					img="https://images.ctfassets.net/jc3fkpb2sdyr/5tpEzcxrelrQs13KFwZdmK/7f9edaec71cf72bae10c57b706d329d6/medium-shot-woman-kid-cooking-together.jpg?fm=webp"
					imgAlt="Simple Day Concierge Premium Package"
					imgShape="bevel">
					<p>Our Premium Package is tailored for clients who require a more comprehensive level of support and want to take full advantage of our Premium Services. This package offers a significant number of hours at a discounted rate, making it an excellent choice for those with ongoing needs or who want to ensure they have access to our most specialized offerings. With the Premium Package, you can enjoy the highest level of care and attention from our team while benefiting from cost savings on our premium service rates.</p>
					<ul>
						<li>8 hours of Premium Services</li>
						<li>2 hours per week, or 4 hours every other week</li>
						<li>Discounted rate for Premium Services</li>
					</ul>
					<PageSectionHeader>$559</PageSectionHeader>
					<p style={{fontSize: 'var(--font-size5)'}}>Call us for a personalized quote.</p>
				</Callout>
			</PageSection>


			<PageSection columns={1} maxWidth="1024px" padding="20px" id="subscriptions-pricing-section">

				<PageSectionHeader title="Membership Benefits" />

				<p>Becoming a monthly member of Simple Day Concierge unlocks an elite level of personalized lifestyle support for your household. As a dedicated subscriber, you receive a significant number of hours at a blended and discounted rate across standard and premium services, first-choice calendar placement and priority scheduling, ensuring our trusted team is available precisely when your schedule demands it. Membership delivers premium perks, including significant discounts on bulk hour pricing, waived minimums, and early access to all our newly launched service offerings. Members also enjoy streamlined, direct communication for immediate checklist updates and last-minute errand adjustments.</p>

				<PageSectionHeader title="Membership Subscriptions" />

				<Callout
					variant="boxed grid"
					gridColumns={{left: 1, right: 3}}
					layout="horizontal"
					direction="left"
					title='"Simplicity" Membership'
					img="https://images.ctfassets.net/jc3fkpb2sdyr/6INOdbNGSacFzQz2CU2cQQ/c18d9924a57d603700ba4bbcafd66722/young-woman-buys-groceries-supermarket-with-phone-her-hands.jpg?fm=webp"
					imgAlt="Simple Day Concierge Premium Package"
				>
					<p>Best For Commuters, busy couples, or independent seniors who need consistent, light lifestyle maintenance to keep their weeks on track. This tier provides for a weekly 1.5-hour grocery provisioning trip, plus a few hours left over for calendar management or dry-cleaning errands.  The blended rate drops to $54/hour - a savings of over $200 compared to à la carte premium rates.</p>
					<PageSectionHeader>10 Hours - $539/month</PageSectionHeader>
				</Callout>

				<Callout
					variant="boxed grid"
					gridColumns={{left: 3, right: 1}}
					layout="horizontal"
					direction="right"
					title='"Peace of Mind" Membership'
					img="https://images.ctfassets.net/jc3fkpb2sdyr/39jOf3QhCL5Jcj2tHqFaq3/1f36f146ef47c8747bedc4d668a87d3e/young-caucasian-woman-signing-document-while-middle-aged-caucasian-man-observing.jpg?fm=webp"
					imgAlt="Simple Day Concierge Premium Package"
				>
					<p>Designed for active families managing chaotic school, sports, and home repair schedules simultaneously. Typical Monthly Use includes hours a week of family helper/playroom organizing support, a monthly 4-hour contractor home-wait window, and weekly meal-prep support. The blended rate drops to $52/hour, a savings of over $450 compared to à la carte premium rates.</p>
					<PageSectionHeader>20 Hours - $1,039/month</PageSectionHeader>
				</Callout>

				<Callout
					variant="boxed grid"
					gridColumns={{left: 1, right: 3}}
					layout="horizontal"
					direction="left"
					title='"Estate Lifestyle" Membership'
					img="https://images.ctfassets.net/jc3fkpb2sdyr/57IkyE1RS9JucjVbteOoJe/14f3dad033769f6af6dce9c603a11080/table-with-white-tablecloth-candles.jpg?fm=webp"
					imgAlt="Simple Day Concierge Premium Package"
				>
					<p>Targeting career oriented individuals, busy executives, or large properties requiring an ongoing, highly active local proxy.  Typical services include daily errand running, comprehensive digital or closet organization projects, vacation return prep, and private event administrative oversight.  The blended rate drops to $50/hour, providing a savings of $1,000 compared to à la carte premium rates.</p>
					<PageSectionHeader>40 Hours - $1,999/month</PageSectionHeader>
				</Callout>

				<p style={{fontSize: 'var(--font-size5)'}}>Membership Tiers require a minimum commitment of 3 months. Call us for a personalized quote.</p>

			</PageSection>


		</>
	);
}
