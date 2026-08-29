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
				<a href="/">
					<SmartImage
						id="logo"
						src="/images/logo/oaktree-logo-horizontal.png"
						alt="Oaktree Landscaping"
						aboveFold={true}
						width={3500}
						height={811}
					/>
				</a>
			</PageSection>
		</>
	);
}
