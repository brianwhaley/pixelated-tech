"use client";

import React from "react";
import { MenuAccordion } from "@pixelated-tech/components";
// import { getAccordionMenuData } from "../components/metadata/pixelated.metadata";
import siteConfig from '../data/siteconfig.json';
const allRoutes = siteConfig.routes;

// const menuItems = getAccordionMenuData(allRoutes);

export default function Nav() {
	return (
		<>
			<MenuAccordion menuItems={allRoutes} />
		</>
	);
}
