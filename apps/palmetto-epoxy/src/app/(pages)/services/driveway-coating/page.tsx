"use client";

import React from "react";
import * as CalloutLibrary from "@/app/elements/calloutlibrary";
import { PageSection } from "@pixelated-tech/components";
import { PageSectionHeader } from "@pixelated-tech/components";
import { SmartImage } from "@pixelated-tech/components";


export default function DrivewayCoatingService() {
	return (
		<>
			<CalloutLibrary.PageTitle title="Palmetto Epoxy - Driveway Coating Service" />

			<PageSection columns={1} className="" id="driveway-coating-service-section">
				<PageSectionHeader>Service Overview</PageSectionHeader>
				<SmartImage 
					src="https://images.ctfassets.net/0b82pebh837v/70SC4FojTqV1pVl0vTCbXH/88217839618887f3b73088a9f3f86ff9/Driveway_Polishjpg.jpg?fm=webp"
					aboveFold={true}
					alt="Driveway Coating"
				/>
				<p>Your driveway is the primary introductory feature of your property, yet it is subjected to an unforgiving mix of automotive weight, chemical fluid leaks, and intense South Carolina weather. Our professional driveway coatings provide an industrial-strength, seamless shield that seals your exterior concrete against stains, cracking, and environmental decay while instantly transforming your property's curb appeal.</p>

				<PageSectionHeader>Material</PageSectionHeader>
				<p>Unlike standard, cheap DIY paint kits that fail under exterior conditions, we use premium 100% UV-stable aliphatic polyaspartic and polyurea resins. These chemical systems are engineered specifically to remain light-stable and flexible under direct sunlight.</p>

				<PageSectionHeader>Installation Process Overview</PageSectionHeader>
				<p>Success depends entirely on our stringent surface preparation. We mechanically grind the entire driveway using heavy-duty diamond tooling to open the concrete's pores and remove any embedded oils or mold. Next, we fill and bridge all structural cracks with a high-strength epoxy gel before applying our specialized polyurea primer, a decorative flake broadcast, and a heavy polyaspartic protective topcoat.</p>

				<PageSectionHeader>Timing</PageSectionHeader>
				<p>Our driveway coating systems are built for speed and efficiency. We can complete a standard residential or commercial driveway installation within a single day, allowing foot traffic back on the surface in 4 to 6 hours and vehicular parking in 24 hours.</p>

				<PageSectionHeader>Customization</PageSectionHeader>
				<p>We offer an extensive selection of multi-colored decorative vinyl flake blends that mimic the sophisticated textures of natural granite or terrazzo. These blends are highly effective at camouflaging tracked-in coastal sand and organic debris between quick cleanings.</p>

				<PageSectionHeader>Maintenance</PageSectionHeader>
				<p>Maintenance is exceptionally simple. Because the polyaspartic shield is completely non-porous, fluids like motor oil, brake fluid, and rainwater cannot soak into the concrete; you can clear most dirt and leaf tannins with a standard garden hose, leaf blower, or mild detergent.</p>

				<PageSectionHeader>Benefits</PageSectionHeader>
				<p>Our driveway systems provide absolute protection against "hot tire pickup" (where hot vehicle tires soften and pull up low-quality paints). The coating stands up to extreme Lowcountry humidity and UV rays, prevents the growth of slippery mildew, and completely isolates the concrete from structural salt-air corrosion.</p>

				<PageSectionHeader>Value</PageSectionHeader>
				<p>A professionally coated driveway safeguards your concrete substrate against expensive structural erosion and cracking, effectively saving thousands in future removal and pouring costs. Additionally, real estate data shows that a pristine, custom driveway can enhance your home's total curb appeal and resale value by 5% to 7%.</p>

				<PageSectionHeader>Service Areas & Local Expertise</PageSectionHeader>
				<p>Our exterior polyaspartic systems are uniquely formulated to adapt to the high thermal cycling and coastal humidity of our region. Our professional crews service the following areas:</p>

				<ul>
					<li><a href="/service-areas/beaufort-sc">Beaufort, SC</a></li>
					<li><a href="/service-areas/bluffton-sc">Bluffton, SC</a></li>
					<li><a href="/service-areas/hardeeville-sc">Hardeeville, SC</a></li>
					<li><a href="/service-areas/hilton-head-sc">Hilton Head, SC</a></li>
					<li><a href="/service-areas/okatie-sc">Okatie, SC</a></li>
					<li><a href="/service-areas/ridgeland-sc">Ridgeland, SC</a></li>
				</ul>
				<p>To view our complete geographical footprint, visit our <a href="/service-areas">Main Service Areas Page</a>.</p>
			</PageSection>

			<section className="section-bluechip" id="contact-section">
				<CalloutLibrary.ContactCTA />
			</section>
		</>
	);
}
