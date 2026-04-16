"use client";

import { Callout, PageTitleHeader, PageSection } from "@pixelated-tech/components";

export default function ServicesPage() {
    
	return (
		<>

			<PageTitleHeader title="Manning Metalworks Services" />

			<PageSection columns={1} maxWidth="1024px" padding="20px" id="service-section">
				<Callout
					variant="boxed grid"
					gridColumns={{left:1, right:3}}
					layout="horizontal"
					direction="left"
					img="https://images.ctfassets.net/j4mgog9ij96e/3kYMY0QTmRH5Z80aeCb0Vj/b82537bb4539c269ded4f5ed2d9bed4a/steel-welding-2023-11-27-05-03-16-utc.jpg.webp"
					title="Precision Metal Fabrication"
					subtitle="Manning Metalworks provides premier residential, commercial, and municipal metal fabrication across the region. We specialize in the complete project lifecycle, from CAD-assisted design and CNC plasma cutting to high-standard AWS certified assembly."
				/>
				<div className="scroll-fade-element" suppressHydrationWarning>
					<p>
						Our shop is equipped to handle the rigorous demands of structural steel projects while maintaining the delicate touch required for high-end architectural features. Whether you are a general contractor needing safety bollards and HVAC dunnage for a commercial build, or a homeowner seeking a one-of-a-kind ornamental staircase, our team delivers results that meet the highest AWS (American Welding Society) standards.					</p>
					<p>
						Our competitive edge lies in our ability to work with a vast array of alloys.  We offer expert-level fabrication in stainless steel, aluminum, and brass. This versatility is essential for clients in the food service industry requiring sanitary-grade kitchen equipment, as well as municipal departments needing corrosion-resistant infrastructure. Every project we undertake is a fusion of engineering integrity and aesthetic excellence, ensuring that your investment is not only structurally sound but also adds significant value to your property or facility.					</p>
				</div>
				<Callout
					variant="boxed grid"
					gridColumns={{left:3, right:1}}
					layout="horizontal"
					direction="right"
					img="https://images.ctfassets.net/j4mgog9ij96e/72q7aF96JizutnU4rg5ypc/f0807c244e9ca3d63f9451c44fb0be84/manning-welding.jpg"
					title="Expert Repairs and Custom Fabrication"
					subtitle="We offer bespoke metal solutions and restoration services that off-the-shelf products simply cannot provide. Our technicians utilize MIG, TIG, and Stick welding processes to deliver high-strength repairs for everything from heavy machinery to antique ironwork."
				/>
				<div className="scroll-fade-element" suppressHydrationWarning>
					<p>
						At Manning Metalworks, we believe that "custom" means more than just built-to-order; it means built to solve a specific problem. We understand that in the industrial and agricultural sectors, a cracked frame or a failed bracket can halt productivity. Our technicians provide repairs that often exceed the original manufacturer’s specifications. From heavy equipment bucket teeth and trailer frames to delicate antique wrought iron restoration, we treat every repair with meticulous attention to detail.
					</p>
					<p>
						Beyond simple fixes, our custom fabrication service allows you to bring unique visions to life. We work closely with architects and designers to create functional art, such as custom-fit handrails, security grilles, and specialized furniture. We don't just "patch" metal; we analyze why a failure occurred and offer reinforcements to prevent future downtime. This proactive approach to repair and the ability to engineer custom parts on demand makes us an invaluable partner for local businesses and homeowners alike. By choosing Manning Metalworks, you are opting for a level of craftsmanship that prioritizes longevity and precision over quick, temporary fixes.
					</p>
				</div>
				<Callout
					variant="boxed grid"
					gridColumns={{left:1, right:3}}
					layout="horizontal"
					direction="left"
					img="https://images.ctfassets.net/j4mgog9ij96e/3PNAwcHeCocC45Gha5l8nb/efd09e7c86a32611cb812290ed3aff5a/manning-mobile.jpg"
					title="24/7 Mobile Welding Services"
					subtitle="Our 24/7 mobile welding division serves as a rapid-response unit, bringing a 'shop on wheels' directly to your location. We provide emergency support for structural failures and machinery repairs at any hour of the day or night."
				/>
				<div className="scroll-fade-element" suppressHydrationWarning>
					<p>
						In the world of construction, logistics, and property management, metal failures rarely happen during convenient business hours. Our mobile rigs are fully self-contained with high-output generators, wire feeders, and a suite of specialized tools. This allows us to perform industrial-grade welding in remote locations, on busy construction sites, or at residential properties in the middle of the night. When a security gate fails at 2:00 AM or a critical production line support snaps during a graveyard shift, our team is dispatched immediately to mitigate the hazard and restore functionality.
					</p>
					<p>
						We understand that every emergency is unique and often brings a high level of stress to your day or night. Our team is genuinely ready to step in and help resolve your problem with the urgency and care it deserves. Whether you are dealing with a structural failure or a security risk, we want to provide the professional support needed to get things back on track. Please do not hesitate to reach out to us directly at (973) 906-0441 so we can discuss your specific situation immediately. Alternatively, you can provide us with the project details by filling out our <a href="/contact-us">contact us form</a>, and we will get to work on your solution right away.
					</p>
				</div>
				
			</PageSection>

		</>
	);
}
