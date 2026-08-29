"use client";

import { PageSection, usePixelatedConfig } from "@pixelated-tech/components";
import { SmartImage } from "@pixelated-tech/components";
import { MenuSimple } from "@pixelated-tech/components";

// import "./header.css";

export default function Header() {
	const config = usePixelatedConfig();
	const routes = config?.routes || [];
    
	return (
		<>
			<PageSection columns={1} maxWidth="1440px" padding="0px" id="header-section">
				<SmartImage
					id="logo"
					src="/images/amava-logo.png"
					alt={config?.siteInfo?.name ? `${config.siteInfo.name} Logo` : "Site Logo"}
					aboveFold={true} 
					width={448} /* 400 */
					height={123} /* 110 */
				/>

				<MenuSimple menuItems={routes} />

			</PageSection>
		</>
	);
}
