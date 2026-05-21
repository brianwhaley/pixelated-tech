"use client";

import React from "react";
import { PageSection } from "@pixelated-tech/components";
import { MenuSimple } from "@pixelated-tech/components";
import siteConfig from '../data/siteconfig.json';
const allRoutes = siteConfig.routes;

// const menuItems = getAccordionMenuData(allRoutes);

export default function Nav() {
	return (
		<>
			<PageSection columns={1} maxWidth="100%" id="navigation-section" >
				<MenuSimple menuItems={allRoutes} />
			</PageSection>
		</>
	);
}
