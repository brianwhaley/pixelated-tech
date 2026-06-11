"use client";

import React from 'react';
import { PageTitleHeader, PageSection, Services } from '@pixelated-tech/components';

export default function ServicesPage() {

	return (
		<>
			<PageTitleHeader title="Our Services" />
			<PageSection columns={1} maxWidth="1024px" id="services-intro">
				<p>
					Simple Day Concierge offers a wide range of services designed to make your life easier and more enjoyable. From personal errands and home management to event planning and travel arrangements, we are here to help you with the tasks that take up your valuable time. Our team of experienced professionals is dedicated to providing personalized service tailored to your unique needs and preferences. Whether you need assistance with daily chores, special occasions, or anything in between, we are committed to delivering exceptional service that exceeds your expectations.
				</p>
			</PageSection>

			<Services 
				title="Summary of Our Services"
				intro="Click a service to read more about how it works for your business."
				variant="grid"
				boxShape="bevel"
				layout="horizontal"
				direction="left"
				gridColumns={{ left: 1, right: 3 }}
				imgShape="bevel"
			/>

			<PageSection columns={1} maxWidth="1024px" id="service-areas-link-section">
				<p>
					Check out our <a href="/service-areas">Service Areas</a> page to see the regions we serve and the local expertise we offer.
				</p>
				<p>
					<a href="/contact">Contact us</a> to learn more about our services, service areas, and how we can support your needs in your area. We are committed to providing excellent service and local expertise wherever you are.
				</p>
			</PageSection>

		</>
	);
}
