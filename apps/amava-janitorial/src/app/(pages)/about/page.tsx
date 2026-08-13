"use client";

import { PageTitleHeader, PageSection, PageGridItem, PageSectionHeader } from "@pixelated-tech/components";
import { PageHero } from "../../elements/page-hero";
import { Callout } from "@pixelated-tech/components";

export default function AboutPage() {
    
	return (
		<>

			<PageHero />

			<PageSection columns={1} maxWidth="1024px" padding="20px" id="about-amava-section">
			    <PageTitleHeader title="About AMAVA Janitorial" />
				<PageSectionHeader title="Your Partner in Facility Maintenance" />
				<PageGridItem >
					<p>At AMAVA Janitorial, we take the complete burden of facility care off your shoulders so you can focus entirely on driving your business forward. As an A+ BBB-rated industry leader with over three decades of commercial experience, we deliver tailored cleaning, janitorial, and building maintenance solutions to property owners, facility managers, and Fortune 500 corporations. Operating dual headquarters in New Jersey and Florida, our service footprint spans New Jersey, New York, Connecticut, Delaware, South Carolina, and Central & Southern Florida.
					</p>
					<p>We don't just clean spaces—we protect real estate investments, foster safe working environments, and uphold the professional reputation of every facility we serve.</p>
				</PageGridItem>
			</PageSection>

			<PageSection columns={1} maxWidth="1024px" padding="20px" id="about-our-story-section">
				<PageSectionHeader title="Our Story: Built on Quality, Expanded by Trust" />
				<p>AMAVA Janitorial was founded on a simple yet powerful premise: commercial property owners deserve a custodial partner who treats their facility with the same care, accountability, and detail as the owners themselves. What began over 30 years ago as a dedicated regional cleaning operation has steadily grown into a multi-state commercial maintenance enterprise.</p>
				<p>Our growth hasn't come from aggressive short-cuts, but from long-term client retention and word-of-mouth recommendations. As client portfolios expanded, so did AMAVA. We established our dual regional hubs in Mahwah, New Jersey, and Florida to provide rapid, hands-on oversight across the Eastern Seaboard. Through economic shifts, evolving health standards, and rapid commercial development, AMAVA has remained a constant, reliable force in the industry—continuously investing in advanced machinery, sustainable chemistries, and rigorous workforce training to stay ahead of modern facility demands. Today, our innovative 7-prong cleaning methodology and multi-pillar service model allow us to manage complex, multi-site corporate accounts while delivering the personal touch of a local partner.</p>
			</PageSection>


			<PageSection columns={1} maxWidth="1024px" padding="20px" id="about-our-mission-section">
				<PageSectionHeader title="Our Mission & Customer Philosophy" />
				<p>"Our mission is to empower businesses by delivering uncompromising facility sanitation, seamless property maintenance, and operational peace of mind—surpassing even our clients' highest standards through continuous innovation and disciplined execution."</p>
				<p>Core Operating Principles:</p>
				<ul>
					<li>The Burden is Ours: We take full ownership of site sanitation and maintenance logistics so your leadership team never has to worry about property presentation or cleanliness failures.</li>
					<li>Operational Transparency: We provide real-time reporting, detailed service logs, and proactive communication to ensure you are always informed about your facility's condition and our service performance.</li>
					<li>Uncompromising Standards: From everyday office dusting to terminal medical sanitation and emergency storm response, we hold ourselves to rigorous, multi-point quality assurance checks.</li>
					<li>Proactive Stewardship: We don't wait for issues to be reported. Our crews and supervisors actively identify maintenance risks, supply deficits, and safety hazards before they affect your operations.</li>
				</ul>
			</PageSection>


			<PageSection columns={1} maxWidth="1024px" padding="20px" id="about-our-team-section">
				<PageSectionHeader title="Our Team: Expertise, Tenure & Dedication" />
				<p>The true strength of AMAVA Janitorial lies in our people. While technology and equipment enhance our speed, it is the hands-on expertise, integrity, and discipline of our field crews and management teams that set us apart.</p>
				<p>Key Team Highlights:</p>
				<ul>
					<li>
						<strong>Industry Tenure:</strong> Our leadership team boasts over 50 years of combined commercial facility experience. Many of our account supervisors and site managers have been with AMAVA for over a decade, providing unmatched operational continuity for our clients.
					</li>
					<li>
						<strong>Rigorous Vetting & Training:</strong> Every AMAVA technician undergoes background checks, safety certifications, and hands-on technical training in equipment operation, chemical safety, and specialized industry protocols (including OSHA standards and infection prevention).
					</li>
					<li>
						<strong>Dedicated Account Supervision:</strong> You are never left dealing with automated call centers. Every client is paired with a dedicated account manager and field supervisor who conduct routine site audits and remain reachable 24/7.
					</li>
				</ul>
				<Callout
					variant='boxed grid'
					layout='horizontal'
					boxShape="square"
					img="https://media.licdn.com/dms/image/v2/C4D03AQFPZYKG2HolVw/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1517360227606?e=2147483647&v=beta&t=rs2PyZD-sgm0fsUfLP0XKMkmTJI9wRbBd7NTvjK1vqA"
					imgShape="square"
					title='Al Pope: Founder, President and CEO'
					content="Al Pope founded AMAVA Janitorial over 30 years ago with a vision to provide commercial property owners with a trusted, accountable, and highly skilled custodial partner. Under his leadership, AMAVA has grown into a multi-state operation while maintaining the personal touch and operational excellence that defines our brand."
				/>
			</PageSection>

		</>
	);
}
