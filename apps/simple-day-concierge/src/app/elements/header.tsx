"use client";

import { PageSection } from "@pixelated-tech/components";
import { SmartImage } from "@pixelated-tech/components";

export default function Header() {
    
	return (
		<>
			<PageSection columns={1} id="header-section" style={{gridTemplateColumns: "auto 1fr"}}>
				<SmartImage
					id="logo"
					src="/images/simple-day-concierge-logo.png"
					alt="Simple Day Concierge Logo"
					width={500}
					height={500}
					style={{ margin: "0 auto", width: "100%", maxHeight: "200px", objectFit: "contain" }}
					aboveFold={true}
				/>
			</PageSection>
		</>
	);
}
