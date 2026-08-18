"use client";

import { PageTitleHeader, PageSection, PageSectionHeader } from "@pixelated-tech/components";
import { Callout } from "@pixelated-tech/components";

export default function AboutPage() {

	return (
		<>

			<PageTitleHeader title="About GEA Construction" />

			<PageSection columns={1} maxWidth="1024px" padding="20px" id="history-overview-section">
				<PageSectionHeader>Built on Service, Integrity & Craftsmanship:<br />The GEA Construction Story.</PageSectionHeader>
				<p>At GEA Construction, we believe that building or remodeling a home requires far more than just quality materials—it demands absolute trust, clear communication, and a disciplined work ethic. Owned and operated by Nicholas Warchal, GEA Construction was founded on the principle that local homeowners deserve a trade partner who shows up on time, treats their living space with respect, and delivers lasting craftsmanship without the typical contractor headaches.</p>
			</PageSection>

			<PageSection columns={3} maxWidth="1024px" padding="20px" id="history-cards-section">
				<Callout
					layout="vertical"
					subtitle="Firefighter Heritage"
					img="https://images.ctfassets.net/6ewno74sai9a/4ew1smDiPqpwE3vuE9eHzY/9177ab3ab695c7a4ca8017b37877a5a2/firefighter-protective-gear-battles-raging-inferno.jpg?fm=webp"
					imgAlt="GEA Construction - Firefighter Heritage"
					imgShape="square"
				/>
				<Callout
					layout="vertical"
					subtitle="Coastal Experience"
					img="https://images.ctfassets.net/6ewno74sai9a/4Vr5iefQH9bcUpj0WiWEMU/188621b677b8dff012353b9713373bdf/luxurious-living-room-with-ocean-view.jpg?fm=webp"
					imgAlt="GEA Construction - Coastal Experience"
					imgShape="square"
				/>
				<Callout
					layout="vertical"
					subtitle="Realtor Partner"
					img="https://images.ctfassets.net/6ewno74sai9a/XeXBPYBVCho5s247sKuQt/54e647e8d4e5e8ff06d56d146e10cd20/sold-home-sale-sign-front-new-house.jpg?fm=webp"
					imgAlt="GEA Construction - Realtor Partner"
					imgShape="square"
				/>
			</PageSection>


			<PageSection columns={1} maxWidth="1024px" padding="20px" id="history-details-section">
				<p>Nicholas's path in the trades began years ago in coastal New Jersey, where he built a solid foundation executing custom residential renovations and structural interior updates. After relocating to South Carolina, he expanded his trade expertise into the local landscape and hardscape industry, gaining a deep, hands-on understanding of the unique building conditions, soil dynamics, and high-humidity environment of the Lowcountry. Today, that rich history of regional hands-on experience comes together under one roof at GEA Construction.</p>
				<p>In addition to leading GEA Construction, Nicholas proudly serves the local Bluffton community as a dedicated firefighter. That same unwavering commitment to public duty, site safety, structural integrity, and calm, organized leadership under pressure is carried directly onto every job site we manage. When you hire the GEA Construction team, you aren't dealing with an anonymous out-of-town outfit—you are working with a local community servant who stands behind his work and values long-term accountability.</p>
				<p>Our commitment extends beyond individual homeowners to our strong partnerships across the local real estate and business community. GEA Construction works closely with Bluffton and Hilton Head realtors to resolve home inspection punch lists, execute essential repairs, and complete full pre-move-in renovations before buyers unpack their first box. Whether we are updating a kitchen, transforming a master bathroom, or replacing windows, GEA Construction delivers honest trade practices, clean job sites, and reliable results built to serve our Lowcountry neighbors for years to come.</p>
			</PageSection>

		</>
	);
}
