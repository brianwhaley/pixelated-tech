"use client";

import React from "react";
import { PageSection, MenuSimple, usePixelatedConfig } from "@pixelated-tech/components";

export default function Nav() {
	const pixelatedConfig = usePixelatedConfig();
	const routes = pixelatedConfig?.routes ?? [];

	// const menuItems = getAccordionMenuData(allRoutes);

	return (
		<>
			<PageSection columns={1} maxWidth="100%" id="navigation-section" >
				<MenuSimple menuItems={routes} />
			</PageSection>
		</>
	);
}
