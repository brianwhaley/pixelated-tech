"use client";

import { PageSection } from "@pixelated-tech/components";
import { SmartImage } from "@pixelated-tech/components";

export default function Header() {
    
	return (
		<>
			{/* <MenuAccordionButton />
			<MenuAccordion menuItems={allRoutes} /> */}
			<PageSection columns={1} id="header-section">
				<SmartImage
					id="logo"
					src="/images/simple-day-concierge-logo.png"
					alt="Simple Day Concierge Logo"
					width={500}
					height={500}
					style={{ margin: "0 auto", width: "auto", height: "auto" }}
					aboveFold={true}
				/>
			</PageSection>
		</>
	);
}
