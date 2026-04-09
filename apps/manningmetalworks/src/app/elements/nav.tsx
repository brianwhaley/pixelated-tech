"use client";

import React from "react";
import { MenuSimple } from "@pixelated-tech/components";
import myroutes from '../data/routes.json';
const allRoutes = myroutes.routes;

// const menuItems = getAccordionMenuData(allRoutes);

export default function Nav() {
	return (
		<>
			<MenuSimple menuItems={allRoutes} />
		</>
	);
}
