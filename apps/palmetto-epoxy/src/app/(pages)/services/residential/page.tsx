"use client";

import React from "react";
import * as CalloutLibrary from "@/app/elements/calloutlibrary";
import { PageSection, PageSectionHeader } from "@pixelated-tech/components";
import { SmartImage } from "@pixelated-tech/components";


export default function ResidentialService() {
	return (
		<>
			<CalloutLibrary.PageTitle title="Palmetto Epoxy - Residential Service" />

			<PageSection columns={1} className="" id="residential-service-section" style={{display: "inline-block !important"}}>
				<PageSectionHeader>What Makes Residential Clients Unique</PageSectionHeader>
				<SmartImage 
					src="https://images.ctfassets.net/0b82pebh837v/1xi23O70o42mFz38ElKNw3/8ada068a8405e49c9389c0b0f94d87b6/Epoxy_Shining.jpg?fm=webp" 
					aboveFold={true}
					alt="Shining epoxy floor in a residential garage with a parked car and storage cabinets"
				/>
				<p>
					Residential clients view a flooring project as a significant personal investment in their home's beauty, safety, and long-term value. For a homeowner, a floor is an extension of their living space—whether it is a garage, a backyard patio, or a kitchen countertop. Residential clients prioritize aesthetic customization, safety for children and elderly family members, odor-free installations, and personalized customer care. They need a contractor who respects their property, arrives on time, cleans up meticulously, and provides straightforward explanations without confusing industry jargon. Residential flooring must balance extreme durability against automotive tires with the warmth and design-forward styling of a luxury home.
				</p>
				<PageSectionHeader>Material</PageSectionHeader>
				<p>
					We utilize premium, architectural-grade 100% solids epoxy base coats combined with 100% UV-stable, non-yellowing aliphatic polyaspartic and polyurea topcoats. Our residential resins are completely solvent-free, ultra-low odor, and eco-friendly, ensuring a safe application environment for families and pets.
				</p>
				<PageSectionHeader>Installation Process Overview</PageSectionHeader>
				<p>
					We treat every residential concrete slab with the same care as an industrial project. Our process begins with dustless diamond grinding to remove stains, dirt, and weak concrete, opening the pores of the slab. We patch all settlement cracks and divots flush with a structural polymer gel before applying our deep-wicking primer layer, executing a full broadcast of decorative color flakes or metallic pigments, and locking it in with a thick, protective topcoat layer.
				</p>
				<PageSectionHeader>Timing</PageSectionHeader>
				<p>
					We understand that homeowners want to minimize disruption to their daily routines. Our popular residential "One-Day Garage and Patio Systems" compress the installation timeline significantly; our crews can grind, coat, and seal a standard two-car garage or outdoor patio in a single day, allowing foot traffic back on the floor that evening and vehicles to park inside within 24 hours.
				</p>
				<PageSectionHeader>Customization</PageSectionHeader>
				<p>
					The aesthetic possibilities are limited only by your imagination. Homeowners can select from hundreds of full-broadcast vinyl flake blends that mimic natural granite, choose shimmering multi-toned metallic epoxy finishes that look like flowing stone, or opt for various sheen levels (from soft satin to absolute high-gloss mirror finishes).
				</p>
				<PageSectionHeader>Maintenance</PageSectionHeader>
				<p>
					Residential maintenance is completely stress-free. Because our cured systems are entirely seamless and non-porous, dirt, pet hair, mud, and automotive oil spills cannot penetrate the surface; a simple sweep with a soft broom and an occasional damp mop with a mild household dish soap or water is all it takes to maintain a flawless finish.
				</p>
				<PageSectionHeader>Benefits</PageSectionHeader>
				<p>
					Our residential systems provide absolute protection against "hot tire pickup" in the garage and completely eliminate concrete "dusting" from tracking into your home. For outdoor patios and pool decks, our floors are engineered to handle the extreme UV rays and high coastal humidity without fading or peeling, and they incorporate anti-slip media to create a high-traction surface for family safety when wet.
				</p>
				<p>
					Value: Coating an unfinished garage or sealing a weathered patio transforms a neglected utility zone into a clean, beautiful, and fully functional extension of your home's usable square footage. According to real estate valuation data, upgrading your home with high-performance, durable concrete coatings dramatically boosts curb appeal and can add 5% to 7% to your property's resale equity.
				</p>
				<PageSectionHeader>Residential Service Areas & Local Neighborhoods</PageSectionHeader>
				<p>
					Led by our local family team—Dennis, Martha, and Clay—we provide personalized residential transformations, custom garage floor upgrades, and outdoor paver sealing across the following communities:
				</p>
				<ul>
					<li><a href="/service-areas/beaufort-sc">Beaufort, SC (Serving beautiful coastal homes in Habersham, Dataw Island, and Coosaw Point)</a></li>
					<li><a href="/service-areas/bluffton-sc">Bluffton, SC (Serving upscale neighborhoods in Palmetto Bluff, Colleton River, Hampton Lake, and Sun City)</a></li>
					<li><a href="/service-areas/hardeeville-sc">Hardeeville, SC (Serving active adult and family homes in Latitude Margaritaville and Riverton Pointe)</a></li>
					<li><a href="/service-areas/hilton-head-sc">Hilton Head, SC (Serving exclusive beachfront and golf estates in Sea Pines, Wexford, Indigo Run, and Long Cove)</a></li>
					<li><a href="/service-areas/okatie-sc">Okatie, SC (Serving riverfront and active properties in Oldfield, Riverbend, and Four Seasons)</a></li>
					<li><a href="/service-areas/ridgeland-sc">Ridgeland, SC (Serving expanding family developments in Bayshore, Hunt Club, and The Enclave)</a></li>
				</ul>
				<p>
					To review our complete geographical residential footprint, visit our Main Service Areas Page.
				</p>
			</PageSection>

			<section className="section-bluechip" id="contact-section">
				<CalloutLibrary.ContactCTA />
			</section>
		</>
	);
}
