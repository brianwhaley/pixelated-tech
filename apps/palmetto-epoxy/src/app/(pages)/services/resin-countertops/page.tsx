"use client";

import React from "react";
import * as CalloutLibrary from "@/app/elements/calloutlibrary";
import { PageSection } from "@pixelated-tech/components";
import { PageSectionHeader } from "@pixelated-tech/components";
import { SmartImage } from "@pixelated-tech/components";

export default function ResinCountertopsService() {
	return (
		<>
			<CalloutLibrary.PageTitle title="Palmetto Epoxy - Resin Countertops Service" />

			<PageSection columns={1} className="" id="resin-countertops-service-section">
				<PageSectionHeader>Service Overview</PageSectionHeader>
				<SmartImage 
					src="https://images.ctfassets.net/0b82pebh837v/jEfSWjZ7XmoNrC8ATyxUF/d1d8a472a09564c03c2f5b303b0ba193/IMG_8829.jpeg?fm=webp" 
					aboveFold={true}
					alt="Custom resin countertop with intricate metallic patterns in a modern kitchen"
				/>
				<p>
					Resin countertops, often referred to as custom epoxy countertops, offer an innovative alternative to traditional, expensive, and high-maintenance natural stones like marble or granite. By applying high-performance liquid resins over a solid substrate, we create a completely seamless, non-porous, and food-safe architectural surface that serves as a stunning artistic focal point in any residential kitchen or commercial bar.
				</p>

				<PageSectionHeader>Material</PageSectionHeader>
				<p>
					We use premium 100% solids, zero-VOC polymer resins sealed with high-performance polyurethane or polyaspartic topcoats. These specialty resins are completely non-toxic and FDA-approved for food contact safety.
				</p>

				<PageSectionHeader>Installation Process Overview</PageSectionHeader>
				<p>
					Our artisans prepare the existing substrate using mechanical abrasion to ensure an absolute bond. We mix custom pigments and metallic powders into the liquid resin, pouring and manipulating the material by hand using specialized trowels and rollers to create organic patterns. Finally, we apply a clear, high-durability protective topcoat to shield the design.
				</p>

				<PageSectionHeader>Timing</PageSectionHeader>
				<p>
					Because every resin countertop is a custom-poured piece of art, the processing time requires precision. The installation takes two to three days, and the material reaches a full chemical cure ready for daily utilization within 48 to 72 hours.
				</p>

				<PageSectionHeader>Customization</PageSectionHeader>
				<p>
					The design options are entirely limitless. We can execute hyper-realistic veining that replicates exotic Italian Calacatta marble, cast deep three-dimensional metallic textures, or embed distinct materials like sea glass, stone fragments, or commercial branding elements directly into a crystal-clear flood coat.
				</p>

				<PageSectionHeader>Maintenance</PageSectionHeader>
				<p>
					Unlike natural stone, resin surfaces are completely non-porous and require no annual resealing or specialized chemical cleaners. Daily maintenance is limited to wiping the surface down with a microfiber cloth and standard dish soap or mild surface spray.
				</p>

				<PageSectionHeader>Benefits</PageSectionHeader>
				<p>
					Our resin countertops are completely seamless, which eliminates the traditional stone seams that collect dirt and bacteria. They are highly resistant to moisture, scratching, and severe staining from everyday items like red wine, coffee, and acidic citrus juices.
				</p>

				<PageSectionHeader>Value</PageSectionHeader>
				<p>
					Resin countertops allow property owners to achieve the high-end appearance of exotic, premium marble or granite at a fraction of the raw material and fabrication cost. Furthermore, because resin is a renewable material, any micro-scratches sustained over years of heavy use can be sanded down and re-coated without replacing the countertop.
				</p>

				<PageSectionHeader>Service Areas & Local Expertise</PageSectionHeader>
				<p>
					Whether you are remodeling a residential kitchen island or building a heavy-duty commercial bar top for a local restaurant, our design team services the entire region:
				</p>

				<ul>
					<li><a href="/services/areas#beaufort">Beaufort, SC</a></li>
					<li><a href="/services/areas#bluffton">Bluffton, SC</a></li>
					<li><a href="/services/areas#hardeeville">Hardeeville, SC</a></li>
					<li><a href="/services/areas#hilton-head">Hilton Head, SC</a></li>
					<li><a href="/services/areas#okatie">Okatie, SC</a></li>
					<li><a href="/services/areas#ridgeland">Ridgeland, SC</a></li>
				</ul>
				<p>
					To view our complete geographical footprint, visit our <a href="/services/areas">Main Service Areas Page</a>.
				</p>
			</PageSection>

			<section className="section-bluechip" id="contact-section">
				<CalloutLibrary.ContactCTA />
			</section>
		</>
	);
}
