"use client";

import React from "react";
import { MenuAccordion, usePixelatedConfig } from "@pixelated-tech/components";

export default function Nav() {
	const pixelatedConfig = usePixelatedConfig();
	const routes = pixelatedConfig?.routes as any[] ?? [];

	// const menuItems = getAccordionMenuData(allRoutes);
	return (
		<MenuAccordion menuItems={routes} />
	);
}
