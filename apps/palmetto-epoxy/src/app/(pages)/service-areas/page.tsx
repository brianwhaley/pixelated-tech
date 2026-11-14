"use client";

import React from "react";
import * as CalloutLibrary from "@/app/elements/calloutlibrary";
import { PageSection } from "@pixelated-tech/components";
import { ServiceAreas } from "@pixelated-tech/components";

export default function ServiceAreasPage() {	
	return (
		<>
			<CalloutLibrary.PageTitle title="Palmetto Epoxy - Service Areas" />


			<PageSection columns={1} maxWidth="1024px" id="service-areas-intro">
				<div>
					Palmetto Epoxy supports businesses across targeted regions in South Carolina and Georgia. Explore the service areas where we deliver our epoxy flooring services.
				</div>
			</PageSection>

			<ServiceAreas
				title="Palmetto Epoxy Service Areas"
				intro="Click a service area to see the local coverage and specialties for that region."
			/>


			<PageSection columns={1} maxWidth="1024px" id="services-link-section">
				<p>
					Check out our <a href="/services">Services</a> page to see the services we offer and the expertise we provide.
				</p>
				<p>
					<a href="/contact">Contact us</a> to learn more about our services, service areas, and how we can support your needs in your area. We are committed to providing excellent service and local expertise wherever you are.
				</p>
			</PageSection>

			<PageSection
				columns={1}
				className="section-bluechip"
				id="contact-section"
				backgroundImage="https://images.ctfassets.net/0b82pebh837v/72Ctu7oGaGNja5gHpTz4Fd/50984bad832c63d7845e3c6d511a1735/BluChips.jpg?fm=webp"
			>
				<CalloutLibrary.ContactCTA />
			</PageSection>
		</>
	);
}
