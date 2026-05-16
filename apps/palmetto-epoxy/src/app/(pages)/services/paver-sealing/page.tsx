"use client";

import React from "react";
import * as CalloutLibrary from "@/app/elements/calloutlibrary";
import { PageSection, PageSectionHeader } from "@pixelated-tech/components";
import { SmartImage } from "@pixelated-tech/components";


export default function PaverSealingService() {
	return (
		<>
			<CalloutLibrary.PageTitle title="Palmetto Epoxy - Paver Sealing Service" />

			<PageSection columns={1} className="" id="paver-sealing-service-section">
				<PageSectionHeader>Service Overview</PageSectionHeader>
				<SmartImage
					src="https://images.ctfassets.net/0b82pebh837v/4XSmKyMglzHAGa3PrDrnyt/b42f90a173ca7d860acadbb0defa9eeb/IMG_6229.jpg?fm=webp"
					aboveFold={true}
					alt="Before and after image of a paver sealing project on a coastal pool deck, showing vibrant color restoration and enhanced joint definition"
				/> 
				<p>
					Interlocking brick and concrete pavers add incredible architectural character to Lowcountry pool decks, patios, and walkways, but their highly porous nature makes them highly vulnerable to coastal erosion. Our professional paver sealing service is a critical preventative maintenance process that stabilizes joint sand, locks out biological growth, and shields the stone from permanent sun and salt damage.
				</p>

				<PageSectionHeader>Material</PageSectionHeader>
				<p>
					We use premium, industrial-grade breathable water-borne or solvent-based acrylic sealers infused with robust UV inhibitors. These professional-grade compounds are engineered specifically to allow internal concrete moisture to escape while blocking external water from sinking in.
				</p>

				<PageSectionHeader>Installation Process Overview</PageSectionHeader>
				<p>
					The process begins with an intensive chemical and pressure washing wash to kill and extract all embedded mold, mildew, algae, and deep stains. Once the pavers are completely dry, we sweep specialized joint-stabilizing sand into the gaps to lock the blocks in place, and apply two uniform coats of our high-solids sealer using precision flood-spraying and rolling techniques.
				</p>

				<PageSectionHeader>Timing</PageSectionHeader>
				<p>
					A professional paver cleaning, sanding, and sealing project typically spans two days, depending heavily on weather and drying conditions, with the surface ready for foot traffic in 24 hours and vehicle traffic in 48 hours.
				</p>

				<PageSectionHeader>Customization</PageSectionHeader>
				<p>
					We cater to your specific design preferences by offering multiple finish options. You can choose a Natural Matte look that protects without changing the stone's appearance, a Satin Sheen for a subtle glow, or a rich High-Gloss Wet Look that deepens and intensifies the original color tones of the pavers.
				</p>

				<PageSectionHeader>Maintenance</PageSectionHeader>
				<p>
					Sealed pavers require roughly 50% less maintenance time than unsealed ones. Because the pores are completely sealed, weeds cannot easily root in the joints, and organic debris like leaves or bird droppings can be quickly rinsed away with a hose before creating deep stains.
				</p>

				<PageSectionHeader>Benefits</PageSectionHeader>
				<p>
					Our sealing process mitigates the formation of efflorescence (unsightly white, powdery salt deposits driven by coastal humidity). It locks joint sand in place to prevent washouts during heavy afternoon downpours, stops weed growth, and provides an essential shield against sun-driven color fading.
				</p>

				<PageSectionHeader>Value</PageSectionHeader>
				<p>
					Neglected pavers quickly shift, sink, and crack, leading to massive re-leveling and replacement costs, as well as significant slip-and-trip liabilities on commercial walkways. Regular sealing is a highly cost-effective maintenance strategy that preserves the structural integrity and high value of your exterior hardscaping for years.
				</p>

				<PageSectionHeader>Service Areas & Local Expertise</PageSectionHeader>
				<p>
					We specialize in protecting expansive pool decks, commercial walkways, and residential drives from the brutal combination of salt air and intense humidity found across:
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
