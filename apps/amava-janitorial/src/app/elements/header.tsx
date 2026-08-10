"use client";

import { PageSection, usePixelatedConfig } from "@pixelated-tech/components";
import { SmartImage } from "@pixelated-tech/components";

export default function Header() {
	const config = usePixelatedConfig();
    
	return (
		<>
			<PageSection columns={1} id="header-section">
				<SmartImage
					id="logo"
					src="/images/amava-logo.png"
					alt={config?.siteInfo?.name ? `${config.siteInfo.name} Logo` : "Site Logo"}
					width={448}
					height={123}
				/>
			</PageSection>
		</>
	);
}
