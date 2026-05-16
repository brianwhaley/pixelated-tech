"use client";

import React from "react";
import * as CalloutLibrary from "@/app/elements/calloutlibrary";
import { PageSection, PageSectionHeader } from "@pixelated-tech/components";
import { SmartImage } from "@pixelated-tech/components";

export default function CommercialService() {	
	return (
		<>
			<CalloutLibrary.PageTitle title="Palmetto Epoxy - Commercial Service" />

			<PageSection columns={1} className="" id="commercial-service-section">
				<PageSectionHeader>What Makes Commercial Clients Unique</PageSectionHeader>
				<SmartImage 
					src="https://images.ctfassets.net/0b82pebh837v/6oA0GDDEJSkZRPy0PhCBSl/44c7989017c8f08c9fe7abc7bd732486/Epoxy_Floor_4.jpg?fm=webp" 
					aboveFold={true}
					alt="Commercial epoxy flooring installation in progress, showing heavy machinery and industrial setting"
				/>
				<p>
					Commercial clients operate under strict financial and operational constraints. For a business, a flooring project is an architectural investment where minimizing operational downtime, maximizing risk mitigation, and ensuring strict regulatory compliance are the primary objectives. Commercial spaces face constant, aggressive abuse from heavy vehicular traffic, industrial forklifts, harsh chemical washdowns, and thousands of pivoting footfalls daily. Furthermore, commercial managers must plan around rigid safety codes (OSHA/ADA) and coordinate installation logistics during off-hours, weekends, or scheduled holiday shutdowns to protect their revenue streams.
				</p>
				<PageSectionHeader>Material</PageSectionHeader>
				<p>
					We utilize heavy-duty, industrial-grade 100% solids epoxy primers, high-build chemical-resistant novolac epoxies, and rapid-curing aliphatic polyaspartic topcoats. For settings with extreme thermal shock or moisture vapor transmission, we employ heavy-duty cementitious urethane slurries. All commercial materials are zero- or low-VOC to comply with indoor air quality regulations during application.
				</p>
				<PageSectionHeader>Installation Process Overview</PageSectionHeader>
				<p>
					Commercial success relies on high-production mechanical profiling. We use heavy, planetary diamond grinders and shot-blasters equipped with industrial HEPA dust-extraction systems to clear old coatings, oils, and weak laitance, achieving a strict Concrete Surface Profile (CSP) of 3 to 5. Joint filler resins are pumped into structural control joints to handle heavy wheel traffic before multi-layer resin coatings or high-stage mechanical concrete polishing occurs.
				</p>
				<PageSectionHeader>Timing</PageSectionHeader>
				<p>
					We treat the "Cost of Downtime" with extreme urgency. By deploying specialized crews and rapid-cure polyaspartic chemistries, we specialize in "Rapid Return-to-Service" overnight or weekend turnarounds. Most commercial floors can handle light foot traffic in 4 to 6 hours and heavy forklift or vehicular traffic within 24 hours of final topcoat application.
				</p>

				<PageSectionHeader>Customization</PageSectionHeader>
				<p>
					Commercial customization focuses on safety, branding, and organization. We integrate custom safety striping, pedestrian walkways, forklift lane boundaries, hazard zoning, and slip-resistant aggregate gradients (using aluminum oxide or quartz). We can also embed high-resolution, slip-resistant corporate logos directly into the floor's clear wear layer for branding in lobbies and showrooms.
				</p>

				<PageSectionHeader>Maintenance</PageSectionHeader>
				<p>
					Designed for maximum labor efficiency, our commercial floors eliminate grout lines and porous seams where dirt and bacteria hide. They can withstand aggressive automatic floor scrubbers, high-pressure power washing, and heavy chemical sanitizers, reducing cleaning labor times by up to 40% based on International Sanitary Supply Association (ISSA) maintenance standards.
				</p>

				<PageSectionHeader>Benefits</PageSectionHeader>
				<p>
					These systems offer exceptional resistance to chemical spills (oil, gasoline, acids, and sanitizers), unparalleled impact resistance against dropped heavy machinery, and long-term gloss retention. They provide a seamless moisture vapor barrier that prevents the concrete from "sweating" in high coastal humidity.
				</p>

				<PageSectionHeader>Value</PageSectionHeader>
				<p>
					Commercial resinous flooring delivers an exceptional life-cycle cost advantage. By eliminating the constant cycle of stripping, waxing, and replacing modular tile (VCT) or carpet, businesses save thousands in annual facility overhead. Additionally, the high light reflectivity of our glossy coatings can reduce ambient overhead lighting demands by up to 30%, lowering commercial utility bills.
				</p>

				<PageSectionHeader>Commercial Service Areas & Regional Infrastructure</PageSectionHeader>
				<p>
					We provide engineered, code-compliant commercial surfacing for warehouses, retail shops, medical clinics, and restaurants across the following Lowcountry locations:
				</p>

				<ul>
					<li><a href="/service-areas/beaufort-sc">Beaufort, SC (Serving medical offices, historic storefronts, and marine facilities)</a></li>
					<li><a href="/service-areas/bluffton-sc">Bluffton, SC (Serving high-traffic retail spaces, showrooms, and local offices)</a></li>
					<li><a href="/service-areas/hardeeville-sc">Hardeeville, SC (Serving distribution centers and industrial manufacturing hubs along the I-95 corridor)</a></li>
					<li><a href="/service-areas/hilton-head-sc">Hilton Head, SC (Serving resort kitchens, hospitality venues, and high-end retail boutiques)</a></li>
					<li><a href="/service-areas/okatie-sc">Okatie, SC (Serving commercial plazas, corporate offices, and institutional facilities)</a></li>
					<li><a href="/service-areas/ridgeland-sc">Ridgeland, SC (Serving automotive shops, agricultural facilities, and growing business parks)</a></li>
				</ul>
				<p>
					To review our complete regional commercial coverage, visit our <a href="/services/areas">Main Service Areas Page</a>.
				</p>
			</PageSection>

			<section className="section-bluechip" id="contact-section">
				<CalloutLibrary.ContactCTA />
			</section>
		</>
	);
}
