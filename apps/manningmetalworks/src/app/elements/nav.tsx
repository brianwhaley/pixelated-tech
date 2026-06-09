"use client";

import React from "react";
import { MenuSimple, usePixelatedConfig } from "@pixelated-tech/components";

// const menuItems = getAccordionMenuData(allRoutes);

export default function Nav() {
	const pixelatedConfig = usePixelatedConfig();
	const routes = pixelatedConfig?.routes ?? [];
	return (
		<>
			<MenuSimple menuItems={routes} />
		</>
	);
}
