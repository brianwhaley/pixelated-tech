"use client";

import { PageSection, usePixelatedConfig } from "@pixelated-tech/components";
import { MenuAccordion, MenuAccordionButton } from "@pixelated-tech/components";

export default function Header() {
	const config = usePixelatedConfig();
	const routes = config?.routes || [];
    
	return (
		<>
			<MenuAccordionButton />
			<MenuAccordion menuItems={routes} />
			<PageSection columns={1} id="header-section">
				<a href="/">
					<strong>{config?.siteInfo?.name || "Marvelous Painting"}</strong>
				</a>
			</PageSection>
		</>
	);
}
