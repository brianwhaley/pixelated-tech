"use client";

import { PageSection, SmartImage, MenuAccordion, MenuAccordionButton, usePixelatedConfig } from "@pixelated-tech/components";

export default function Header() {
	const pixelatedConfig = usePixelatedConfig();
	const routes = pixelatedConfig?.routes ?? [];

	return (
		<>
			<MenuAccordionButton />
			<MenuAccordion menuItems={routes} />
			<PageSection columns={1} id="header-section">
				<a href="/" style={{ margin: "0 auto" }}>
					<SmartImage
						id="logo"
						src="/images/logo/jz-home-improvement.png"
						alt="JZ Home Improvement Logo"
						aboveFold={true}
						width={500}
						height={500}
						style={{ margin: "0 auto" }}
					/>
				</a>
			</PageSection>
		</>
	);
}
