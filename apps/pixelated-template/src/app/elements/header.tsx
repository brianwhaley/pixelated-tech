"use client";

import { PageSection, usePixelatedConfig } from "@pixelated-tech/components";
import { SmartImage } from "@pixelated-tech/components";
import { MenuAccordion, MenuAccordionButton } from "@pixelated-tech/components";

export default function Header() {
	const config = usePixelatedConfig();
	const routes = config?.routes || [];
    
	return (
		<>
			<MenuAccordionButton />
			<MenuAccordion menuItems={routes} />
			<PageSection columns={1} id="header-section">
				<SmartImage
					id="logo"
					src="/images/placeholder.png"
					alt={config?.siteInfo?.name ? `${config.siteInfo.name} Logo` : "Site Logo"}
					aboveFold={true}
					width={120}
					height={120}
				/>
			</PageSection>
		</>
	);
}
