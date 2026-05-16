"use client";

import React from "react";
import * as CalloutLibrary from "@/app/elements/calloutlibrary";
import { PageSection, PageSectionHeader } from "@pixelated-tech/components";
import { SmartImage } from "@pixelated-tech/components";

export default function EpoxyGarageFloorsService() {
	return (
		<>
			<CalloutLibrary.PageTitle title="Palmetto Epoxy - Epoxy Garage Floors Service" />


			<PageSection columns={1} id="epoxy-garage-floors-service-section">
				<PageSectionHeader>Service Overview</PageSectionHeader>
				<SmartImage 
					src="https://images.ctfassets.net/0b82pebh837v/39vkbzDrlvLtK3fF86T7Zy/7b21429c376a679dd364cd56685b00f2/Seapines_1_Done.JPG?fm=webp" 
					aboveFold={true}
					alt="Epoxy garage floor with decorative vinyl chips in a coastal home"
				/>
				<p>
					The garage floor is often the most abused concrete surface in any residential or commercial property. Our multi-layer epoxy and polyaspartic garage flooring systems turn dark, dusty, and oil-stained garages into bright, showroom-quality extensions of your living or working space, combining extreme chemical resistance with impact protection.
				</p>

				<PageSectionHeader>Material</PageSectionHeader>
				<p>
					We combine the structural properties of industrial-grade 100% solids epoxy base coats for deep concrete anchoring with the superior wear capabilities of an aliphatic polyaspartic topcoat.
				</p>

				<PageSectionHeader>Installation Process Overview</PageSectionHeader>
				<p>
					We never cut corners on preparation; our crews utilize planetary diamond grinders equipped with integrated dustless vacuum systems to mechanically profile the garage floor to a coarse, sandpaper-like texture. After treating all cracks and divots, we lay down our deep-penetrating epoxy primer, execute a full broadcast of decorative vinyl color chips until the floor is completely saturated, and seal the system with our chemical-resistant topcoat.
				</p>

				<PageSectionHeader>Timing</PageSectionHeader>
				<p>
					Our classic multi-layer garage transformations are streamlined for minimal disruption. The full process is completed in one to two days, allowing you to return your belongings and park your vehicles on the surface within 24 hours of completion.
				</p>

				<PageSectionHeader>Customization</PageSectionHeader>
				<p>
					We offer hundreds of color combinations, ranging from classic industrial grays and tans to custom metallic blends. As a proud community business, we even offer specialized team spirit color palettes to match your favorite college basketball or local athletic teams, such as May River High School.
				</p>

				<PageSectionHeader>Maintenance</PageSectionHeader>
				<p>
					The seamless, non-porous nature of our garage floors eliminates grout lines and microscopic hiding spots for dirt. Cleaning requires only a broom or a damp mop with water and a drop of dish soap to wipe away stubborn tire marks and grease.
				</p>

				<PageSectionHeader>Benefits</PageSectionHeader>
				<p>
					Our garage systems provide extreme resistance to impact from dropped tools, heavy floor jacks, and chemical exposure to gasoline, anti-freeze, and battery acid. The floor forms a seamless moisture barrier that keeps subterranean dampness from sweating through the concrete.
				</p>

				<PageSectionHeader>Value</PageSectionHeader>
				<p>
					An advanced garage floor coating transforms an unfinished utility space into a highly functional workspace, increasing the usable square footage of your property. This clean, modern upgrade acts as a major selling point that delivers a high financial return on investment when listing your home.
				</p>

				<PageSectionHeader>Service Areas & Local Expertise</PageSectionHeader>
				<p>
					From private residential garages in master-planned golf communities to heavy-duty commercial automotive bays, we deliver award-winning service to:
				</p>

				<ul>
					<li><a href="/service-areas/beaufort-sc">Beaufort, SC</a></li>
					<li><a href="/service-areas/bluffton-sc">Bluffton, SC</a></li>
					<li><a href="/service-areas/hardeeville-sc">Hardeeville, SC</a></li>
					<li><a href="/service-areas/hilton-head-sc">Hilton Head, SC</a></li>
					<li><a href="/service-areas/okatie-sc">Okatie, SC</a></li>
					<li><a href="/service-areas/ridgeland-sc">Ridgeland, SC</a></li>
				</ul>
				<p>
					To view our complete geographical footprint, visit our <a href="/service-areas">Main Service Areas Page</a>.
				</p>
			</PageSection>
				

			<section className="section-bluechip" id="contact-section">
				<CalloutLibrary.ContactCTA />
			</section>
		</>
	);
}
