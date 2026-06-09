"use client";

import React from "react";
import { MenuAccordion, usePixelatedConfig } from "@pixelated-tech/components";
// import { getAccordionMenuData } from "../components/metadata/pixelated.metadata";

export default function Nav() {
	const pixelatedConfig = usePixelatedConfig();
	const routes = pixelatedConfig?.routes ?? [];

	// const menuItems = getAccordionMenuData(allRoutes);
	return (
		<MenuAccordion menuItems={routes} />
	);
}
	