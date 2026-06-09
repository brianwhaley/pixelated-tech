 
"use client";

import React from "react";
import { MenuSimple, usePixelatedConfig } from "@pixelated-tech/components";

/* 
const menuItems = allRoutes
	.filter((thisRoute) => thisRoute.name)
	.map((thisRoute) => (
		"routes" in thisRoute && Array.isArray((thisRoute as any).routes)
			? { [thisRoute.name]: (thisRoute as any).routes.map((subRoute: any) => ({ [subRoute.name]: subRoute.path })) }
			: { [thisRoute.name]: thisRoute.path }
	)).reduce((obj, item) => {
		if( typeof Object.values(item)[0] == "object") {
		// Nested Object
			const subitems = Object.values(item)[0];
			const newSubitems = subitems.reduce((obj2: any , item2: any) => {
				Object.assign(obj2, item2);
				return obj2;
			});
			Object.assign(obj, { [Object.keys(item)[0]]: newSubitems } );
			return obj;
		} else {
		// String
			Object.assign(obj, item);
			return obj; 
		}
	});
*/

export default function Nav() {
	const pixelatedConfig = usePixelatedConfig();
	const routes = pixelatedConfig?.routes ?? [];
	return (
		<div className="section-container">
			<hr />
			<MenuSimple menuItems={routes} />
			<hr />
		</div>
	);
}
