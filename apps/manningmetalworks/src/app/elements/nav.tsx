"use client";

import React from "react";
import { MenuSimple } from "@pixelated-tech/components";
import siteConfig from '../data/siteconfig.json';
const allRoutes = siteConfig.routes;

// const menuItems = getAccordionMenuData(allRoutes);

export default function Nav() {
	return (
		<>
			<MenuSimple menuItems={allRoutes} />
		</>
	);
}
