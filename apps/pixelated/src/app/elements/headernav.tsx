"use client";

import React from "react";
import { MenuSimple, usePixelatedConfig } from "@pixelated-tech/components";

export default function HeaderNav() {
	const routes = usePixelatedConfig()?.routes ?? [];

	return (
		<>
			<MenuSimple menuItems={routes} />
		</>
	);
}
