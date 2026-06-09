"use client";

import React from "react";
import { MenuAccordion, usePixelatedConfig } from "@pixelated-tech/components";

export default function Nav() {
	const routes = usePixelatedConfig()?.routes ?? [];
	return (
		<>
			<MenuAccordion menuItems={routes} />
		</>
	);
}
